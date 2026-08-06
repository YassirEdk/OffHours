import { createFileRoute, Link } from "@tanstack/react-router";
import { finishFacebookOauth } from "@/lib/facebookOauth";

/* /auth/facebook/callback — Facebook Login for Business redirect target. */
export const Route = createFileRoute("/auth/facebook/callback")({
  head: () => ({
    meta: [
      { title: "Connecting Facebook — Offhours" },
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
      const res = await finishFacebookOauth({ data: { code: deps.code, state: deps.state } });
      return { ok: true as const, pageName: res.pageName };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
  },
  component: CallbackPage,
});

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
      <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.93.26-1.56 1.6-1.56H16.7V4.28c-.3-.04-1.36-.13-2.6-.13-2.57 0-4.33 1.57-4.33 4.45v2.2H7v3.2h2.77V22h3.73z" />
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
        <section className="conn-card conn-card--fb">
          <span className="conn-eyebrow">
            <span className="conn-eyebrow-dot" aria-hidden="true" />
            Connection · Facebook
          </span>
          <span className="conn-icon" aria-hidden="true"><FacebookGlyph /></span>
          <h1 className="display conn-title">
            {result.pageName ? (
              <>Connected · <span className="conn-username">{result.pageName}</span></>
            ) : (
              <>Connected</>
            )}
          </h1>
          <p className="body-copy conn-copy">
            {result.pageName
              ? "Your Facebook Page is now linked to your Offhours workspace. Close this tab and head back to Settings."
              : "Your Facebook account is linked — but no Facebook Page was found. Publishing features need a Page connected to your account."}
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
            advanced Instagram Graph scopes via App Review.
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
          Connection · Facebook
        </span>
        <span className="conn-icon" aria-hidden="true"><WarnGlyph /></span>
        <h1 className="display conn-title">Couldn't connect</h1>
        <p className="conn-error-body">{result.error}</p>
        <p className="body-copy conn-copy">
          Try again from Settings. Refreshing this page won't work — OAuth codes are
          single-use and Meta will reject a retry.
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
