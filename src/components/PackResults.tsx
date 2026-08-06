import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toPng } from "html-to-image";
import { usePack, usePackContext } from "@/context/PackContext";
import { useBrand } from "@/context/BrandContext";
import { useAuth } from "@/context/AuthContext";
import { GOAL_LABEL, PLATFORM_LABEL, type Caption } from "@/lib/pack";
import { packToText } from "@/lib/export";
import { generateCaptionImage } from "@/lib/generateImage";
import { PostTemplate, TEMPLATE_COUNT, pickTemplate } from "./PostTemplate";
import { Logo } from "./Logo";
import { PlanPublishDialog } from "./PlanPublishDialog";

/* A plain readable view of the generated pack: brief at the top, brand
   settings, then each of the five ideas with its three captions and hashtag
   set. Each caption has its own image-generation button, so the user can spin
   up a post visual per variant. */

export function PackResults() {
  const pack = usePack();
  const { isExample, status, error } = usePackContext();
  const { brief } = pack;
  const { user } = useAuth();
  const [copiedAll, setCopiedAll] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(packToText(pack));
    } catch {
      /* clipboard unavailable — the button still confirms so the UI doesn't stall */
    }
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1600);
  };

  return (
    <div className="results-page">
      <header className="results-head">
        <div className="results-head-brand">
          <Link to="/" aria-label="Offhours — back to home" className="results-head-logo">
            <Logo name="Offhours" className="header-logo" />
          </Link>
          <div>
            <p className="mono-label">
              {isExample ? "The example pack" : "Your generated pack"}
            </p>
            <h1 className="display-cond mt-2 text-[clamp(1.6rem,4vw,2.6rem)]">
              {brief.name} — {brief.business}
            </h1>
          </div>
        </div>
        <div className="results-head-actions">
          <button type="button" className="chip" onClick={copyAll}>
            {copiedAll ? "Copied" : "Copy the whole pack"}
          </button>
          {!isExample && user ? (
            <button
              type="button"
              className="pill-cta plan-publish-btn"
              onClick={() => setPlanOpen(true)}
              disabled={status === "generating"}
            >
              <span className="fill" />
              <span>Plan publish</span>
              <span className="arrow">→</span>
            </button>
          ) : null}
          <Link to="/" className="chip">
            ← Back
          </Link>
        </div>
      </header>
      <PlanPublishDialog open={planOpen} onClose={() => setPlanOpen(false)} />

      {status === "error" ? (
        <p className="results-status results-status--error">
          Groq failed ({error}) — showing the fallback pack.
        </p>
      ) : null}

      {/* While Groq is thinking, hide the deterministic fallback cards entirely
         — a page full of placeholder captions the user hasn't asked for reads
         as slop. Show only the brief they submitted and an active loading
         state, so they know the real content is on its way. */}
      {status === "generating" ? (
        <GeneratingState brief={brief} />
      ) : (
        <>
          <BrandSettings />

          <dl className="results-brief">
            {[
              ["Audience", brief.audience],
              ["Platform", brief.platforms.map((p) => PLATFORM_LABEL[p]).join(" + ")],
              ["Goal", GOAL_LABEL[brief.goal]],
              ["Niche", brief.niche],
              ["Tone", brief.tone.join(" · ")],
              ["Promise", brief.promise],
            ].map(([k, v]) => (
              <div key={k} className="results-brief-row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          <ol className="results-ideas">
            {pack.ideas.map((idea, i) => (
          <li key={idea.kind} className="results-idea">
            <div className="results-idea-head">
              <span className="mono-label">
                {String(i + 1).padStart(2, "0")} · {idea.kind}
              </span>
              <h2 className="display-cond mt-2 text-[clamp(1.2rem,2.4vw,1.8rem)]">
                {idea.title}
              </h2>
              <p className="body-copy mt-2 max-w-[64ch]">{idea.premise}</p>
              <p className="mono-label mt-3 opacity-70">Format · {idea.format}</p>
            </div>

            <div className="results-captions">
              {idea.captions.map((cap, ci) => (
                <CaptionCard
                  key={ci}
                  cap={cap}
                  label={String.fromCharCode(65 + ci)}
                  ideaKind={idea.kind}
                  businessName={brief.name}
                  businessType={brief.business}
                  niche={brief.niche}
                  /* Stable per (idea, caption) so the same post keeps its layout
                     across re-renders and image regenerations; a new caption or
                     a new idea rolls a different one. */
                  templateSeed={i * 31 + ci * 7}
                />
              ))}
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

          <section className="results-cadence">
            <p className="mono-label">Weekly cadence</p>
            <dl className="mt-3">
              {pack.cadence.map((c) => (
                <div key={c.day} className="results-cadence-row">
                  <dt>{c.day}</dt>
                  <dd>{c.idea}</dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      )}
    </div>
  );
}

/* Brand settings — a small collapsible bar. Everything is saved to
   localStorage in BrandContext, so the user only sets these once per browser. */
/* Full-page loading state shown while Groq writes the pack. Cycles a
   handful of status lines every ~1.6s so it feels active — a static
   "Loading…" reads as stuck when the request takes 10-25 seconds. */
function GeneratingState({ brief }: { brief: { name: string; niche: string; audience: string } }) {
  const messages = [
    `Reading your brief for ${brief.name || "your business"}…`,
    `Thinking about the ${brief.niche || "niche"} audience…`,
    `Drafting the proof post — the four-hour invoice…`,
    `Writing the opinion post — the one that says "no"…`,
    `Building the receipt — one client, real numbers…`,
    `Rolling up hashtags — niche-first, no filler…`,
    `Almost there — 15 captions, hooks and CTAs…`,
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % messages.length), 1600);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <section className="results-generating" aria-live="polite">
      <div className="results-generating-spinner" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="mono-label opacity-70">Analysing</p>
      <h2 className="display-cond mt-2 text-[clamp(1.4rem,3vw,2.2rem)]">
        Writing your pack…
      </h2>
      <p className="body-copy mt-3 max-w-[52ch]" key={i}>
        {messages[i]}
      </p>
      <p className="mono-label mt-6 opacity-40">
        Usually 10–25 seconds · you can leave this tab and come back
      </p>
    </section>
  );
}

function BrandSettings() {
  const { imageDataUrl, styleKeywords, primaryColor, setImage, setStyleKeywords, setPrimaryColor, clear } = useBrand();
  const [open, setOpen] = useState(false);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4_000_000) {
      alert("Please pick an image under 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  return (
    <section className="brand-panel">
      <button
        type="button"
        className="brand-panel-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mono-label">Brand · used for image generation</span>
        <span className="mono-label opacity-60">
          {imageDataUrl ? "✓ logo set" : "no logo yet"}
          {styleKeywords ? " · style set" : ""}
          {primaryColor ? " · color set" : ""}
        </span>
        <span>{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="brand-panel-body">
          <div className="brand-field">
            <label className="mono-label" htmlFor="brand-logo">
              Logo or reference image
            </label>
            <input
              id="brand-logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onFile}
              className="brief-input"
            />
            {imageDataUrl ? (
              <div className="brand-logo-preview">
                <img src={imageDataUrl} alt="brand" />
                <button type="button" className="chip" onClick={() => setImage(null)}>
                  Remove
                </button>
              </div>
            ) : null}
          </div>
          <div className="brand-field">
            <label className="mono-label" htmlFor="brand-style">
              Style keywords
            </label>
            <input
              id="brand-style"
              type="text"
              className="brief-input"
              placeholder="minimalist, warm, industrial"
              value={styleKeywords}
              onChange={(e) => setStyleKeywords(e.target.value)}
            />
          </div>
          <div className="brand-field">
            <label className="mono-label" htmlFor="brand-color">
              Primary color
            </label>
            <input
              id="brand-color"
              type="text"
              className="brief-input"
              placeholder="#0A84FF"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
            />
          </div>
          <button type="button" className="chip" onClick={clear}>
            Clear brand
          </button>
        </div>
      ) : null}
    </section>
  );
}

function CaptionCard({
  cap,
  label,
  ideaKind,
  businessName,
  businessType,
  niche,
  templateSeed,
}: {
  cap: Caption;
  label: string;
  ideaKind: string;
  businessName: string;
  businessType: string;
  niche: string;
  templateSeed: number;
}) {
  /* Which of the 20 layouts to render. `pickTemplate` is deterministic so
     the preview and the download always agree, and a Regenerate keeps the
     layout — only the FLUX background rerolls. A per-card override lets the
     user cycle layouts without regenerating the (paid) image. */
  const [templateOverride, setTemplateOverride] = useState<number | null>(null);
  const template = templateOverride ?? pickTemplate(templateSeed);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [imageState, setImageState] = useState<
    | { status: "idle" }
    | { status: "generating" }
    | { status: "ready"; dataUrl: string; size: string }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const { styleKeywords, primaryColor, imageDataUrl: logoDataUrl } = useBrand();


  const copy = async () => {
    const text = `${cap.hook}\n\n${cap.body}\n\n${cap.cta}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const generateImage = async () => {
    setImageState({ status: "generating" });
    try {
      const result = await generateCaptionImage({
        data: {
          hook: cap.hook,
          cta: cap.cta,
          ideaKind,
          businessName,
          businessType,
          niche,
          brand: { styleKeywords, primaryColor },
          /* Fresh seed each click so Regenerate gives a new variation. */
          seed: Math.floor(Math.random() * 1_000_000),
        },
      });
      setImageState({ status: "ready", dataUrl: result.dataUrl, size: result.size });
    } catch (err) {
      setImageState({
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  /* Snapshot the preview node into a PNG. Preview and export use the same
     DOM at the same rendered width, so cqi + wrap are identical; pixelRatio
     2 gives the raster a 2× boost. Fonts must be ready first — the
     serialiser bakes computed styles at snapshot time. */
  const downloadImage = async () => {
    if (imageState.status !== "ready" || !previewRef.current) return;
    if (document.fonts?.ready) await document.fonts.ready;
    try {
      const dataUrl = await toPng(previewRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#111",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${businessName || "post"}-${label}.png`;
      a.click();
    } catch (err) {
      setImageState({
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <article className="results-caption">
      <div className="results-caption-head">
        <span className="mono-label">
          Caption {label}
          {cap.variant ? ` · ${cap.variant.label}` : ""}
        </span>
        <button type="button" className="chip" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
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

      <div className="results-image-slot">
        {imageState.status === "idle" ? (
          <button type="button" className="chip" onClick={generateImage}>
            Generate post image
          </button>
        ) : null}
        {imageState.status === "generating" ? (
          <p className="results-status">Generating post image… (10–30s)</p>
        ) : null}
        {imageState.status === "error" ? (
          <>
            <p className="results-status results-status--error">
              {imageState.message}
            </p>
            <button type="button" className="chip mt-2" onClick={generateImage}>
              Try again
            </button>
          </>
        ) : null}
        {imageState.status === "ready" ? (
          <>
            {/* The preview node IS the export — html-to-image snapshots this
                same DOM on Download, so what you see is exactly what's saved. */}
            <div ref={previewRef} className="results-generated-image results-composite-wrap">
              <PostTemplate
                template={template}
                hook={cap.hook}
                cta={cap.cta}
                bgSrc={imageState.dataUrl}
                logoSrc={logoDataUrl}
                primaryColor={primaryColor}
                businessName={businessName}
              />
            </div>
            <p className="mono-label mt-2 opacity-60">
              Rendered at {imageState.size} · template {String(template).padStart(2, "0")} / {TEMPLATE_COUNT}
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button type="button" className="chip" onClick={downloadImage}>
                Download
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => setGalleryOpen((v) => !v)}
                aria-expanded={galleryOpen}
              >
                {galleryOpen ? "Hide layouts" : "Show all layouts"}
              </button>
              <button type="button" className="chip" onClick={generateImage}>
                Regenerate image
              </button>
            </div>
            {galleryOpen ? (
              <TemplateGallery
                current={template}
                onPick={(n) => {
                  setTemplateOverride(n);
                  setGalleryOpen(false);
                }}
                onClose={() => setGalleryOpen(false)}
                hook={cap.hook}
                cta={cap.cta}
                bgSrc={imageState.dataUrl}
                logoSrc={logoDataUrl}
                {...(primaryColor !== undefined ? { primaryColor } : {})}
                businessName={businessName}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </article>
  );
}

/* Modal grid of all 20 layouts — each tile is a live PostTemplate rendered
   with the caption's real content, so what you pick is what the export will
   look like. Fixed overlay so tiles have real estate; Escape or backdrop
   closes it. */
function TemplateGallery({
  current,
  onPick,
  onClose,
  hook,
  cta,
  bgSrc,
  logoSrc,
  primaryColor,
  businessName,
}: {
  current: number;
  onPick: (n: number) => void;
  onClose: () => void;
  hook: string;
  cta: string;
  bgSrc: string;
  logoSrc: string | null;
  primaryColor?: string;
  businessName: string;
}) {
  const templates = Array.from({ length: TEMPLATE_COUNT }, (_, i) => i + 1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="template-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Choose a layout"
      onClick={onClose}
    >
      <div className="template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-modal-head">
          <h3 className="template-modal-title">Pick a layout</h3>
          <p className="template-modal-sub">20 designs · click to apply · Esc to close</p>
          <button
            type="button"
            className="template-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="template-gallery" role="listbox">
          {templates.map((t) => {
            const active = t === current;
            return (
              <button
                key={t}
                type="button"
                className={`template-gallery-tile${active ? " is-active" : ""}`}
                onClick={() => onPick(t)}
                aria-pressed={active}
                aria-label={`Layout ${String(t).padStart(2, "0")}`}
              >
                <PostTemplate
                  template={t}
                  hook={hook}
                  cta={cta}
                  bgSrc={bgSrc}
                  logoSrc={logoSrc}
                  {...(primaryColor !== undefined ? { primaryColor } : {})}
                  businessName={businessName}
                />
                <span className="template-gallery-badge">{String(t).padStart(2, "0")}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
