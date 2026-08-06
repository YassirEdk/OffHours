import { createFileRoute, Link } from "@tanstack/react-router";
import { finishInstagramOauth } from "@/lib/instagramOauth";

/* /auth/instagram/callback — Instagram Login redirect target. Direct-IG
   login flow, no Facebook Page hop. */
export const Route = createFileRoute("/auth/instagram/callback")({
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

function InstagramGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="30"
      height="30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

function WarnGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 9v4M12 17h.01M4.93 19h14.14a2 2 0 0 0 1.73-3L13.73 4a2 2 0 0 0-3.46 0L3.2 16a2 2 0 0 0 1.73 3z" />
    </svg>
  );
}

function CallbackPage() {
  const result = Route.useLoaderData();

  if (result.ok) {
    return (
      <main className="conn-page">
        <section className="conn-card conn-card--ig">
          <span className="conn-eyebrow">
            <span className="conn-eyebrow-dot" aria-hidden="true" />
            Connection · Instagram
          </span>
          <span className="conn-icon" aria-hidden="true"><InstagramGlyph /></span>
          <h1 className="display conn-title">
            {result.igUsername ? (
              <>Welcome, <span className="conn-username">@{result.igUsername}</span></>
            ) : (
              <>Connected</>
            )}
          </h1>
          <p className="body-copy conn-copy">
            Your Instagram business account is now linked to your Offhours workspace.
            You can close this tab and head back to Settings.
          </p>
          <div className="conn-actions">
            <Link to="/" className="conn-primary">
              <span>Continue</span>
              <span className="conn-arrow" aria-hidden="true">→</span>
            </Link>
            <button
              type="button"
              className="conn-secondary"
              onClick={() => window.close()}
            >
              Close this tab
            </button>
          </div>
          <p className="conn-hint">
            <strong>Next:</strong> post-scheduling and DM features unlock once you add the
            advanced Instagram scopes via App Review. Basic connection is live now.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="conn-page">
      <section className="conn-card conn-card--error">
        <span className="conn-eyebrow">
          <span className="conn-eyebrow-dot" aria-hidden="true" />
          Connection · Instagram
        </span>
        <span className="conn-icon" aria-hidden="true"><WarnGlyph /></span>
        <h1 className="display conn-title">Couldn't connect</h1>
        <p className="conn-error-body">{result.error}</p>
        <p className="body-copy conn-copy">
          Common causes: the Instagram account isn't Business/Creator, the OAuth session
          expired, the redirect URI in the Instagram Login panel doesn't match, or this
          authorization code was already used (refreshing the callback page does that —
          start over from Settings).
        </p>
        <div className="conn-actions">
          <Link to="/" className="conn-primary">
            <span>Back to Settings</span>
            <span className="conn-arrow" aria-hidden="true">→</span>
          </Link>
          <button
            type="button"
            className="conn-secondary"
            onClick={() => window.close()}
          >
            Close this tab
          </button>
        </div>
      </section>
    </main>
  );
}

