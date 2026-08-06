import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Mode = "login" | "signup";

type Props = {
  trigger: ReactNode;
  defaultMode?: Mode;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

/* Splits a title into per-character spans with a running --i, so CSS can
   stagger a rise-in animation across the whole phrase (words + accent).
   Keyed by the outer <SplitTitle>, so React remounts on mode change and the
   animation replays each time. */
function SplitTitle({ plain, accent }: { plain: string; accent: string }) {
  const words: { text: string; accent: boolean }[] = [];
  for (const w of plain.split(" ")) if (w) words.push({ text: w, accent: false });
  words.push({ text: accent, accent: true });
  let idx = 0;

  return (
    <span className="auth-split">
      {words.map((w, wi) => (
        <span key={wi} className="auth-word">
          {[...w.text].map((c) => {
            const i = idx++;
            return (
              <span
                key={i}
                className={`auth-char${w.accent ? " auth-char--accent" : ""}`}
                style={{ ["--i" as string]: i }}
              >
                {c}
              </span>
            );
          })}
          {wi < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}

export function AuthDialog({ trigger, defaultMode = "login" }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(defaultMode);
  // direction tracks which way the tab was crossed so the slide animation
  // reads as motion in that direction (login on left, signup on right).
  const [dir, setDir] = useState<"forward" | "back">("forward");

  const goto = (next: Mode) => {
    if (next === mode) return;
    setDir(next === "signup" ? "forward" : "back");
    setMode(next);
  };

  // Lock page scroll while the dialog is open so the site's scrollbar
  // behind the modal disappears. Restores the previous overflow on close
  // so we never leave the page in a stuck state.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    // Compensate for the vanished scrollbar so the page doesn't shift.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        /* Reset mode *after* the close animation completes (~220ms in
           styles.css @keyframes auth-panel-out) — resetting synchronously
           remounts the keyed head/form divs mid-close and glitches the
           final frame. */
        if (!o) window.setTimeout(() => setMode(defaultMode), 400);
      }}
    >
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="auth-overlay" />
        <DialogPrimitive.Content className="auth-panel" aria-describedby={undefined}>
          <DialogPrimitive.Close aria-label="Close" className="auth-close">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>

          <div key={`head-${mode}`} className={`auth-head auth-swap auth-swap--${dir}`}>
            <p className="mono-label">
              {mode === "login" ? "01 — Log in" : "02 — Sign up"}
            </p>
            <span className="rule-56 sect-rule mt-2" />
            <DialogPrimitive.Title asChild>
              <h2 className="display auth-title mt-5">
                {mode === "login" ? (
                  <SplitTitle plain="Welcome" accent="back" />
                ) : (
                  <SplitTitle plain="Create your" accent="account" />
                )}
              </h2>
            </DialogPrimitive.Title>
            <p className="body-copy mt-3">
              {mode === "login"
                ? "Enter the email and password you signed up with."
                : "Pick an email and a strong password. Eight characters minimum."}
            </p>
          </div>

          <div className="auth-tabs">
            {/* Sliding pill under the active tab. Uses --tab (0 or 1) so the
                highlight travels horizontally when the mode switches. */}
            <span
              className="auth-tab-indicator"
              style={{ ["--tab" as string]: mode === "login" ? 0 : 1 }}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => goto("login")}
              className={`auth-tab ${mode === "login" ? "is-active" : ""}`}
              aria-pressed={mode === "login"}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => goto("signup")}
              className={`auth-tab ${mode === "signup" ? "is-active" : ""}`}
              aria-pressed={mode === "signup"}
            >
              Sign up
            </button>
          </div>

          <div key={`form-${mode}`} className={`auth-form-wrap auth-swap auth-swap--${dir}`}>
            {mode === "login" ? (
              <LoginForm onDone={() => setOpen(false)} />
            ) : (
              <SignupForm onDone={() => goto("login")} />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Field({
  id,
  label,
  hint,
  ...props
}: {
  id: string;
  label: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="auth-field">
      <label htmlFor={id} className="mono-label">
        {label}
      </label>
      <input id={id} className="auth-input" {...props} />
      {hint && <p className="auth-hint">{hint}</p>}
    </div>
  );
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) {
      setError("Invalid email or password.");
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="auth-form" noValidate>
      <Field
        id="login-email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        maxLength={254}
      />
      <Field
        id="login-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        maxLength={128}
      />
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="auth-submit" disabled={submitting}>
        <span className="fill" />
        <span className="label">{submitting ? "Logging in…" : "Log in"}</span>
        <span className="arrow">→</span>
      </button>
    </form>
  );
}

function SignupForm({ onDone }: { onDone: () => void }) {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setNotice(null);
    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email.trim(), password, name.trim());
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    setNotice("Account created. Check your inbox if confirmation is required, then log in.");
    setTimeout(onDone, 1400);
  }

  return (
    <form onSubmit={onSubmit} className="auth-form" noValidate>
      <Field
        id="signup-name"
        label="Name"
        type="text"
        autoComplete="name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
      />
      <Field
        id="signup-email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        maxLength={254}
      />
      <Field
        id="signup-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={MIN_PASSWORD}
        maxLength={128}
        hint={`At least ${MIN_PASSWORD} characters`}
      />
      <Field
        id="signup-confirm"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        maxLength={128}
      />
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="auth-notice" role="status">
          {notice}
        </p>
      )}
      <button type="submit" className="auth-submit" disabled={submitting}>
        <span className="fill" />
        <span className="label">{submitting ? "Creating account…" : "Sign up"}</span>
        <span className="arrow">→</span>
      </button>
    </form>
  );
}
