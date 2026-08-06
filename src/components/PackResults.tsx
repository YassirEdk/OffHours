import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { usePack, usePackContext } from "@/context/PackContext";
import { useBrand } from "@/context/BrandContext";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { GOAL_LABEL, PLATFORM_LABEL, type Caption } from "@/lib/pack";
import { packToText } from "@/lib/export";
import { generateCaptionImage } from "@/lib/generateImage";
import { PostTemplate, TEMPLATE_COUNT, pickTemplate, type LayoutOverrides, type LogoPlacement, type CustomLayout } from "./PostTemplate";
import { LayoutEditor } from "./LayoutEditor";
import { Logo } from "./Logo";
import { PlanPublishDialog } from "./PlanPublishDialog";
import { AuthNav } from "./AuthNav";
import { savePack } from "@/lib/savedPacks";
import { useNavigate } from "@tanstack/react-router";

/* A plain readable view of the generated pack: brief at the top, brand
   settings, then each of the five ideas with its three captions and hashtag
   set. Each caption has its own image-generation button, so the user can spin
   up a post visual per variant. */

export function PackResults() {
  const pack = usePack();
  const { isExample, status, error } = usePackContext();
  const { brief } = pack;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copiedAll, setCopiedAll] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  /* Map of caption keys ("ideaIdx-captionIdx") to their generated image
     data URLs. Used to gate the Plan-publish button, snapshot the whole
     set for Save pack, and persist across refreshes.

     Cached per-brief in localStorage so a refresh on /pack?brief=… doesn't
     wipe every generated image. localStorage caps around 5–10 MB per
     origin — a full pack (15 images) can be big, so writes are wrapped in
     try/catch and silently give up on QuotaExceededError. */
  const imagesCacheKey = `pack-images:v1:${JSON.stringify(brief)}`;
  const readImagesCache = (): Record<string, string> => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(imagesCacheKey);
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  };
  const writeImagesCache = (next: Record<string, string>) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(imagesCacheKey, JSON.stringify(next));
    } catch {
      // quota / storage disabled — accept it and move on
    }
  };
  const [images, setImages] = useState<Record<string, string>>(() => readImagesCache());
  /* Reseed on brief change so switching packs doesn't leak the old set. */
  useEffect(() => {
    setImages(readImagesCache());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesCacheKey]);
  const hasAnyImage = Object.keys(images).length > 0;
  const markImage = (key: string, dataUrl: string) =>
    setImages((prev) => {
      const next = { ...prev, [key]: dataUrl };
      writeImagesCache(next);
      return next;
    });

  const [savingPack, setSavingPack] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const onSavePack = async () => {
    if (!user) return;
    setSaveError(null);
    setSavingPack(true);
    try {
      const { id } = await savePack({
        data: {
          userId: user.id,
          briefName: brief.name || null,
          pack,
          images,
        },
      });
      await navigate({ to: "/pack/saved/$id", params: { id } });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Couldn't save this pack.");
      setSavingPack(false);
    }
  };

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
    <>
      {/* Top bar — full-width, sits above the results-page container so the
          Offhours logo hugs the top-left corner of the viewport (rather than
          the indented pack column) and the auth chrome the top-right. */}
      <div className="results-topbar">
        <Link to="/" aria-label="Offhours — back to home" className="results-topbar-logo">
          <Logo name="Offhours" className="header-logo" />
        </Link>
        <AuthNav />
      </div>
    <div className="results-page">
      <header className="results-head">
        <div className="results-head-brand">
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
          <Link to="/" className="results-back" aria-label="Back to home">
            <span className="results-back-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                   strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </span>
            <span className="results-back-label">Back</span>
          </Link>
          <button type="button" className="chip results-head-split" onClick={copyAll}>
            {copiedAll ? "Copied" : "Copy the whole pack"}
          </button>
          {!isExample && user && hasAnyImage ? (
            <>
              <button
                type="button"
                className="chip"
                onClick={onSavePack}
                disabled={savingPack || status === "generating"}
              >
                {savingPack ? "Saving…" : "Save pack"}
              </button>
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
            </>
          ) : null}
          {saveError ? (
            <span className="mono-label text-[#ff5c5c]">{saveError}</span>
          ) : null}
        </div>
      </header>
      <PlanPublishDialog open={planOpen} onClose={() => setPlanOpen(false)} images={images} />

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
                  key={`${i}-${ci}`}
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
                  onImageReady={(dataUrl) => markImage(`${i}-${ci}`, dataUrl)}
                  initialImage={images[`${i}-${ci}`]}
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
    </>
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

function CaptionCard({
  cap,
  label,
  ideaKind,
  businessName,
  businessType,
  niche,
  templateSeed,
  onImageReady,
  initialImage,
}: {
  cap: Caption;
  label: string;
  ideaKind: string;
  businessName: string;
  businessType: string;
  niche: string;
  templateSeed: number;
  /* Fires each time this card produces a fresh image. PackResults uses the
     data URL to (a) reveal the Plan-publish + Save-pack buttons and (b)
     snapshot everything when Save is clicked. */
  onImageReady?: (dataUrl: string) => void;
  /* Optional cached image data URL — restored from localStorage across
     refreshes so the user doesn't have to regenerate every time. */
  initialImage?: string;
}) {
  /* Which of the 20 layouts to render. `pickTemplate` is deterministic so
     the preview and the download always agree, and a Regenerate keeps the
     layout — only the FLUX background rerolls. A per-card override lets the
     user cycle layouts without regenerating the (paid) image. */
  const [templateOverride, setTemplateOverride] = useState<number | null>(null);
  const template = templateOverride ?? pickTemplate(templateSeed);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /* Free upload path — user supplies their own photo instead of hitting the
     paid FLUX endpoint. Same output shape (data URL), so it plugs into
     imageState.status === "ready" and every downstream feature (Plan
     publish, Save pack, download, layout gallery) works unchanged. */
  const UPLOAD_MAX_BYTES = 4_000_000; // 4MB — bigger than generated images, headroom for phone photos
  const onUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("That's not an image file.");
      return;
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      setUploadError(`Image too large — keep it under ${(UPLOAD_MAX_BYTES / 1_000_000).toFixed(0)} MB.`);
      return;
    }
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageState({ status: "ready", dataUrl: reader.result, size: "uploaded" });
        onImageReady?.(reader.result);
      }
    };
    reader.onerror = () => setUploadError("Couldn't read that image.");
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const triggerUpload = () => uploadInputRef.current?.click();
  const [copied, setCopied] = useState(false);
  const [imageState, setImageState] = useState<
    | { status: "idle" }
    | { status: "generating" }
    | { status: "ready"; dataUrl: string; size: string }
    | { status: "error"; message: string }
  >(
    initialImage
      ? { status: "ready", dataUrl: initialImage, size: "1024x1024" }
      : { status: "idle" },
  );
  /* Two sources of brand info:
     - SettingsContext (Supabase user_metadata) — the primary one, filled
       via Settings → Company. Persists across devices.
     - BrandContext (browser localStorage) — legacy fallback for the older
       flow. Used only if the newer settings source is empty.
     Company logo overrides Brand logo, same for primary color. Businesses
     that upload a logo in Profile → Company get it automatically stamped
     on every generated post image. */
  const { styleKeywords, primaryColor: brandPrimary, imageDataUrl: brandLogo } = useBrand();
  const { settings } = useSettings();
  const logoDataUrl = settings.company.logo || brandLogo;
  const primaryColor = settings.company.primaryColor || brandPrimary;
  /* Per-caption overrides: logo placement + size, hook size/alignment, cta
     size, padding. Seeded from Settings on first render; Edit-layout
     popover mutates them locally. */
  const [layout] = useState<LayoutOverrides>({});
  const [logoPlacement] = useState<LogoPlacement>(settings.imageStyle.logoPlacement);
  const [editingLayout, setEditingLayout] = useState(false);
  /* Free-form layout from the visual editor. When set, it overrides the
     switch-based template and renders elements at hand-placed coords. */
  const [customLayout, setCustomLayout] = useState<CustomLayout | null>(null);


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
      onImageReady?.(result.dataUrl);
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
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          onChange={onUploadFile}
          style={{ display: "none" }}
        />
        {imageState.status === "idle" ? (
          <div className="flex gap-2 flex-wrap">
            <button type="button" className="chip" onClick={generateImage}>
              Generate post image
            </button>
            <button type="button" className="chip" onClick={triggerUpload}>
              Upload an image for post
            </button>
          </div>
        ) : null}
        {uploadError ? (
          <p className="results-status results-status--error mt-2">{uploadError}</p>
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
                logoPlacement={logoPlacement}
                layout={layout}
                customLayout={customLayout}
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
              <button type="button" className="chip" onClick={triggerUpload}>
                Upload your own
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => setEditingLayout(true)}
              >
                Edit layout
              </button>
              {customLayout ? (
                <button
                  type="button"
                  className="chip"
                  onClick={() => setCustomLayout(null)}
                >
                  Restore template
                </button>
              ) : null}
            </div>
            <LayoutEditor
              open={editingLayout}
              onClose={() => setEditingLayout(false)}
              bgSrc={imageState.dataUrl}
              hook={cap.hook}
              cta={cap.cta}
              logoSrc={logoDataUrl}
              primaryColor={primaryColor}
              initial={customLayout ?? undefined}
              onSave={setCustomLayout}
            />
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
                logoPlacement={logoPlacement}
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
  logoPlacement,
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
  logoPlacement?: import("./PostTemplate").LogoPlacement;
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
                  {...(logoPlacement !== undefined ? { logoPlacement } : {})}
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

/* Inline layout editor — six sliders + placement/alignment chips. All state
   lives in CaptionCard so each caption edits independently. */
function EditLayoutPanel({
  layout,
  onLayout,
  logoPlacement,
  onLogoPlacement,
  onReset,
}: {
  layout: LayoutOverrides;
  onLayout: (l: LayoutOverrides) => void;
  logoPlacement: LogoPlacement;
  onLogoPlacement: (p: LogoPlacement) => void;
  onReset: () => void;
}) {
  const patch = (p: Partial<LayoutOverrides>) => onLayout({ ...layout, ...p });
  const PLACEMENTS: LogoPlacement[] = ["top-left","top-right","center","bottom-left","bottom-right","none"];
  const ALIGNS: NonNullable<LayoutOverrides["hookAlign"]>[] = ["left","center","right"];
  return (
    <div className="layout-editor">
      <div className="layout-editor-row">
        <span className="mono-label layout-editor-label">Logo placement</span>
        <div className="layout-editor-chips">
          {PLACEMENTS.map((p) => (
            <button
              key={p}
              type="button"
              className="chip chip--sm"
              aria-pressed={logoPlacement === p}
              onClick={() => onLogoPlacement(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="layout-editor-row">
        <span className="mono-label layout-editor-label">Hook align</span>
        <div className="layout-editor-chips">
          {ALIGNS.map((a) => (
            <button
              key={a}
              type="button"
              className="chip chip--sm"
              aria-pressed={(layout.hookAlign ?? "left") === a}
              onClick={() => patch({ hookAlign: a })}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <LayoutSlider
        label="Logo size"
        value={layout.logoSize ?? 10}
        min={5}
        max={25}
        step={1}
        suffix="%"
        onChange={(v) => patch({ logoSize: v })}
      />
      <LayoutSlider
        label="Hook size"
        value={layout.hookSize ?? 11}
        min={6}
        max={14}
        step={0.5}
        suffix="cqi"
        onChange={(v) => patch({ hookSize: v })}
      />
      <LayoutSlider
        label="CTA size"
        value={layout.ctaSize ?? 2.8}
        min={2}
        max={4.5}
        step={0.1}
        suffix="cqi"
        onChange={(v) => patch({ ctaSize: v })}
      />
      <LayoutSlider
        label="Padding"
        value={layout.padding ?? 6}
        min={3}
        max={12}
        step={0.5}
        suffix="cqi"
        onChange={(v) => patch({ padding: v })}
      />
      <div className="layout-editor-actions">
        <button type="button" className="chip chip--sm" onClick={onReset}>Reset</button>
      </div>
    </div>
  );
}

function LayoutSlider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="layout-editor-row">
      <span className="mono-label layout-editor-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="layout-editor-slider"
      />
      <span className="layout-editor-value">{value}{suffix}</span>
    </label>
  );
}
