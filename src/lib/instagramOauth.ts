import { createServerFn } from "@tanstack/react-start";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/* Instagram OAuth — uses Meta's "Instagram API with Instagram Login" flow.
   The user logs in with their Instagram credentials directly (no Facebook
   Page hop required). Requires the IG account to be Business/Creator.

   Flow:
     1) Client calls startInstagramOauth → gets an authorize URL with a
        signed `state` param carrying the user id.
     2) User is redirected to instagram.com, approves, is bounced back to
        FB_REDIRECT_URI?code=&state=
     3) finishInstagramOauth verifies state, exchanges code → short-lived
        token → long-lived (60 day) token, fetches the IG account
        info, writes it to Supabase user_metadata.

   Env vars (server-only unless noted):
     IG_APP_ID           — from Meta app → Products → Instagram → API setup
                           with Instagram login → "ID d'app Instagram"
     IG_APP_SECRET       — same panel, "Clé secrète Instagram"
     FB_OAUTH_SECRET     — random 32+ char string used to HMAC-sign the
                           OAuth state param
     IG_REDIRECT_URI     — must exactly match the Valid OAuth Redirect URI
                           set in the Instagram Login panel, e.g.
                           https://offhours-ten.vercel.app/auth/instagram/callback
     SUPABASE_URL        — same base URL as VITE_SUPABASE_URL
     SUPABASE_SERVICE_ROLE_KEY — service role key; used to write the token
                                 into user metadata after callback */

const IG_AUTHORIZE = "https://www.instagram.com/oauth/authorize";
const IG_TOKEN = "https://api.instagram.com/oauth/access_token";
const IG_GRAPH = "https://graph.instagram.com";

/* Two-tier scope list — Meta requires App Review for publish/messages, but
   instagram_business_basic works immediately for you as app admin. */
const BASE_SCOPES = ["instagram_business_basic"];
const _ADVANCED_SCOPES = [
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
  "instagram_business_content_publish",
  "instagram_business_manage_insights",
];
const SCOPES = BASE_SCOPES.join(",");

const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function signState(userId: string): string {
  const secret = requireEnv("FB_OAUTH_SECRET");
  const payload = `${userId}.${Date.now()}.${crypto.randomBytes(8).toString("hex")}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

function verifyState(state: string): { userId: string } {
  const secret = requireEnv("FB_OAUTH_SECRET");
  const decoded = Buffer.from(state, "base64url").toString("utf8");
  const parts = decoded.split(".");
  if (parts.length !== 4) throw new Error("Malformed state");
  const [userId, ts, nonce, sig] = parts;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${userId}.${ts}.${nonce}`)
    .digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
    throw new Error("Invalid state signature");
  }
  if (Date.now() - Number(ts) > STATE_MAX_AGE_MS) throw new Error("State expired");
  return { userId };
}

export const startInstagramOauth = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { userId: string })
  .handler(async ({ data }): Promise<{ url: string }> => {
    const clientId = requireEnv("IG_APP_ID");
    const redirectUri = requireEnv("IG_REDIRECT_URI");
    const state = signState(data.userId);
    const url = new URL(IG_AUTHORIZE);
    url.searchParams.set("enable_fb_login", "0");
    url.searchParams.set("force_authentication", "1");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("state", state);
    return { url: url.toString() };
  });

export const finishInstagramOauth = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { code: string; state: string })
  .handler(async ({ data }): Promise<{ ok: true; igUsername: string | null }> => {
    const clientId = requireEnv("IG_APP_ID");
    const clientSecret = requireEnv("IG_APP_SECRET");
    const redirectUri = requireEnv("IG_REDIRECT_URI");
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    const { userId } = verifyState(data.state);

    // 1. code → short-lived user token (1 hour)
    const form = new URLSearchParams();
    form.set("client_id", clientId);
    form.set("client_secret", clientSecret);
    form.set("grant_type", "authorization_code");
    form.set("redirect_uri", redirectUri);
    form.set("code", data.code);
    const shortRes = await fetch(IG_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (!shortRes.ok) throw new Error(`Token exchange failed: ${await shortRes.text()}`);
    const shortJson = (await shortRes.json()) as {
      access_token: string;
      user_id: number;
    };

    // 2. short-lived → long-lived (~60 days)
    const longUrl = new URL(`${IG_GRAPH}/access_token`);
    longUrl.searchParams.set("grant_type", "ig_exchange_token");
    longUrl.searchParams.set("client_secret", clientSecret);
    longUrl.searchParams.set("access_token", shortJson.access_token);
    const longRes = await fetch(longUrl);
    if (!longRes.ok) throw new Error(`Long-lived exchange failed: ${await longRes.text()}`);
    const longJson = (await longRes.json()) as {
      access_token: string;
      token_type?: string;
      expires_in?: number;
    };
    const igToken = longJson.access_token;
    const expiresAt = longJson.expires_in ? Date.now() + longJson.expires_in * 1000 : null;

    // 3. fetch IG account details
    const meUrl = new URL(`${IG_GRAPH}/v21.0/me`);
    meUrl.searchParams.set("fields", "id,user_id,username,account_type");
    meUrl.searchParams.set("access_token", igToken);
    const meRes = await fetch(meUrl);
    if (!meRes.ok) throw new Error(`IG /me failed: ${await meRes.text()}`);
    const me = (await meRes.json()) as {
      id: string;
      user_id?: string;
      username?: string;
      account_type?: string;
    };

    // 4. store on Supabase user_metadata via service role client
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: current, error: getErr } = await admin.auth.admin.getUserById(userId);
    if (getErr) throw new Error(`Supabase getUser failed: ${getErr.message}`);
    const nextMeta = {
      ...(current.user?.user_metadata ?? {}),
      instagram: {
        connectedAt: Date.now(),
        expiresAt,
        accessToken: igToken,
        igUserId: me.id,
        igUsername: me.username ?? null,
        accountType: me.account_type ?? null,
      },
    };
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: nextMeta,
    });
    if (updErr) throw new Error(`Supabase updateUser failed: ${updErr.message}`);

    return { ok: true, igUsername: me.username ?? null };
  });
