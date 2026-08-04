import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent } from "react";
import { usePack, usePackContext } from "@/context/PackContext";
import { useBrand } from "@/context/BrandContext";
import { GOAL_LABEL, PLATFORM_LABEL, type Caption } from "@/lib/pack";
import { packToText } from "@/lib/export";
import { generateCaptionImage } from "@/lib/generateImage";

/* A plain readable view of the generated pack: brief at the top, brand
   settings, then each of the five ideas with its three captions and hashtag
   set. Each caption has its own image-generation button, so the user can spin
   up a post visual per variant. */

export function PackResults() {
  const pack = usePack();
  const { isExample, status, error } = usePackContext();
  const { brief } = pack;
  const [copiedAll, setCopiedAll] = useState(false);

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
        <div>
          <p className="mono-label">
            {isExample ? "The example pack" : "Your generated pack"}
          </p>
          <h1 className="display-cond mt-2 text-[clamp(1.6rem,4vw,2.6rem)]">
            {brief.name} — {brief.business}
          </h1>
        </div>
        <div className="results-head-actions">
          <button type="button" className="chip" onClick={copyAll}>
            {copiedAll ? "Copied" : "Copy the whole pack"}
          </button>
          <Link to="/" className="chip">
            ← Back
          </Link>
        </div>
      </header>

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
}: {
  cap: Caption;
  label: string;
  ideaKind: string;
  businessName: string;
  businessType: string;
  niche: string;
}) {
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

  /* Composite the background + text overlay + logo into a single PNG.
     Everything is proportional to a 1024 canvas so scaling stays sane.
     The download and the DOM preview are laid out the same way, on purpose. */
  const downloadImage = async () => {
    if (imageState.status !== "ready") return;
    const S = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* Wait for Archivo + Inter to be rasterized before drawing — canvas 2D
       has no font-loading callback, so if the fonts aren't ready yet the
       text falls back to the system default silently. */
    if (document.fonts?.ready) await document.fonts.ready;

    /* 1. Background photo. */
    const bg = await loadImage(imageState.dataUrl);
    ctx.drawImage(bg, 0, 0, S, S);

    /* 2. Bottom-up gradient scrim — pulls the eye to the text and keeps
       white type readable no matter what photo landed. */
    const grad = ctx.createLinearGradient(0, S * 0.35, 0, S);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.55, "rgba(0,0,0,0.55)");
    grad.addColorStop(1, "rgba(0,0,0,0.9)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);

    /* 3. Headline — auto-fit: try larger sizes first, drop down until the
       text fits in at most 4 lines within the safe area. */
    const padX = 60;
    const textMaxW = S - padX * 2;
    const { lines, fontSize, lineHeight } = fitHeadline(ctx, cap.hook, textMaxW, S);

    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "top";
    const totalH = lines.length * lineHeight;
    let y = S - 220 - totalH;
    for (const line of lines) {
      /* Archivo — the site's display face. 900 weight is the boldest. */
      ctx.font = `900 ${fontSize}px "Archivo", "Helvetica Neue", Arial, sans-serif`;
      ctx.fillText(line, padX, y);
      y += lineHeight;
    }

    /* 3b. Small brand-color accent bar above the headline — editorial mark
       that ties the composition together and gives the brand color a place
       to live even when the CTA arrow isn't enough of a presence. */
    const ctaColor = primaryColor?.trim() || "#D8FF3E";
    const accentBarY = S - 220 - totalH - 24;
    ctx.fillStyle = ctaColor;
    ctx.fillRect(padX, accentBarY, 48, 4);

    /* 4. CTA — editorial style: coloured arrow, Inter text, coloured
       underline. No pill, no rounded box. Feels like a magazine footer. */
    const ctaFontSize = 26;
    const arrowFontSize = 30;
    ctx.textBaseline = "alphabetic";
    const ctaY = S - 90;
    ctx.font = `700 ${arrowFontSize}px "Inter", "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = ctaColor;
    ctx.fillText("→", padX, ctaY);
    const arrowW = ctx.measureText("→ ").width;
    ctx.font = `500 ${ctaFontSize}px "Inter", "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = "#ffffff";
    const ctaText = truncateForPill(cap.cta, 70);
    ctx.fillText(ctaText, padX + arrowW, ctaY);
    const textW = ctx.measureText(ctaText).width;
    ctx.fillStyle = ctaColor;
    ctx.fillRect(padX + arrowW, ctaY + 8, textW, 2);

    /* 5. Logo bottom-right, small — sits like a signature rather than a
       stamp. No plate; drawn directly on the photo. */
    if (logoDataUrl) {
      try {
        const logo = await loadImage(logoDataUrl);
        const boxSize = 96;
        const boxX = S - padX - boxSize;
        const boxY = S - padX - boxSize;
        const scale = Math.min(boxSize / logo.width, boxSize / logo.height);
        const drawW = logo.width * scale;
        const drawH = logo.height * scale;
        const drawX = boxX + (boxSize - drawW) / 2;
        const drawY = boxY + (boxSize - drawH) / 2;
        ctx.drawImage(logo, drawX, drawY, drawW, drawH);
      } catch {
        /* Bad logo file — skip silently rather than break the download. */
      }
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${businessName || "post"}-${label}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

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
            {/* Preview mirrors the downloaded PNG: same layout, same overlay,
                same CTA colour, same logo placement. Canvas re-composites at
                1024px on Download so the file matches this preview. */}
            <div
              className="results-generated-image results-composite"
              role="img"
              aria-label={cap.hook}
            >
              <img className="composite-bg" src={imageState.dataUrl} alt="" />
              <div className="composite-scrim" aria-hidden="true" />
              {logoDataUrl ? (
                <img
                  className="composite-logo composite-logo--bare"
                  src={logoDataUrl}
                  alt=""
                  aria-hidden="true"
                />
              ) : null}
              <div className="composite-text">
                <span
                  className="composite-accent-bar"
                  style={{ backgroundColor: primaryColor?.trim() || "var(--accent)" }}
                  aria-hidden="true"
                />
                <p className="composite-hook">{cap.hook}</p>
                <p className="composite-cta composite-cta--editorial">
                  <span
                    className="composite-cta-arrow"
                    style={{ color: primaryColor?.trim() || "var(--accent)" }}
                  >
                    →
                  </span>
                  <span
                    className="composite-cta-text"
                    style={{
                      borderBottomColor: primaryColor?.trim() || "var(--accent)",
                    }}
                  >
                    {truncateForPill(cap.cta, 70)}
                  </span>
                </p>
              </div>
            </div>
            <p className="mono-label mt-2 opacity-60">
              Rendered at {imageState.size} · text overlaid client-side
            </p>
            <div className="flex gap-2 mt-3">
              <button type="button" className="chip" onClick={downloadImage}>
                Download
              </button>
              <button type="button" className="chip" onClick={generateImage}>
                Regenerate
              </button>
            </div>
          </>
        ) : null}
      </div>
    </article>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

/* Try successively smaller headline sizes until the wrapped text fits in
   the safe area at 4 lines or fewer. Instagram feed posts get scrolled fast,
   so a 5-line headline nobody reads is worse than a 3-line one everyone can. */
function fitHeadline(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  canvasSize: number,
): { lines: string[]; fontSize: number; lineHeight: number } {
  const maxLines = 4;
  const sizes = [96, 84, 76, 68, 60, 52, 46, 40];
  for (const size of sizes) {
    ctx.font = `900 ${size}px "Archivo", "Helvetica Neue", Arial, sans-serif`;
    const lines = wrapText(ctx, text, maxWidth);
    const lineHeight = Math.round(size * 1.08);
    const totalH = lines.length * lineHeight;
    /* Also cap total height so the block doesn't collide with the CTA. */
    if (lines.length <= maxLines && totalH < canvasSize * 0.55) {
      return { lines, fontSize: size, lineHeight };
    }
  }
  /* Fallback — force-fit at the smallest size, accepting whatever line count. */
  const size = sizes[sizes.length - 1];
  ctx.font = `800 ${size}px "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif`;
  return {
    lines: wrapText(ctx, text, maxWidth).slice(0, maxLines),
    fontSize: size,
    lineHeight: Math.round(size * 1.08),
  };
}

/* Trim a CTA that's too long for the pill — a truncated CTA reads worse
   than a shorter one, so try to cut at a natural word break. */
function truncateForPill(cta: string, max: number): string {
  const trimmed = cta.trim();
  if (trimmed.length <= max) return trimmed;
  const slice = trimmed.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice) + "…";
}

/* Break a string into lines that each fit within maxWidth in the given ctx.
   Greedy: consume as many words per line as fit; a single word longer than
   the width gets its own line and overflows rather than being letter-split
   (letter-splitting a caption reads worse than a tiny bit of overflow). */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
