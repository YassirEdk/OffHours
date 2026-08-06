import { createServerFn } from "@tanstack/react-start";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/* Instagram / Facebook OAuth — thin server wrapper around Meta's Facebook
   Login for Business + Instagram Graph API.

   Flow:
     1) Client asks the server for an authorize URL scoped to this user.
        `startInstagramOauth` signs a `state` param with the user id so the
        callback can prove which account is being connected.
     2) User is redirected to Facebook, approves scopes, is bounced back to
        /auth/facebook/callback?code=…&state=…
     3) The callback route runs `finishInstagramOauth`: verifies the state,
        exchanges the code for a short-lived token, upgrades it to a long-
        lived one, resolves the linked Facebook Page + Instagram business
        account, and writes the result to the user's Supabase user_metadata.

   Env vars required (both must be set in Vercel):
     FB_APP_ID           — Meta app ID
     FB_APP_SECRET       — Meta app secret (server-only, never expose to client)
     FB_OAUTH_SECRET     — random string used to HMAC-sign the state param
     FB_REDIRECT_URI     — must exactly match one of the Valid OAuth Redirect
                           URIs in the Meta app config, e.g.
                           https://offhours-ten.vercel.app/auth/facebook/callback
     SUPABASE_URL        — same base URL as VITE_SUPABASE_URL
     SUPABASE_SERVICE_ROLE_KEY — service role key; used to write the token
                                 into the user's metadata after callback. */

const GRAPH = "https://graph.facebook.com/v21.0";

/* Scopes for posting + read + DMs. instagram_manage_messages needs App
   Review + business verification; the rest are approvable with Login for
   Business scope requests. */
const SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_messages",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
].join(",");

const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

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

/* Called from the client — returns a full authorize URL the browser can
   `window.location.href` to. Signs `state` server-side so the client can't
   tamper with which user id ends up connected. */
export const startInstagramOauth = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { userId: string })
  .handler(async ({ data }): Promise<{ url: string }> => {
    const appId = requireEnv("FB_APP_ID");
    const redirectUri = requireEnv("FB_REDIRECT_URI");
    const state = signState(data.userId);
    const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    return { url: url.toString() };
  });

/* Called from the OAuth callback route with the ?code=…&state=… params
   Facebook sent back. Does all the exchanges and writes the resulting
   connection object to the user's metadata. */
export const finishInstagramOauth = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { code: string; state: string })
  .handler(async ({ data }): Promise<{ ok: true; igUsername: string | null }> => {
    const appId = requireEnv("FB_APP_ID");
    const appSecret = requireEnv("FB_APP_SECRET");
    const redirectUri = requireEnv("FB_REDIRECT_URI");
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    const { userId } = verifyState(data.state);

    // 1. code → short-lived user access token
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

    // 3. list pages, pick the first — most connected users have one Page
    const pagesRes = await fetch(`${GRAPH}/me/accounts?access_token=${userToken}`);
    if (!pagesRes.ok) throw new Error(`Pages fetch failed: ${await pagesRes.text()}`);
    const pages = (await pagesRes.json()) as {
      data: { id: string; name: string; access_token: string }[];
    };
    const page = pages.data[0];
    if (!page) throw new Error("No Facebook Page found on this account.");

    // 4. resolve the IG business account linked to that page
    const igRes = await fetch(
      `${GRAPH}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
    );
    if (!igRes.ok) throw new Error(`IG lookup failed: ${await igRes.text()}`);
    const igLink = (await igRes.json()) as { instagram_business_account?: { id: string } };
    const igId = igLink.instagram_business_account?.id;
    if (!igId) {
      throw new Error(
        "No Instagram Business account is linked to that Page. Convert the IG account to Business/Creator and link it in Facebook Page Settings.",
      );
    }

    // 5. optional: pull username for a nicer confirmation
    let igUsername: string | null = null;
    try {
      const userRes = await fetch(
        `${GRAPH}/${igId}?fields=username&access_token=${page.access_token}`,
      );
      if (userRes.ok) {
        const j = (await userRes.json()) as { username?: string };
        igUsername = j.username ?? null;
      }
    } catch {
      // non-fatal
    }

    // 6. store on the user's Supabase metadata via the service role client
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
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token,
        userAccessToken: userToken,
        igUserId: igId,
        igUsername,
      },
    };
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: nextMeta,
    });
    if (updErr) throw new Error(`Supabase updateUser failed: ${updErr.message}`);

    return { ok: true, igUsername };
  });
