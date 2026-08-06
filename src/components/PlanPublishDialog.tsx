import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { usePackContext } from "@/context/PackContext";
import { createPlan, type PlannedPost } from "@/lib/plannedPosts";

const CLOSE_MS = 380;

/* Suggested day-of-week + hour slots — rough Instagram peaks that apply
   broadly for small-business audiences. Not gospel; the user can edit. */
const SUGGESTIONS: { label: string; addDays: number; hour: number; minute: number }[] = [
  { label: "Tue lunchtime",   addDays: dayOffsetTo(2), hour: 12, minute: 0 },
  { label: "Wed evening",     addDays: dayOffsetTo(3), hour: 18, minute: 30 },
  { label: "Fri morning",     addDays: dayOffsetTo(5), hour: 9,  minute: 0 },
  { label: "Sat late morning", addDays: dayOffsetTo(6), hour: 11, minute: 0 },
  { label: "Sun evening",     addDays: dayOffsetTo(0), hour: 19, minute: 0 },
];

function dayOffsetTo(targetDow: number): number {
  const today = new Date().getDay();
  const diff = (targetDow - today + 7) % 7;
  return diff === 0 ? 7 : diff;
}

function suggestionToIso(s: typeof SUGGESTIONS[number]): string {
  const d = new Date();
  d.setDate(d.getDate() + s.addDays);
  d.setHours(s.hour, s.minute, 0, 0);
  return d.toISOString();
}

function isoToLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(v: string): string {
  if (!v) return "";
  return new Date(v).toISOString();
}

export function PlanPublishDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { pack, brief } = usePackContext();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlannedPost[]>([]);

  const ideas = useMemo(() => pack?.ideas ?? [], [pack]);

  /* Prefill each idea's slot with today+i evening — spread five posts across
     five different days by default. Users override via inputs or suggestion
     chips. New URL every save, so we always seed fresh — no user_metadata
     lookup needed. */
  useEffect(() => {
    if (!open) return;
    const seeded = ideas.map((idea, i) => {
      const d = new Date();
      d.setDate(d.getDate() + (i + 1));
      d.setHours(18, 0, 0, 0);
      return {
        kind: idea.kind,
        hook: idea.captions[0]?.hook ?? idea.title,
        scheduledAt: d.toISOString(),
      };
    });
    setPlan(seeded);
    setError(null);
    setNotice(null);
  }, [open, ideas]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const t = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, CLOSE_MS);
    return () => window.clearTimeout(t);
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || typeof document === "undefined") return null;

  const igMeta = ((user?.user_metadata ?? {}) as { instagram?: { igUsername?: string | null } }).instagram;
  const igConnected = !!igMeta?.igUsername;

  const updatePost = (i: number, patch: Partial<PlannedPost>) =>
    setPlan((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const applySuggestion = (i: number, s: typeof SUGGESTIONS[number]) =>
    updatePost(i, { scheduledAt: suggestionToIso(s) });

  const applySuggestionAll = (s: typeof SUGGESTIONS[number]) => {
    setPlan((prev) =>
      prev.map((p, idx) => {
        const iso = suggestionToIso(s);
        const d = new Date(iso);
        d.setDate(d.getDate() + idx * 2);
        return { ...p, scheduledAt: d.toISOString() };
      }),
    );
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("You need to be signed in to save a plan.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const { id } = await createPlan({
        data: {
          userId: user.id,
          posts: plan,
          briefName: brief?.name ?? null,
        },
      });
      onClose();
      navigate({ to: "/plan/$id", params: { id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the plan.");
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className={`settings-scrim${closing ? " settings-scrim--closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Plan publish"
    >
      <button className="settings-backdrop" aria-label="Close" onClick={onClose} type="button" />
      <form
        className={`settings-panel plan-panel${closing ? " settings-panel--closing" : ""}`}
        onSubmit={onSubmit}
      >
        <header className="settings-head">
          <div>
            <p className="mono-label">Plan · publish</p>
            <h2 className="display settings-title mt-2">Schedule your pack</h2>
          </div>
          <button type="button" className="settings-close" aria-label="Close" onClick={onClose}>×</button>
        </header>

        <div className="settings-body plan-body">
          {!igConnected && (
            <p className="plan-warn">
              <strong>Not connected to Instagram.</strong> You can save a plan now and connect later — nothing auto-publishes until you link an account in Settings.
            </p>
          )}
          <div className="plan-suggestions">
            <span className="mono-label">Suggested slots · apply to all</span>
            <div className="plan-suggestion-row">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  className="chip"
                  onClick={() => applySuggestionAll(s)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {plan.length === 0 && (
            <p className="settings-hint mt-4">Generate a pack first — there's nothing to plan yet.</p>
          )}

          <ul className="plan-list">
            {plan.map((p, i) => (
              <li key={i} className="plan-row">
                <div className="plan-row-head">
                  <span className="plan-row-index">Post {i + 1}</span>
                  <span className="plan-row-kind">{p.kind}</span>
                </div>
                <p className="plan-row-hook">"{p.hook}"</p>
                <div className="plan-row-controls">
                  <label className="plan-field">
                    <span className="mono-label">When</span>
                    <input
                      type="datetime-local"
                      className="settings-input"
                      value={isoToLocalInput(p.scheduledAt)}
                      onChange={(e) => updatePost(i, { scheduledAt: localInputToIso(e.target.value) })}
                    />
                  </label>
                  <div className="plan-row-suggestions">
                    {SUGGESTIONS.slice(0, 3).map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        className="chip chip--sm"
                        onClick={() => applySuggestion(i, s)}
                        title={`Set to ${s.label}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {error && <p className="auth-error mt-3" role="alert">{error}</p>}
          {notice && <p className="auth-notice mt-3" role="status">{notice}</p>}

          <p className="plan-note">
            <strong>Note:</strong> saving stores your plan on your account. Automatic publishing to Instagram needs the <code>instagram_content_publish</code> permission (App Review) plus a scheduler — until then, use the plan as a copy-and-post checklist.
          </p>
        </div>

        <footer className="settings-foot">
          <span className="settings-hint">{plan.length} posts</span>
          <div className="settings-foot-right">
            <button type="button" className="chip" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="pill-cta" disabled={saving || plan.length === 0}>
              <span className="fill" />
              <span>{saving ? "Saving…" : "Save plan"}</span>
              <span className="arrow">→</span>
            </button>
          </div>
        </footer>
      </form>
    </div>,
    document.body,
  );
}
