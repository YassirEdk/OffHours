import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPlan, deletePlan, type PlanRow } from "@/lib/plannedPosts";

/* /plan/$id — owner-only view of a saved publish plan.

   Access rule: the plan is only shown to the currently authenticated user
   whose id matches the plan's user_id. Non-owners (including guests) get an
   access-denied screen; the plan data itself never leaves the server. */
export const Route = createFileRoute("/plan/$id")({
  head: () => ({
    meta: [
      { title: "Your publish plan — Offhours" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<
    | { kind: "loading" }
    | { kind: "denied" }
    | { kind: "ok"; plan: PlanRow }
    | { kind: "error"; message: string }
  >({ kind: "loading" });
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setStatus({ kind: "denied" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { plan } = await getPlan({ data: { id, userId: user.id } });
        if (cancelled) return;
        if (!plan) setStatus({ kind: "denied" });
        else setStatus({ kind: "ok", plan });
      } catch (err) {
        if (cancelled) return;
        setStatus({
          kind: "error",
          message: err instanceof Error ? err.message : "Couldn't load the plan.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user, authLoading]);

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/plan/${id}` : `/plan/${id}`;
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const onDelete = async () => {
    if (!user) return;
    if (!window.confirm("Delete this plan? This can't be undone.")) return;
    setDeleting(true);
    try {
      await deletePlan({ data: { id, userId: user.id } });
      window.location.href = "/";
    } catch (err) {
      setDeleting(false);
      alert(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  if (status.kind === "loading" || authLoading) {
    return (
      <main className="plan-page">
        <p className="mono-label opacity-60">Loading plan…</p>
      </main>
    );
  }

  if (status.kind === "denied") {
    return (
      <main className="plan-page">
        <article className="plan-page-body">
          <p className="mono-label">Access · restricted</p>
          <h1 className="display legal-title mt-4">This plan is private</h1>
          <p className="body-copy mt-4 max-w-[52ch] opacity-85">
            Publish plans are visible only to the account that created them. If this is
            yours, log in with the same account. Otherwise there's nothing to see here.
          </p>
          <p className="mt-6">
            <Link to="/" className="legal-link">← Back home</Link>
          </p>
        </article>
      </main>
    );
  }

  if (status.kind === "error") {
    return (
      <main className="plan-page">
        <article className="plan-page-body">
          <p className="mono-label">Plan · error</p>
          <h1 className="display legal-title mt-4">Couldn't load the plan</h1>
          <p className="conn-error-body">{status.message}</p>
          <p className="mt-6">
            <Link to="/" className="legal-link">← Back home</Link>
          </p>
        </article>
      </main>
    );
  }

  const { plan } = status;
  const formatWhen = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="plan-page">
      <article className="plan-page-body">
        <header className="plan-page-head">
          <div>
            <p className="mono-label">Plan · publish</p>
            <h1 className="display legal-title mt-3">
              {plan.brief_name ? `${plan.brief_name} — schedule` : "Your publish schedule"}
            </h1>
            <p className="body-copy mt-3 opacity-70">
              Created {new Date(plan.created_at).toLocaleString()}
            </p>
          </div>
          <div className="plan-page-actions">
            <button type="button" className="chip" onClick={copyUrl}>
              {copied ? "Copied" : "Copy share link"}
            </button>
            <Link to="/pack" className="chip">
              ← Back to pack
            </Link>
            <button
              type="button"
              className="chip plan-page-delete"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete plan"}
            </button>
          </div>
        </header>

        <p className="plan-note mt-8">
          <strong>Note:</strong> the share link only works for you. Other logged-in
          accounts (and guests) will see "This plan is private". Nothing auto-publishes
          yet — this is the schedule to copy from until `instagram_content_publish` is
          approved and a scheduler is wired.
        </p>

        <ol className="plan-schedule">
          {plan.posts.map((p, i) => (
            <li key={i} className="plan-schedule-row">
              <div className="plan-schedule-head">
                <span className="plan-schedule-index">{String(i + 1).padStart(2, "0")}</span>
                <span className="plan-schedule-kind">{p.kind}</span>
                <span className="plan-schedule-when">{formatWhen(p.scheduledAt)}</span>
              </div>
              <p className="plan-schedule-hook">"{p.hook}"</p>
            </li>
          ))}
        </ol>
      </article>
    </main>
  );
}
