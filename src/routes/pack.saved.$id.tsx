import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getSavedPack, deleteSavedPack, type SavedPack } from "@/lib/savedPacks";
import { Logo } from "@/components/Logo";
import { AuthNav } from "@/components/AuthNav";
import { PostTemplate, pickTemplate } from "@/components/PostTemplate";
import { useBrand } from "@/context/BrandContext";
import { useSettings } from "@/context/SettingsContext";

/* /pack/saved/$id — owner-only view of a snapshot the user saved. Shows the
   captions and every generated image that was in the pack at save time.
   Auth-gated: non-owners see the "private" screen. */
export const Route = createFileRoute("/pack/saved/$id")({
  head: () => ({
    meta: [
      { title: "Saved pack — Offhours" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SavedPackPage,
});

function SavedPackPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<
    | { kind: "loading" }
    | { kind: "denied" }
    | { kind: "ok"; pack: SavedPack }
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
        const { pack } = await getSavedPack({ data: { id, userId: user.id } });
        if (cancelled) return;
        if (!pack) setStatus({ kind: "denied" });
        else setStatus({ kind: "ok", pack });
      } catch (err) {
        if (cancelled) return;
        setStatus({
          kind: "error",
          message: err instanceof Error ? err.message : "Couldn't load the pack.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user, authLoading]);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/pack/saved/${id}`
      : `/pack/saved/${id}`;
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  const onDelete = async () => {
    if (!user) return;
    if (!window.confirm("Delete this saved pack? This can't be undone.")) return;
    setDeleting(true);
    try {
      await deleteSavedPack({ data: { id, userId: user.id } });
      window.location.href = "/";
    } catch (err) {
      setDeleting(false);
      alert(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <>
      <div className="results-topbar">
        <Link to="/" aria-label="Offhours — back to home" className="results-topbar-logo">
          <Logo name="Offhours" className="header-logo" />
        </Link>
        <AuthNav />
      </div>
      <div className="results-page">
        {status.kind === "loading" || authLoading ? (
          <p className="mono-label opacity-60">Loading saved pack…</p>
        ) : status.kind === "denied" ? (
          <article className="plan-page-body">
            <p className="mono-label">Access · restricted</p>
            <h1 className="display legal-title mt-4">This pack is private</h1>
            <p className="body-copy mt-4 max-w-[52ch] opacity-85">
              Saved packs are only visible to the account that created them.
            </p>
            <p className="mt-6">
              <Link to="/" className="legal-link">← Back home</Link>
            </p>
          </article>
        ) : status.kind === "error" ? (
          <article className="plan-page-body">
            <p className="mono-label">Pack · error</p>
            <h1 className="display legal-title mt-4">Couldn't load the pack</h1>
            <p className="conn-error-body">{status.message}</p>
            <p className="mt-6">
              <Link to="/" className="legal-link">← Back home</Link>
            </p>
          </article>
        ) : (
          <SavedPackView
            pack={status.pack}
            shareUrl={shareUrl}
            onCopy={copyUrl}
            copied={copied}
            onDelete={onDelete}
            deleting={deleting}
          />
        )}
      </div>
    </>
  );
}

function SavedPackView({
  pack,
  onCopy,
  copied,
  onDelete,
  deleting,
}: {
  pack: SavedPack;
  shareUrl: string;
  onCopy: () => void;
  copied: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  const p = pack.pack;
  const { imageDataUrl: brandLogo } = useBrand();
  const { settings } = useSettings();
  const logoDataUrl = settings.company.logo || brandLogo;
  const primaryColor = settings.company.primaryColor || "#D8FF3E";
  const logoPlacement = settings.imageStyle.logoPlacement;

  return (
    <>
      <header className="results-head">
        <div className="results-head-brand">
          <div>
            <p className="mono-label">Saved pack · {new Date(pack.created_at).toLocaleString()}</p>
            <h1 className="display-cond mt-2 text-[clamp(1.6rem,4vw,2.6rem)]">
              {pack.brief_name || "Untitled pack"}
            </h1>
          </div>
        </div>
        <div className="results-head-actions">
          <button type="button" className="chip" onClick={onCopy}>
            {copied ? "Copied" : "Copy share link"}
          </button>
          <Link to="/" className="chip">← Home</Link>
          <button
            type="button"
            className="chip plan-page-delete"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </header>

      <ol className="results-ideas">
        {p.ideas.map((idea, i) => (
          <li key={idea.kind} className="results-idea">
            <div className="results-idea-head">
              <span className="mono-label">
                {String(i + 1).padStart(2, "0")} · {idea.kind}
              </span>
              <h2 className="display-cond mt-2 text-[clamp(1.2rem,2.4vw,1.8rem)]">{idea.title}</h2>
              <p className="body-copy mt-2 max-w-[64ch]">{idea.premise}</p>
              <p className="mono-label mt-3 opacity-70">Format · {idea.format}</p>
            </div>

            <div className="results-captions">
              {idea.captions.map((cap, ci) => {
                const key = `${i}-${ci}`;
                const img = pack.images[key];
                const template = pickTemplate(i * 31 + ci * 7);
                return (
                  <article key={ci} className="results-caption">
                    <div className="results-caption-head">
                      <span className="mono-label">Caption {String.fromCharCode(65 + ci)}</span>
                    </div>
                    <p className="mono-label mt-4">Hook</p>
                    <p className="display-card mt-1 text-[clamp(1rem,1.5vw,1.2rem)] leading-[1.2]">
                      {cap.hook}
                    </p>
                    <p className="body-copy mt-4 whitespace-pre-line">{cap.body}</p>
                    <p className="mono-label mt-4">CTA</p>
                    <p className="mt-1 font-mono text-[0.7rem] leading-[1.7] tracking-[0.12em] uppercase text-[var(--accent)]">
                      → {cap.cta}
                    </p>
                    {img ? (
                      <div className="results-image-slot">
                        <div className="results-generated-image results-composite-wrap">
                          <PostTemplate
                            template={template}
                            hook={cap.hook}
                            cta={cap.cta}
                            bgSrc={img}
                            logoSrc={logoDataUrl}
                            primaryColor={primaryColor}
                            businessName={pack.brief_name || ""}
                            logoPlacement={logoPlacement}
                          />
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <div className="results-hashtags">
              <p className="mono-label">Hashtags · {idea.hashtags.length}</p>
              <p className="mt-2 font-mono text-[0.7rem] leading-[1.9] tracking-[0.06em] text-[rgba(245,243,239,0.6)]">
                {idea.hashtags.join(" ")}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
