import { createFileRoute, Link } from "@tanstack/react-router";
import { finishInstagramOauth } from "@/lib/instagramOauth";

/* /auth/facebook/callback — Meta redirects the browser here with ?code=&state=
   (or ?error= if the user denied). The loader runs on the server, exchanges
   the code for a token, resolves the linked IG business account, and writes
   the connection onto the current user's Supabase metadata.

   State is HMAC-signed with the user id inside; see src/lib/instagramOauth.ts. */
export const Route = createFileRoute("/auth/facebook/callback")({
  head: () => ({
    meta: [
      { title: "Connecting Instagram — Offhours" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search["code"] === "string" ? (search["code"] as string) : undefined,
    state: typeof search["state"] === "string" ? (search["state"] as string) : undefined,
    error: typeof search["error"] === "string" ? (search["error"] as string) : undefined,
    error_description:
      typeof search["error_description"] === "string"
        ? (search["error_description"] as string)
        : undefined,
  }),
  loaderDeps: ({ search }) => ({
    code: search.code,
    state: search.state,
    error: search.error,
    error_description: search.error_description,
  }),
  loader: async ({ deps }) => {
    if (deps.error) {
      return { ok: false as const, error: deps.error_description || deps.error };
    }
    if (!deps.code || !deps.state) {
      return { ok: false as const, error: "Missing code or state." };
    }
    try {
      const res = await finishInstagramOauth({ data: { code: deps.code, state: deps.state } });
      return { ok: true as const, igUsername: res.igUsername };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
  },
  component: CallbackPage,
});

function CallbackPage() {
  const result = Route.useLoaderData();
  return (
    <main className="legal-page">
      <article className="legal-body">
        <p className="mono-label">Connection · Instagram</p>
        {result.ok ? (
          <>
            <h1 className="display legal-title mt-4">Connected</h1>
            <p className="body-copy mt-4 max-w-[62ch] opacity-85">
              {result.igUsername
                ? `Instagram account @${result.igUsername} is now linked to your Offhours account.`
                : "Your Instagram business account is now linked to your Offhours account."}
              You can post and manage messages from Settings once the feature ships.
            </p>
          </>
        ) : (
          <>
            <h1 className="display legal-title mt-4">Couldn't connect</h1>
            <p className="body-copy mt-4 max-w-[62ch] opacity-85">
              {result.error}
            </p>
            <p className="body-copy mt-2 max-w-[62ch] opacity-70">
              Common causes: the Instagram account isn't Business/Creator, isn't linked to a
              Facebook Page, or the OAuth session expired. Try again from Settings.
            </p>
          </>
        )}
        <p className="mt-8">
          <Link to="/" className="legal-link">← Back home</Link>
        </p>
      </article>
    </main>
  );
}
