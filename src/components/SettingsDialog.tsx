import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSettings, DEFAULT_SETTINGS, type BrandSettings, type LogoPlacement } from "@/context/SettingsContext";

const CLOSE_MS = 380;
const MAX_IMAGE_BYTES = 900_000; // ~900KB after base64 fits comfortably in user_metadata

const PLACEMENTS: { value: LogoPlacement; label: string }[] = [
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
  { value: "center", label: "Center" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "none", label: "None" },
];

type Tab = "profile" | "company" | "style";

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, saving, save } = useSettings();
  const [draft, setDraft] = useState<BrandSettings>(settings);
  const [tab, setTab] = useState<Tab>("profile");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  /* Reseed the draft each time the panel opens, so an unsaved edit from a
     previous open doesn't stick around. */
  useEffect(() => {
    if (open) {
      setDraft(settings);
      setTab("profile");
      setError(null);
      setNotice(null);
    }
  }, [open, settings]);

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
    setNotice("Saved.");
    window.setTimeout(() => setNotice(null), 1400);
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
            <p className="mono-label">Settings</p>
            <h2 className="display settings-title mt-2">Your workspace</h2>
          </div>
          <button
            type="button"
            className="settings-close"
            aria-label="Close settings"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <nav className="settings-tabs" role="tablist" aria-label="Settings sections">
          <TabButton current={tab} value="profile" onSelect={setTab}>Profile</TabButton>
          <TabButton current={tab} value="company" onSelect={setTab}>Company</TabButton>
          <TabButton current={tab} value="style" onSelect={setTab}>Image style</TabButton>
        </nav>

        <div className="settings-body">
          {tab === "profile" && (
            <section className="settings-section">
              <ImagePickerRow
                label="Profile photo"
                hint="Square works best. Under 900KB."
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
                hint="PNG with transparency reads best. Under 900KB."
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
                <button
                  type="button"
                  className="settings-instagram-btn"
                  onClick={() => setNotice("Instagram connection coming soon.")}
                >
                  <svg
                    className="settings-instagram-icon"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                  </svg>
                  <span>Connect your Instagram</span>
                  <span className="arrow" aria-hidden="true">→</span>
                </button>
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

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="settings-field">
      <span className="mono-label">{label}</span>
      <div className="settings-color-row">
        <input
          type="color"
          className="settings-color-swatch"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          className="settings-input settings-color-hex"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
        />
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
      onError(`Image is too large — keep it under ${Math.round(MAX_IMAGE_BYTES / 1000)}KB.`);
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
