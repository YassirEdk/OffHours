import { createServerFn } from "@tanstack/react-start";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/* Facebook Login for Business flow. User logs in with their Facebook
   account and approves scopes on the FB Page + linked Instagram Business
   account. Complementary to instagramOauth.ts which uses Instagram Login. */

const FB_AUTHORIZE = "https://www.facebook.com/v21.0/dialog/oauth";
const GRAPH = "https://graph.facebook.com/v21.0";

const BASE_SCOPES = ["pages_show_list", "pages_read_engagement"];
const _ADVANCED_SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_messages",
  "business_management",
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

export const startFacebookOauth = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { userId: string })
  .handler(async ({ data }): Promise<{ url: string }> => {
    const appId = requireEnv("FB_APP_ID");
    const redirectUri = requireEnv("FB_REDIRECT_URI");
    const state = signState(data.userId);
    const url = new URL(FB_AUTHORIZE);
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    return { url: url.toString() };
  });

export const finishFacebookOauth = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { code: string; state: string })
  .handler(async ({ data }): Promise<{ ok: true; pageName: string | null }> => {
    const appId = requireEnv("FB_APP_ID");
    const appSecret = requireEnv("FB_APP_SECRET");
    const redirectUri = requireEnv("FB_REDIRECT_URI");
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    const { userId } = verifyState(data.state);

    // 1. code → short-lived user token
    const tokenUrl = new URL(`${GRAPH}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", data.code);
    const tokRes = await fetch(tokenUrl);
    if (!tokRes.ok) throw new Error(`Token exchange failed: ${await tokRes.text()}`);
    const { access_token: shortToken } = (await tokRes.json()) as { access_token: string };

    // 2. short-lived → long-lived (~60 days)
    const longUrl = new URL(`${GRAPH}/oauth/access_token`);
    longUrl.searchParams.set("grant_type", "fb_exchange_token");
    longUrl.searchParams.set("client_id", appId);
    longUrl.searchParams.set("client_secret", appSecret);
    longUrl.searchParams.set("fb_exchange_token", shortToken);
    const longRes = await fetch(longUrl);
    if (!longRes.ok) throw new Error(`Long-lived exchange failed: ${await longRes.text()}`);
    const long = (await longRes.json()) as { access_token: string; expires_in?: number };
    const userToken = long.access_token;
    const expiresAt = long.expires_in ? Date.now() + long.expires_in * 1000 : null;

    // 3. list pages, pick the first
    const pagesRes = await fetch(`${GRAPH}/me/accounts?access_token=${userToken}`);
    if (!pagesRes.ok) throw new Error(`Pages fetch failed: ${await pagesRes.text()}`);
    const pages = (await pagesRes.json()) as {
      data: { id: string; name: string; access_token: string }[];
    };
    const page = pages.data[0] ?? null;

    // 4. write to supabase
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: current, error: getErr } = await admin.auth.admin.getUserById(userId);
    if (getErr) throw new Error(`Supabase getUser failed: ${getErr.message}`);
    const nextMeta = {
      ...(current.user?.user_metadata ?? {}),
      facebook: {
        connectedAt: Date.now(),
        expiresAt,
        userAccessToken: userToken,
        pageId: page?.id ?? null,
        pageName: page?.name ?? null,
        pageAccessToken: page?.access_token ?? null,
      },
    };
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: nextMeta,
    });
    if (updErr) throw new Error(`Supabase updateUser failed: ${updErr.message}`);

    return { ok: true, pageName: page?.name ?? null };
  });
