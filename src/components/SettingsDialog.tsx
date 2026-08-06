import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { useSettings, DEFAULT_SETTINGS, type BrandSettings, type LogoPlacement } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { startInstagramOauth, disconnectInstagram } from "@/lib/instagramOauth";
import { startFacebookOauth, disconnectFacebook } from "@/lib/facebookOauth";
import { listPlans } from "@/lib/plannedPosts";
import { listSavedPacks } from "@/lib/savedPacks";

const CLOSE_MS = 380;
const MAX_IMAGE_BYTES = 1_500_000; // 1.5MB — base64 inflates it to ~2MB in user_metadata, still fine

const PLACEMENTS: { value: LogoPlacement; label: string }[] = [
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
  { value: "center", label: "Center" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "none", label: "None" },
];

type Tab = "profile" | "company" | "style" | "published" | "history";
export type SettingsVariant = "profile" | "settings";

/* variant switches which set of tabs is shown:
   - "profile"  → Profile + Company (avatar click)
   - "settings" → Image preferences + Published + History (gear click) */
export function SettingsDialog({
  open,
  onClose,
  variant = "settings",
}: {
  open: boolean;
  onClose: () => void;
  variant?: SettingsVariant;
}) {
  const { settings, saving, save } = useSettings();
  const { user, refresh } = useAuth();
  const [draft, setDraft] = useState<BrandSettings>(settings);
  const initialTab: Tab = variant === "profile" ? "profile" : "style";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const [connecting, setConnecting] = useState<"ig" | "fb" | null>(null);

  async function onConnectInstagram() {
    if (!user) {
      setError("You need to be signed in to connect Instagram.");
      return;
    }
    setError(null);
    setConnecting("ig");
    try {
      const { url } = await startInstagramOauth({ data: { userId: user.id } });
      window.open(url, "_blank", "noopener,noreferrer");
      setConnecting(null);
      setNotice("Opened in a new tab. Finish the connection there, then reopen Settings.");
    } catch (e) {
      setConnecting(null);
      setError(e instanceof Error ? e.message : "Couldn't start the connection flow.");
    }
  }

  async function onConnectFacebook() {
    if (!user) {
      setError("You need to be signed in to connect Facebook.");
      return;
    }
    setError(null);
    setConnecting("fb");
    try {
      const { url } = await startFacebookOauth({ data: { userId: user.id } });
      window.open(url, "_blank", "noopener,noreferrer");
      setConnecting(null);
      setNotice("Opened in a new tab. Finish the connection there, then reopen Settings.");
    } catch (e) {
      setConnecting(null);
      setError(e instanceof Error ? e.message : "Couldn't start the connection flow.");
    }
  }

  async function onDisconnectInstagram() {
    if (!user) return;
    setError(null);
    setConnecting("ig");
    try {
      await disconnectInstagram({ data: { userId: user.id } });
      await refresh();
      setNotice("Instagram disconnected.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't disconnect Instagram.");
    } finally {
      setConnecting(null);
    }
  }

  async function onDisconnectFacebook() {
    if (!user) return;
    setError(null);
    setConnecting("fb");
    try {
      await disconnectFacebook({ data: { userId: user.id } });
      await refresh();
      setNotice("Facebook disconnected.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't disconnect Facebook.");
    } finally {
      setConnecting(null);
    }
  }

  /* Reseed the draft each time the panel opens, so an unsaved edit from a
     previous open doesn't stick around. */
  useEffect(() => {
    if (open) {
      setDraft(settings);
      setTab(variant === "profile" ? "profile" : "style");
      setError(null);
      setNotice(null);
    }
  }, [open, settings, variant]);

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

  const patchProfile = (p: Partial<BrandSettings["profile"]>) =>
    setDraft((d) => ({ ...d, profile: { ...d.profile, ...p } }));
  const patchCompany = (p: Partial<BrandSettings["company"]>) =>
    setDraft((d) => ({ ...d, company: { ...d.company, ...p } }));
  const patchStyle = (p: Partial<BrandSettings["imageStyle"]>) =>
    setDraft((d) => ({ ...d, imageStyle: { ...d.imageStyle, ...p } }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const { error } = await save(draft);
    if (error) {
      setError(error);
      return;
    }
    /* Silent success — close the panel instead of flashing a "Saved." toast.
       Errors still surface via setError above. */
    onClose();
  }

  return createPortal(
    <div
      className={`settings-scrim${closing ? " settings-scrim--closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <button className="settings-backdrop" aria-label="Close" onClick={onClose} type="button" />
      <form
        className={`settings-panel${closing ? " settings-panel--closing" : ""}`}
        onSubmit={onSubmit}
      >
        <header className="settings-head">
          <div>
            <p className="mono-label">{variant === "profile" ? "Profile" : "Settings"}</p>
            <h2 className="display settings-title mt-2">
              {variant === "profile" ? "Your Profile" : "Your workspace"}
            </h2>
          </div>
          <button
            type="button"
            className="settings-close"
            aria-label="Close settings"
            onClick={onClose}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <nav className="settings-tabs" role="tablist" aria-label="Settings sections">
          {variant === "profile" ? (
            <>
              <TabButton current={tab} value="profile" onSelect={setTab}>Profile</TabButton>
              <TabButton current={tab} value="company" onSelect={setTab}>Company</TabButton>
            </>
          ) : (
            <>
              <TabButton current={tab} value="style" onSelect={setTab}>Image preferences</TabButton>
              <TabButton current={tab} value="published" onSelect={setTab}>Published</TabButton>
              <TabButton current={tab} value="history" onSelect={setTab}>Saved</TabButton>
            </>
          )}
        </nav>

        <div className="settings-body">
          {tab === "profile" && (
            <section className="settings-section">
              <ImagePickerRow
                label="Profile photo"
                hint="Square works best. Under 1.5 MB."
                value={draft.profile.photo}
                onChange={(photo) => patchProfile({ photo })}
                onError={setError}
                rounded
              />
              <TextRow
                label="Name"
                placeholder="Your name"
                value={draft.profile.name}
                onChange={(name) => patchProfile({ name })}
              />
            </section>
          )}

          {tab === "company" && (
            <section className="settings-section">
              <ImagePickerRow
                label="Company logo"
                hint="PNG with transparency reads best. Under 1.5 MB."
                value={draft.company.logo}
                onChange={(logo) => patchCompany({ logo })}
                onError={setError}
              />
              <TextRow
                label="Company name"
                placeholder="Offhours"
                value={draft.company.name}
                onChange={(name) => patchCompany({ name })}
              />
              <div className="settings-grid-2">
                <ColorRow
                  label="Primary color"
                  value={draft.company.primaryColor}
                  onChange={(primaryColor) => patchCompany({ primaryColor })}
                />
                <ColorRow
                  label="Secondary color"
                  value={draft.company.secondaryColor}
                  onChange={(secondaryColor) => patchCompany({ secondaryColor })}
                />
              </div>
              <div className="settings-field">
                <span className="mono-label">Connections</span>
                <div className="settings-connections-row">
                  <ConnectionChip
                    variant="fb"
                    connected={
                      ((user?.user_metadata ?? {}) as {
                        facebook?: { pageName?: string | null };
                      }).facebook?.pageName ?? null
                    }
                    connecting={connecting === "fb"}
                    onConnect={onConnectFacebook}
                    onDisconnect={onDisconnectFacebook}
                    disabled={connecting !== null}
                  />
                  <ConnectionChip
                    variant="ig"
                    connected={
                      ((user?.user_metadata ?? {}) as {
                        instagram?: { igUsername?: string | null };
                      }).instagram?.igUsername ?? null
                    }
                    connectedPrefix="@"
                    connecting={connecting === "ig"}
                    onConnect={onConnectInstagram}
                    onDisconnect={onDisconnectInstagram}
                    disabled={connecting !== null}
                  />
                </div>
              </div>
            </section>
          )}

          {tab === "style" && (
            <section className="settings-section">
              <div className="settings-field">
                <label className="mono-label">Logo placement on generated images</label>
                <div className="settings-chip-row">
                  {PLACEMENTS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      className="chip"
                      aria-pressed={draft.imageStyle.logoPlacement === p.value}
                      onClick={() => patchStyle({ logoPlacement: p.value })}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="settings-field">
                <label htmlFor="settings-notes" className="mono-label">
                  Style notes
                </label>
                <p className="settings-hint">
                  Freeform direction the image generator will read. Photography style, mood,
                  colors to avoid, subject preferences, etc.
                </p>
                <textarea
                  id="settings-notes"
                  className="settings-textarea"
                  rows={5}
                  placeholder="e.g. warm natural light, muted greens, no stock people, product-first"
                  value={draft.imageStyle.notes}
                  onChange={(e) => patchStyle({ notes: e.target.value })}
                />
              </div>
            </section>
          )}

          {tab === "history" && (
            <HistorySection userId={user?.id ?? null} onClose={onClose} mode="packs" />
          )}
          {tab === "published" && (
            <HistorySection userId={user?.id ?? null} onClose={onClose} mode="plans" />
          )}

          {error && (
            <p className="auth-error mt-3" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="auth-notice mt-3" role="status">
              {notice}
            </p>
          )}
        </div>

        <footer className="settings-foot">
          <button
            type="button"
            className="chip"
            onClick={() => setDraft(DEFAULT_SETTINGS)}
            disabled={saving}
          >
            Reset
          </button>
          <div className="settings-foot-right">
            <button type="button" className="chip" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="pill-cta" disabled={saving}>
              <span className="fill" />
              <span>{saving ? "Saving…" : "Save"}</span>
              <span className="arrow">→</span>
            </button>
          </div>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

function TabButton({
  current,
  value,
  onSelect,
  children,
}: {
  current: Tab;
  value: Tab;
  onSelect: (t: Tab) => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`settings-tab${active ? " is-active" : ""}`}
      onClick={() => onSelect(value)}
    >
      {children}
    </button>
  );
}

function TextRow({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="settings-field">
      <span className="mono-label">{label}</span>
      <input
        type="text"
        className="settings-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/* Curated brand-palette suggestions — one nice colour per hue family, biased
   toward saturations that read well on dark UI. Users can still type any
   hex or pick freely via the native color input tucked behind the swatch. */
const COLOR_PRESETS = [
  "#d8ff3e", "#3ef0d8", "#4ea8ff", "#a06bff", "#ff6bd2", "#ff5c5c",
  "#ff9a3c", "#ffd93c", "#7fe17f", "#0a0b0c", "#f5f3ef", "#8892a6",
];

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  /* Fixed-position style computed from the trigger's viewport rect so the
     popover can escape the scrolling settings body. Recomputed on open,
     window resize, and scroll. */
  const [popStyle, setPopStyle] = useState<React.CSSProperties>({});
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const PICK_W = 260;
    const PICK_H = 340;
    const M = 12; // viewport margin
    const compute = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const roomBelow = window.innerHeight - r.bottom - M;
      const flipUp = roomBelow < PICK_H && r.top - M > roomBelow;
      const top = flipUp ? Math.max(M, r.top - PICK_H - 8) : r.bottom + 8;
      // Right-align if the trigger sits close to the right edge.
      const wantLeft = r.left;
      const maxLeft = window.innerWidth - PICK_W - M;
      const left = Math.min(Math.max(M, wantLeft), maxLeft);
      setPopStyle({ position: "fixed", top: `${top}px`, left: `${left}px`, width: `${PICK_W}px` });
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open]);

  /* Close the popover on outside click / Esc so it never sticks open. */
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const normalise = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed) return trimmed;
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  };

  return (
    <div className="settings-field">
      <span className="mono-label">{label}</span>
      <div className="picker-wrap" ref={wrapRef}>
        <button
          ref={triggerRef}
          type="button"
          className="picker-trigger"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="picker-swatch" style={{ background: value }} aria-hidden="true" />
          <span className="picker-value">{value.toUpperCase()}</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {open ? createPortal(
          <div
            className="picker-popover"
            style={popStyle}
            role="dialog"
            aria-label={`${label} picker`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <HsvArea value={value} onChange={onChange} />
            <HueStrip value={value} onChange={onChange} />
            <div className="picker-presets" role="listbox" aria-label="Preset colors">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`picker-preset${value.toLowerCase() === c.toLowerCase() ? " is-active" : ""}`}
                  style={{ background: c }}
                  onClick={() => onChange(c)}
                  aria-label={c}
                  title={c}
                />
              ))}
            </div>
            <div className="picker-hex-row">
              <span className="mono-label picker-hex-label">HEX</span>
              <input
                type="text"
                className="picker-hex-input"
                value={value}
                onChange={(e) => onChange(normalise(e.target.value))}
                placeholder="#000000"
                spellCheck={false}
                maxLength={7}
              />
            </div>
          </div>,
          document.body,
        ) : null}
      </div>
    </div>
  );
}

function ImagePickerRow({
  label,
  hint,
  value,
  onChange,
  onError,
  rounded = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (dataUrl: string) => void;
  onError: (msg: string) => void;
  rounded?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = () => inputRef.current?.click();
  const clear = () => onChange("");

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      onError(`Image is too large — keep it under ${(MAX_IMAGE_BYTES / 1_000_000).toFixed(1)} MB.`);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.onerror = () => onError("Couldn't read that image.");
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="settings-field settings-image-field">
      <span className="mono-label">{label}</span>
      <div className="settings-image-row">
        <div
          className={`settings-image-preview${rounded ? " settings-image-preview--round" : ""}`}
          aria-hidden="true"
        >
          {value ? <img src={value} alt="" /> : <span className="settings-image-empty">—</span>}
        </div>
        <div className="settings-image-actions">
          <button type="button" className="chip" onClick={pick}>
            {value ? "Replace" : "Upload"}
          </button>
          {value && (
            <button type="button" className="chip" onClick={clear}>
              Remove
            </button>
          )}
          {hint && <p className="settings-hint">{hint}</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

/* Chip that toggles between "Connect" (disconnected) and a labelled pill
   showing the connected account with a disconnect × button. One component
   covers both Facebook and Instagram — brand colour and glyph come from the
   variant class in CSS. */
function ConnectionChip({
  variant,
  connected,
  connectedPrefix = "",
  connecting,
  disabled,
  onConnect,
  onDisconnect,
}: {
  variant: "fb" | "ig";
  connected: string | null;
  connectedPrefix?: string;
  connecting: boolean;
  disabled: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const glyph =
    variant === "fb" ? (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.93.26-1.56 1.6-1.56H16.7V4.28c-.3-.04-1.36-.13-2.6-.13-2.57 0-4.33 1.57-4.33 4.45v2.2H7v3.2h2.77V22h3.73z" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
           strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    );

  if (connected) {
    return (
      <div className={`conn-chip conn-chip--${variant}`}>
        <span className="conn-chip-glyph" aria-hidden="true">{glyph}</span>
        <span className="conn-chip-name">{connectedPrefix}{connected}</span>
        <button
          type="button"
          className="conn-chip-disconnect"
          onClick={onDisconnect}
          disabled={disabled}
          aria-label={`Disconnect ${variant === "fb" ? "Facebook" : "Instagram"}`}
          title={`Disconnect ${variant === "fb" ? "Facebook" : "Instagram"}`}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
          </svg>
        </button>
      </div>
    );
  }

  const btnClass = variant === "fb" ? "settings-facebook-btn" : "settings-instagram-btn";
  const iconClass = variant === "fb" ? "settings-facebook-icon" : "settings-instagram-icon";
  const label =
    variant === "fb"
      ? connecting
        ? "Redirecting…"
        : "Connect your Facebook"
      : connecting
        ? "Redirecting…"
        : "Connect your Instagram";

  return (
    <button type="button" className={btnClass} onClick={onConnect} disabled={disabled}>
      <span className={iconClass}>{glyph}</span>
      <span>{label}</span>
      <span className="arrow" aria-hidden="true">→</span>
    </button>
  );
}

/* History tab — lists the user's saved plans (public.plans table), newest
   first. Each row links to /plan/<id>. Fetched on mount + when the userId
   changes; no live subscription (opening Settings again re-fetches). */
type HistoryRow =
  | { kind: "plan"; id: string; brief_name: string | null; created_at: string; count: number }
  | { kind: "pack"; id: string; brief_name: string | null; created_at: string; count: number };

function HistorySection({
  userId,
  onClose,
  mode,
}: {
  userId: string | null;
  onClose: () => void;
  mode: "packs" | "plans";
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!userId) {
      setStatus("ready");
      setRows([]);
      return;
    }
    let cancelled = false;
    setStatus("loading");
    const fetcher =
      mode === "packs"
        ? listSavedPacks({ data: { userId } }).then(({ packs }) =>
            packs.map((p): HistoryRow => ({
              kind: "pack",
              id: p.id,
              brief_name: p.brief_name,
              created_at: p.created_at,
              count: p.imageCount,
            })),
          )
        : listPlans({ data: { userId } }).then(({ plans }) =>
            plans.map((p): HistoryRow => ({
              kind: "plan",
              id: p.id,
              brief_name: p.brief_name,
              created_at: p.created_at,
              count: p.count,
            })),
          );
    fetcher
      .then((next) => {
        if (cancelled) return;
        setRows(next);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "Couldn't load history.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [userId, mode]);

  if (!userId) {
    return (
      <section className="settings-section">
        <p className="settings-hint">Sign in to see your saved plans.</p>
      </section>
    );
  }
  if (status === "loading") {
    return (
      <section className="settings-section">
        <p className="settings-hint">Loading history…</p>
      </section>
    );
  }
  if (status === "error") {
    return (
      <section className="settings-section">
        <p className="auth-error" role="alert">{errorMsg}</p>
      </section>
    );
  }
  if (rows.length === 0) {
    return (
      <section className="settings-section">
        <p className="settings-hint">
          {mode === "packs" ? (
            <>Nothing saved yet. Generate a pack, then hit <strong>Save pack</strong> on /pack.</>
          ) : (
            <>No publish plans yet. Generate a pack, then hit <strong>Plan publish</strong> on /pack.</>
          )}
        </p>
      </section>
    );
  }

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <section className="settings-section">
      <ul className="history-list">
        {rows.map((row) => {
          const isPack = row.kind === "pack";
          const link = isPack ? (
            <Link
              to="/pack/saved/$id"
              params={{ id: row.id }}
              onClick={onClose}
              className="history-row-link"
            >
              <RowInner row={row} isPack fmt={fmt} />
            </Link>
          ) : (
            <Link
              to="/plan/$id"
              params={{ id: row.id }}
              onClick={onClose}
              className="history-row-link"
            >
              <RowInner row={row} isPack={false} fmt={fmt} />
            </Link>
          );
          return (
            <li key={`${row.kind}-${row.id}`} className="history-row">
              {link}
            </li>
          );
        })}
      </ul>
      <p className="settings-hint mt-3">
        Only you can open these links — plans are locked to the account that created them.
      </p>
    </section>
  );
}

function RowInner({
  row,
  isPack,
  fmt,
}: {
  row: { brief_name: string | null; count: number; created_at: string };
  isPack: boolean;
  fmt: (iso: string) => string;
}) {
  const label = isPack ? "Pack" : "Plan";
  const unit = isPack ? "image" : "post";
  return (
    <>
      <div className="history-row-main">
        <span className="history-row-title">
          {row.brief_name || `Untitled ${label.toLowerCase()}`}
        </span>
        <span className="history-row-meta">
          <span className={`history-row-badge history-row-badge--${isPack ? "pack" : "plan"}`}>
            {label}
          </span>
          {row.count} {unit}{row.count === 1 ? "" : "s"} · {fmt(row.created_at)}
        </span>
      </div>
      <span className="history-row-arrow" aria-hidden="true">→</span>
    </>
  );
}

/* ---------- Custom HSV color picker ---------- */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const n = h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h.padEnd(6, "0").slice(0, 6);
  const r = parseInt(n.slice(0, 2), 16) || 0;
  const g = parseInt(n.slice(2, 4), 16) || 0;
  const b = parseInt(n.slice(4, 6), 16) || 0;
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60)      [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else              [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function hexToHsv(hex: string): [number, number, number] {
  return rgbToHsv(...hexToRgb(hex));
}

function useDrag(
  onMove: (e: { clientX: number; clientY: number }) => void,
  ref: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let dragging = false;
    const start = (e: PointerEvent) => {
      dragging = true;
      el.setPointerCapture(e.pointerId);
      onMove(e);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      onMove(e);
    };
    const end = (e: PointerEvent) => {
      dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch {}
    };
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    return () => {
      el.removeEventListener("pointerdown", start);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
    };
  }, [onMove, ref]);
}

function HsvArea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, s, v] = hexToHsv(value);
  const areaRef = useRef<HTMLDivElement | null>(null);

  useDrag((e) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const [r, g, b] = hsvToRgb(h, nx, 1 - ny);
    onChange(rgbToHex(r, g, b));
  }, areaRef);

  const hueColor = `hsl(${h}, 100%, 50%)`;
  return (
    <div
      ref={areaRef}
      className="picker-sv"
      style={{ background: hueColor }}
      role="slider"
      aria-label="Saturation and brightness"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
    >
      <div className="picker-sv-white" />
      <div className="picker-sv-black" />
      <div
        className="picker-sv-thumb"
        style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%`, background: value }}
      />
    </div>
  );
}

function HueStrip({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, s, v] = hexToHsv(value);
  const stripRef = useRef<HTMLDivElement | null>(null);
  useDrag((e) => {
    const el = stripRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newH = nx * 360;
    const [r, g, b] = hsvToRgb(newH, s || 1, v || 1);
    onChange(rgbToHex(r, g, b));
  }, stripRef);
  return (
    <div
      ref={stripRef}
      className="picker-hue"
      role="slider"
      aria-label="Hue"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(h)}
    >
      <div className="picker-hue-thumb" style={{ left: `${(h / 360) * 100}%` }} />
    </div>
  );
}
