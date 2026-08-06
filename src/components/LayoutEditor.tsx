import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* Canva-style layout editor — drag to move, corner handles to resize.
   Coordinates are stored as percentages of the 1:1 canvas so the same
   layout renders identically at preview size and at 1024×1024 export. */

export type Box = { x: number; y: number; w: number; h: number };
export type CustomLayout = {
  hook: Box;
  cta: Box;
  logo?: Box;
  hookColor?: string;
  ctaColor?: string;
};

export const DEFAULT_CUSTOM_LAYOUT: CustomLayout = {
  hook: { x: 6, y: 55, w: 88, h: 28 },
  cta:  { x: 6, y: 86, w: 88, h: 8 },
  logo: { x: 82, y: 84, w: 12, h: 12 },
};

type Element = "hook" | "cta" | "logo";
type DragMode = { kind: "move" } | { kind: "resize"; corner: "nw" | "ne" | "sw" | "se" } | null;

export function LayoutEditor({
  open,
  onClose,
  bgSrc,
  hook,
  cta,
  logoSrc,
  primaryColor,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  bgSrc: string;
  hook: string;
  cta: string;
  logoSrc?: string | null;
  primaryColor?: string;
  initial?: CustomLayout;
  onSave: (layout: CustomLayout) => void;
}) {
  const [layout, setLayout] = useState<CustomLayout>(initial ?? DEFAULT_CUSTOM_LAYOUT);
  const [selected, setSelected] = useState<Element>("hook");
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    el: Element;
    mode: DragMode;
    start: { x: number; y: number };
    orig: Box;
  } | null>(null);

  useEffect(() => {
    if (open) setLayout(initial ?? DEFAULT_CUSTOM_LAYOUT);
  }, [open, initial]);

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

  if (!open || typeof document === "undefined") return null;

  const updateBox = (el: Element, box: Box) => {
    setLayout((prev) => {
      if (el === "logo") return { ...prev, logo: box };
      return { ...prev, [el]: box } as CustomLayout;
    });
  };

  const startDrag = (
    e: React.PointerEvent,
    el: Element,
    mode: DragMode,
  ) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setSelected(el);
    const box = el === "logo" ? layout.logo : layout[el];
    if (!box) return;
    dragRef.current = {
      el,
      mode,
      start: { x: e.clientX, y: e.clientY },
      orig: box,
    };
  };

  const onCanvasMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    const canvas = canvasRef.current;
    if (!d || !canvas || !d.mode) return;
    const rect = canvas.getBoundingClientRect();
    const dxPct = ((e.clientX - d.start.x) / rect.width) * 100;
    const dyPct = ((e.clientY - d.start.y) / rect.height) * 100;
    let next: Box = { ...d.orig };
    if (d.mode.kind === "move") {
      next.x = clamp(d.orig.x + dxPct, 0, 100 - d.orig.w);
      next.y = clamp(d.orig.y + dyPct, 0, 100 - d.orig.h);
    } else {
      const corner = d.mode.corner;
      if (corner === "se") {
        next.w = clamp(d.orig.w + dxPct, 4, 100 - d.orig.x);
        next.h = clamp(d.orig.h + dyPct, 3, 100 - d.orig.y);
      } else if (corner === "sw") {
        const nx = clamp(d.orig.x + dxPct, 0, d.orig.x + d.orig.w - 4);
        next.w = d.orig.w + (d.orig.x - nx);
        next.x = nx;
        next.h = clamp(d.orig.h + dyPct, 3, 100 - d.orig.y);
      } else if (corner === "ne") {
        const ny = clamp(d.orig.y + dyPct, 0, d.orig.y + d.orig.h - 3);
        next.h = d.orig.h + (d.orig.y - ny);
        next.y = ny;
        next.w = clamp(d.orig.w + dxPct, 4, 100 - d.orig.x);
      } else {
        const nx = clamp(d.orig.x + dxPct, 0, d.orig.x + d.orig.w - 4);
        const ny = clamp(d.orig.y + dyPct, 0, d.orig.y + d.orig.h - 3);
        next.w = d.orig.w + (d.orig.x - nx);
        next.x = nx;
        next.h = d.orig.h + (d.orig.y - ny);
        next.y = ny;
      }
    }
    updateBox(d.el, next);
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const bg = { background: `url(${bgSrc}) center/cover no-repeat, #111` };
  const accent = primaryColor || "#D8FF3E";

  return createPortal(
    <div className="editor-scrim" role="dialog" aria-modal="true" aria-label="Edit layout">
      <button className="editor-backdrop" aria-label="Close" onClick={onClose} type="button" />
      <div className="editor-panel">
        <header className="editor-head">
          <div>
            <p className="mono-label">Layout · edit</p>
            <h2 className="display editor-title mt-1">Drag to move · resize corners</h2>
          </div>
          <button
            type="button"
            className="settings-close"
            aria-label="Close"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                 strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div
          ref={canvasRef}
          className="editor-canvas"
          style={bg}
          onPointerMove={onCanvasMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerDown={() => setSelected("hook")}
        >
          <div className="editor-veil" />
          <Draggable
            box={layout.hook}
            selected={selected === "hook"}
            onSelect={() => setSelected("hook")}
            onStartMove={(e) => startDrag(e, "hook", { kind: "move" })}
            onStartResize={(e, corner) => startDrag(e, "hook", { kind: "resize", corner })}
          >
            <div className="editor-hook" style={{ color: layout.hookColor || "#ffffff" }}>{hook}</div>
          </Draggable>
          <Draggable
            box={layout.cta}
            selected={selected === "cta"}
            onSelect={() => setSelected("cta")}
            onStartMove={(e) => startDrag(e, "cta", { kind: "move" })}
            onStartResize={(e, corner) => startDrag(e, "cta", { kind: "resize", corner })}
          >
            <div
              className="editor-cta"
              style={{ color: layout.ctaColor || accent }}
            >→ {cta}</div>
          </Draggable>
          {layout.logo ? (
            <Draggable
              box={layout.logo}
              selected={selected === "logo"}
              onSelect={() => setSelected("logo")}
              onStartMove={(e) => startDrag(e, "logo", { kind: "move" })}
              onStartResize={(e, corner) => startDrag(e, "logo", { kind: "resize", corner })}
            >
              {logoSrc ? (
                <img src={logoSrc} alt="" className="editor-logo-img" />
              ) : (
                <div className="editor-logo-fallback">LOGO</div>
              )}
            </Draggable>
          ) : null}
        </div>

        <div className="editor-toolbar">
          <span className="mono-label">Selected · {selected}</span>
          {selected === "hook" ? (
            <ColorSwatch
              label="Hook color"
              value={layout.hookColor || "#ffffff"}
              onChange={(hookColor) => setLayout((p) => ({ ...p, hookColor }))}
              onReset={() => setLayout((p) => ({ ...p, hookColor: undefined }))}
            />
          ) : null}
          {selected === "cta" ? (
            <ColorSwatch
              label="CTA color"
              value={layout.ctaColor || accent}
              onChange={(ctaColor) => setLayout((p) => ({ ...p, ctaColor }))}
              onReset={() => setLayout((p) => ({ ...p, ctaColor: undefined }))}
            />
          ) : null}
          {selected === "logo" && !layout.logo ? (
            <button
              type="button"
              className="chip"
              onClick={() =>
                setLayout((p) => ({ ...p, logo: DEFAULT_CUSTOM_LAYOUT.logo }))
              }
            >
              Add logo
            </button>
          ) : null}
          {selected === "logo" && layout.logo ? (
            <button
              type="button"
              className="chip"
              onClick={() => setLayout((p) => ({ ...p, logo: undefined }))}
            >
              Remove logo
            </button>
          ) : null}
          <button
            type="button"
            className="chip"
            onClick={() => setLayout(DEFAULT_CUSTOM_LAYOUT)}
          >
            Reset
          </button>
        </div>

        <footer className="editor-foot">
          <button type="button" className="chip" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="pill-cta"
            onClick={() => {
              onSave(layout);
              onClose();
            }}
          >
            <span className="fill" />
            <span>Save layout</span>
            <span className="arrow">→</span>
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function Draggable({
  box,
  selected,
  onSelect,
  onStartMove,
  onStartResize,
  children,
}: {
  box: Box;
  selected: boolean;
  onSelect: () => void;
  onStartMove: (e: React.PointerEvent) => void;
  onStartResize: (e: React.PointerEvent, corner: "nw" | "ne" | "sw" | "se") => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`editor-item${selected ? " is-selected" : ""}`}
      style={{
        left: `${box.x}%`,
        top: `${box.y}%`,
        width: `${box.w}%`,
        height: `${box.h}%`,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
        onStartMove(e);
      }}
    >
      {children}
      {selected ? (
        <>
          {(["nw", "ne", "sw", "se"] as const).map((c) => (
            <span
              key={c}
              className={`editor-handle editor-handle--${c}`}
              onPointerDown={(e) => {
                e.stopPropagation();
                onStartResize(e, c);
              }}
            />
          ))}
        </>
      ) : null}
    </div>
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/* Compact colour control for the editor toolbar. Swatch + hex text +
   small popover with a curated preset palette. Uses a hidden native
   <input type="color"> for full-range picking on click; no dependency on
   the settings-dialog color picker (which lives in a portal and would
   layer awkwardly on top of this modal). */
function ColorSwatch({
  label,
  value,
  onChange,
  onReset,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  onReset: () => void;
}) {
  const PRESETS = ["#ffffff", "#0a0b0c", "#d8ff3e", "#3ef0d8", "#4ea8ff", "#a06bff", "#ff6bd2", "#ff5c5c", "#ff9a3c", "#ffd93c"];
  const nativeRef = useRef<HTMLInputElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={wrapRef} className="editor-color">
      <button
        type="button"
        className="editor-color-swatch"
        style={{ background: value }}
        aria-label={`${label} — click to change`}
        onClick={() => setOpen((v) => !v)}
      />
      <span className="mono-label editor-color-label">{label}</span>
      {open ? (
        <div className="editor-color-pop" role="dialog">
          <div className="editor-color-presets">
            {PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className={`editor-color-preset${value.toLowerCase() === c.toLowerCase() ? " is-active" : ""}`}
                style={{ background: c }}
                onClick={() => onChange(c)}
                aria-label={c}
              />
            ))}
          </div>
          <div className="editor-color-hex">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const v = e.target.value.trim();
                onChange(v.startsWith("#") ? v : `#${v}`);
              }}
              spellCheck={false}
              maxLength={7}
            />
            <button
              type="button"
              className="chip chip--sm"
              onClick={() => nativeRef.current?.click()}
              title="Full color picker"
            >
              Pick
            </button>
            <button type="button" className="chip chip--sm" onClick={onReset}>
              Reset
            </button>
          </div>
          <input
            ref={nativeRef}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ display: "none" }}
          />
        </div>
      ) : null}
    </div>
  );
}
