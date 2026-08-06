import "./postTemplate.css";

/* Twenty layouts that share one contract: full-bleed background photo,
   hook + CTA overlaid, optional brand logo. Which layout renders is picked
   by `pickTemplate(seed)` — deterministic per caption, so a Regenerate keeps
   the same look and a new caption gets a new one.

   Every layout is CSS-driven (container queries, clamp, line-clamp) so a
   longer CTA shrinks/wraps/clips inside the frame instead of blowing it out.
   The preview node IS the export — PackResults snapshots it with
   html-to-image at 2x resolution. */

export const TEMPLATE_COUNT = 20;

export function pickTemplate(seed: number): number {
  const s = Math.abs(Math.floor(seed || 0));
  return (s % TEMPLATE_COUNT) + 1;
}

export type LogoPlacement =
  | "top-left"
  | "top-right"
  | "center"
  | "bottom-left"
  | "bottom-right"
  | "none";

/* Per-post layout overrides — driven by the Edit-layout popover. Every
   value maps to a CSS custom property on the .pt element that the base
   styles read via var(--…), with a fallback so unset values keep their
   template default. */
export type LayoutOverrides = {
  logoSize?: number;   // logo width in %, 5–25
  hookSize?: number;   // hook font-size in cqi, 6–14
  ctaSize?: number;    // cta font-size in cqi, 2–4.5
  padding?: number;    // stage padding in cqi, 3–12
  hookAlign?: "left" | "center" | "right";
};

/* Free-form per-caption boxes from the visual editor. When set, the
   template renders elements absolutely at these coords/sizes instead of
   using the switch-based layout. All values are % of the 1:1 canvas. */
export type CustomBox = { x: number; y: number; w: number; h: number };
export type CustomLayout = {
  hook: CustomBox;
  cta: CustomBox;
  logo?: CustomBox;
  hookColor?: string;
  ctaColor?: string;
};

type Props = {
  template: number;
  hook: string;
  cta: string;
  bgSrc: string;
  logoSrc?: string | null;
  primaryColor?: string;
  businessName?: string;
  /* Where the company logo lands on the post. Overrides each template's
     default (which was always bottom-right and sometimes collided with
     centered CTAs). "none" hides both the logo and the wordmark fallback. */
  logoPlacement?: LogoPlacement;
  layout?: LayoutOverrides;
  /* If set, replaces the template's built-in layout with free-form absolute
     positioning (from the visual editor). */
  customLayout?: CustomLayout | null;
};

export function PostTemplate({
  template,
  hook,
  cta,
  bgSrc,
  logoSrc,
  primaryColor,
  businessName,
  logoPlacement = "bottom-right",
  layout,
  customLayout,
}: Props) {
  const accent = primaryColor?.trim() || "#D8FF3E";
  const t = ((Math.abs(Math.floor(template - 1)) % TEMPLATE_COUNT) + 1);
  const alignCls = layout?.hookAlign ? ` pt-align-${layout.hookAlign}` : "";
  const cls = `pt pt-${String(t).padStart(2, "0")} pt-logo-${logoPlacement}${alignCls}`;
  const brand = businessName || "Brand";

  const Bg = () => <img className="pt-bg" src={bgSrc} alt="" crossOrigin="anonymous" />;
  const Logo = () => {
    if (logoPlacement === "none") return null;
    return logoSrc ? (
      <img className="pt-logo" src={logoSrc} alt="" aria-hidden="true" crossOrigin="anonymous" />
    ) : (
      <div className="pt-brand">{brand}</div>
    );
  };

  /* Each branch is a small JSX tree — the CSS in postTemplate.css does the
     heavy lifting. Keep the markup as consistent as reasonable so the CSS
     selectors stay simple. */
  const style: React.CSSProperties = { ["--acc" as string]: accent };
  if (layout?.logoSize != null)
    (style as Record<string, string>)["--pt-logo-size"] = `${layout.logoSize}%`;
  if (layout?.hookSize != null)
    (style as Record<string, string>)["--pt-hook-size"] = `${layout.hookSize}cqi`;
  if (layout?.ctaSize != null)
    (style as Record<string, string>)["--pt-cta-size"] = `${layout.ctaSize}cqi`;
  if (layout?.padding != null)
    (style as Record<string, string>)["--pt-padding"] = `${layout.padding}cqi`;

  /* Custom layout takes priority — the user has hand-placed everything in
     the visual editor. Renders elements at their absolute % coords. */
  if (customLayout) {
    return (
      <div className={`pt pt-custom pt-logo-${logoPlacement}`} role="img" aria-label={hook} style={style}>
        <Bg />
        <div className="pt-veil" />
        <div
          className="pt-custom-hook"
          style={{
            left: `${customLayout.hook.x}%`,
            top: `${customLayout.hook.y}%`,
            width: `${customLayout.hook.w}%`,
            height: `${customLayout.hook.h}%`,
            color: customLayout.hookColor || "#ffffff",
          }}
        >
          {hook}
        </div>
        <div
          className="pt-custom-cta"
          style={{
            left: `${customLayout.cta.x}%`,
            top: `${customLayout.cta.y}%`,
            width: `${customLayout.cta.w}%`,
            height: `${customLayout.cta.h}%`,
            color: customLayout.ctaColor || accent,
          }}
        >
          → {cta}
        </div>
        {customLayout.logo && logoSrc ? (
          <img
            src={logoSrc}
            alt=""
            aria-hidden="true"
            crossOrigin="anonymous"
            className="pt-custom-logo"
            style={{
              left: `${customLayout.logo.x}%`,
              top: `${customLayout.logo.y}%`,
              width: `${customLayout.logo.w}%`,
              height: `${customLayout.logo.h}%`,
            }}
          />
        ) : customLayout.logo ? (
          <div
            className="pt-custom-brand"
            style={{
              left: `${customLayout.logo.x}%`,
              top: `${customLayout.logo.y}%`,
              width: `${customLayout.logo.w}%`,
              height: `${customLayout.logo.h}%`,
            }}
          >
            {brand}
          </div>
        ) : null}
      </div>
    );
  }

  switch (t) {
    case 1: // Editorial (current design)
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div className="pt-veil" />
          <div className="pt-stage">
            <span className="pt-tick" style={{ background: accent }} />
            <h2 className="pt-hook">{hook}</h2>
            <p className="pt-cta">
              <span className="pt-arrow" style={{ color: accent }}>→</span>
              <span className="pt-cta-text" style={{ borderBottomColor: accent }}>{cta}</span>
            </p>
          </div>
          <Logo />
        </div>
      );

    case 2: // Center hero, CTA pill
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div className="pt-veil" />
          <Logo />
          <div className="pt-stage">
            <h2 className="pt-hook">{hook}</h2>
            <p className="pt-cta" style={{ background: accent, color: "#111" }}>{cta}</p>
          </div>
        </div>
      );

    case 3: // Top bar accent
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div className="pt-veil" />
          <div className="pt-top" style={{ background: accent }}>{brand.toUpperCase()}</div>
          <div className="pt-stage">
            <h2 className="pt-hook">{hook}</h2>
            <p className="pt-cta" style={{ color: accent }}>→ {cta}</p>
          </div>
          <Logo />
        </div>
      );

    case 4: // Diagonal split
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div
            className="pt-veil"
            style={{
              background:
                "linear-gradient(115deg, rgba(0,0,0,.75) 0%, rgba(0,0,0,.75) 45%, transparent 60%)",
            }}
          />
          <div className="pt-stage">
            <h2 className="pt-hook">{hook}</h2>
            <p className="pt-cta" style={{ color: accent }}>→ {cta}</p>
          </div>
          <Logo />
        </div>
      );

    case 5: // Corner card
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div className="pt-veil" />
          <Logo />
          <div className="pt-stage">
            <h2 className="pt-hook">{hook}</h2>
            <div className="pt-card">
              <p className="pt-cta">
                <span style={{ color: accent }}>→</span> {cta}
              </p>
            </div>
          </div>
        </div>
      );

    case 6: // Sidebar rail
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div className="pt-veil" />
          <div className="pt-rail" style={{ background: accent }} />
          <div className="pt-stage">
            <p className="pt-kicker" style={{ color: accent }}>Why it matters</p>
            <h2 className="pt-hook">{hook}</h2>
            <p className="pt-cta">{cta}</p>
          </div>
          <Logo />
        </div>
      );

    case 7: // Bottom gradient
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div
            className="pt-veil"
            style={{ background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,.92) 100%)" }}
          />
          <Logo />
          <div className="pt-stage">
            <h2 className="pt-hook">{hook}</h2>
            <p className="pt-cta" style={{ color: accent }}>→ {cta}</p>
          </div>
        </div>
      );

    case 8: // Ticker footer
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div className="pt-veil" />
          <Logo />
          <div className="pt-stage">
            <h2 className="pt-hook">{hook}</h2>
          </div>
          <div className="pt-footer">
            <span style={{ color: accent }}>→</span>
            <span className="pt-cta">{cta}</span>
          </div>
        </div>
      );

    case 9: // Ribbon corner
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div className="pt-veil" />
          <div className="pt-ribbon" style={{ background: accent }}>New</div>
          <div className="pt-stage">
            <h2 className="pt-hook">{hook}</h2>
            <p className="pt-cta">{cta}</p>
          </div>
          <Logo />
        </div>
      );

    case 10: // Outline frame
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div className="pt-veil" />
          <div className="pt-frame" />
          <div className="pt-stage">
            <h2 className="pt-hook">{hook}</h2>
            <span className="pt-rule" style={{ background: accent }} />
            <p className="pt-cta">{cta}</p>
          </div>
          {/* Centered under the outline frame — signature, not stamp. */}
          {logoSrc ? (
            <img className="pt-logo pt-logo--center" src={logoSrc} alt="" aria-hidden="true" crossOrigin="anonymous" />
          ) : (
            <div className="pt-brand pt-brand--center">{brand}</div>
          )}
        </div>
      );

    case 11: // Magazine drop-cap
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div className="pt-veil" />
          <Logo />
          <div className="pt-stage">
            <h2 className="pt-hook" style={{ ["--dc-color" as string]: accent } as React.CSSProperties}>{hook}</h2>
            <p className="pt-cta">— {cta}</p>
          </div>
        </div>
      );

    case 12: // Sticker CTA
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div className="pt-veil" />
          <div className="pt-sticker" style={{ background: accent }}>
            <p className="pt-cta">{cta}</p>
          </div>
          <div className="pt-stage">
            <h2 className="pt-hook">{hook}</h2>
          </div>
          <Logo />
        </div>
      );

    case 13: // Left-rail poster
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div className="pt-veil" />
          <div className="pt-vert" style={{ background: accent }} />
          <div className="pt-stage">
            <h2 className="pt-hook">{hook}</h2>
            <p className="pt-cta" style={{ color: accent }}>→ {cta}</p>
          </div>
          <Logo />
        </div>
      );

    case 14: // Two-tone block
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div className="pt-veil" />
          <Logo />
          <div className="pt-block" style={{ background: accent }}>
            <h2 className="pt-hook">{hook}</h2>
            <p className="pt-cta">→ {cta}</p>
          </div>
        </div>
      );

    case 15: // Newspaper caption
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div className="pt-veil" />
          <Logo />
          <div className="pt-stage">
            <div className="pt-caption">
              <h2 className="pt-hook">&ldquo;{hook}&rdquo;</h2>
              <p className="pt-cta">→ {cta}</p>
            </div>
          </div>
        </div>
      );

    case 16: // Neon glow
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div className="pt-veil" style={{ background: "rgba(0,0,0,.45)" }} />
          <Logo />
          <div className="pt-stage">
            <h2
              className="pt-hook"
              style={{
                color: accent,
                textShadow: `0 0 12px ${accent}80, 0 0 24px ${accent}55`,
              }}
            >
              {hook}
            </h2>
            <p
              className="pt-cta"
              style={{ borderColor: accent, boxShadow: `0 0 12px ${accent}55, inset 0 0 12px ${accent}22` }}
            >
              {cta}
            </p>
          </div>
        </div>
      );

    case 17: // Gallery print — masthead on top, photo, caption block
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <div className="pt-frame-outer" />
          <div className="pt-17-mast">
            {logoSrc ? (
              <img className="pt-17-logo" src={logoSrc} alt="" aria-hidden="true" crossOrigin="anonymous" />
            ) : (
              <span className="pt-17-brand">{brand}</span>
            )}
            <span className="pt-17-rule" style={{ background: accent }} />
          </div>
          <Bg />
          <div className="pt-veil" />
          <div className="pt-17-caption">
            <h2 className="pt-hook">{hook}</h2>
            <p className="pt-cta" style={{ color: accent }}>→ {cta}</p>
          </div>
        </div>
      );

    case 18: // Bottom pill
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div className="pt-veil" />
          <Logo />
          <div className="pt-stage">
            <h2 className="pt-hook">{hook}</h2>
          </div>
          <div className="pt-pill">
            <span className="pt-pill-arrow" style={{ background: accent }}>→</span>
            <p className="pt-cta">{cta}</p>
          </div>
        </div>
      );

    case 19: // Numbered mirror
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <Bg />
          <div className="pt-veil" />
          <div className="pt-stage">
            <h2 className="pt-hook">{hook}</h2>
            <div className="pt-row">
              <span className="pt-num" style={{ background: accent }}>01</span>
              <p className="pt-cta">{cta}</p>
            </div>
          </div>
          <Logo />
        </div>
      );

    case 20: // Split panel
    default:
      return (
        <div className={cls} role="img" aria-label={hook} style={style}>
          <div className="pt-split-image">
            <Bg />
          </div>
          <div className="pt-split-panel">
            {logoSrc ? (
              <img className="pt-logo pt-logo--panel" src={logoSrc} alt="" aria-hidden="true" crossOrigin="anonymous" />
            ) : (
              <div className="pt-brand">{brand}</div>
            )}
            <div className="pt-stage">
              <h2 className="pt-hook">{hook}</h2>
              <p className="pt-cta" style={{ color: accent }}>→ {cta}</p>
            </div>
          </div>
        </div>
      );
  }
}
