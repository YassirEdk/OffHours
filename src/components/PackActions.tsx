import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePackContext } from "@/context/PackContext";
import { useAuth } from "@/context/AuthContext";
import { BriefPanel } from "@/components/BriefPanel";
import { AuthDialog } from "@/components/AuthDialog";

const GATE_CLOSE_MS = 320;

/* The page's way in. Everything the app can actually do sits here on the cover:
   write a brief, take the pack away, go back to the worked example.
   Writing a brief is gated behind auth — if the user isn't signed in, clicking
   the button opens a small prompt that hands off to the AuthDialog. */
export function PackActions() {
  const { isExample, reset } = usePackContext();
  const { user } = useAuth();
  const [briefOpen, setBriefOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  const onWriteBrief = () => {
    if (user) setBriefOpen(true);
    else setGateOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-3" data-fade>
        <button type="button" className="pill-cta" onClick={onWriteBrief}>
          <span className="fill" />
          <span>{isExample ? "Write your brief" : "Edit your brief"}</span>
          <span className="arrow">→</span>
        </button>

        {/* Only offered once there is something to go back from. */}
        {!isExample ? (
          <button type="button" className="chip" onClick={reset}>
            Back to the example
          </button>
        ) : null}
      </div>

      {!isExample ? (
        <p className="mono-label" data-fade>
          Generated from your brief · every line below is yours
        </p>
      ) : null}

      <BriefPanel open={briefOpen} onClose={() => setBriefOpen(false)} />
      <AuthGate open={gateOpen} onClose={() => setGateOpen(false)} />
    </>
  );
}

/* Small confirm-style dialog that appears when a guest tries to write a brief.
   Two paths out: dismiss, or open the AuthDialog in login mode. Mirrors the
   BriefPanel open/close lifecycle so it plays an exit animation before it
   unmounts. */
function AuthGate({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

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
    }, GATE_CLOSE_MS);
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

  return createPortal(
    <div
      className={`gate-scrim${closing ? " gate-scrim--closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Log in required"
    >
      <button className="gate-backdrop" aria-label="Close" onClick={onClose} type="button" />
      <div className={`gate-panel${closing ? " gate-panel--closing" : ""}`}>
        <p className="mono-label">Log in required</p>
        <h2 className="display gate-title mt-3">Log in to write your brief</h2>
        <p className="body-copy mt-3">
          Writing a brief is for signed-in accounts. Log in or sign up — it takes a minute.
        </p>
        <div className="gate-actions mt-6">
          <button type="button" className="chip" onClick={onClose}>
            Not now
          </button>
          <AuthDialog
            defaultMode="login"
            trigger={
              <button type="button" className="pill-cta">
                <span className="fill" />
                <span>Log in</span>
                <span className="arrow">→</span>
              </button>
            }
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
