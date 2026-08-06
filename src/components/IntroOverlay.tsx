import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Logo } from "./Logo";

/* Renders a copy of the exact header Logo (same size, same wordmark class) and
   glides it from a big centered state into the header logo's rect. Because it
   is the same Logo props, the final frame is visually identical to the real
   header logo — no proportion jump when the overlay unmounts. */
export function IntroOverlay({ name = "Offhours" }: { name?: string }) {
  const [phase, setPhase] = useState<"hold" | "fly" | "gone">("hold");
  const [ready, setReady] = useState(false);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const styleRef = useRef<React.CSSProperties>({ opacity: 0 });
  const [, force] = useState(0);

  const measure = () => {
    const target = document.querySelector<HTMLElement>(".header-logo");
    if (!target) return false;
    const t = target.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const startScale = Math.min(6, Math.max(3, (vh * 0.38) / t.height));
    const dx = vw / 2 - (t.left + t.width / 2);
    const dy = vh / 2 - (t.top + t.height / 2);
    styleRef.current = {
      position: "fixed",
      top: `${t.top}px`,
      left: `${t.left}px`,
      width: `${t.width}px`,
      height: `${t.height}px`,
      "--start-x": `${dx}px`,
      "--start-y": `${dy}px`,
      "--start-scale": String(startScale),
      opacity: 1,
    } as React.CSSProperties;
    force((n) => n + 1);
    return true;
  };

  useLayoutEffect(() => {
    /* Skip the intro entirely for reduced-motion users, or when the header
       logo isn't in the DOM (other routes) — no flash, no scroll lock. */
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !measure()) {
      setPhase("gone");
      /* Fire intro:done so ContentPack's gated GSAP init unblocks. */
      window.dispatchEvent(new Event("intro:done"));
      return;
    }

    /* Add the class HERE (layout effect, before ContentPack's regular useEffect
       runs) so ContentPack sees it and defers its GSAP init until intro:done. */
    document.body.classList.add("intro-active");
    setReady(true);

    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    /* Fonts landing after first paint shift the header logo by a pixel or two;
       re-measure once they're ready so the fly destination matches where the
       real header logo will actually sit. */
    document.fonts?.ready.then(() => measure()).catch(() => {});
    return () => {
      window.removeEventListener("resize", onResize);
      document.body.classList.remove("intro-active");
      document.body.classList.remove("intro-post");
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    /* Re-measure right before the fly so the landing coords reflect current
       layout, not the initial-paint layout — avoids a small vertical jump
       when the overlay unmounts and the real header logo appears. */
    const flyTimer = window.setTimeout(() => {
      measure();
      setPhase("fly");
    }, 1150);
    /* Reveal text while the logo is still mid-flight: release intro-active and
       fire intro:done ~800ms into the 1700ms fly so GSAP entrance animations
       overlap with the logo settling — no dead pause after it lands. */
    const revealTimer = window.setTimeout(() => {
      /* Hand off from intro-active to intro-flying: text may reveal now, but
         the header logo stays hidden until the flying copy finishes landing
         (otherwise both are on screen at once). */
      document.body.classList.remove("intro-active");
      document.body.classList.add("intro-flying");
      document.body.classList.add("intro-post");
      window.dispatchEvent(new Event("intro:done"));
      window.setTimeout(() => document.body.classList.remove("intro-post"), 700);
    }, 1950);
    /* Overlay stays mounted until the fly transition finishes so the logo
       completes its trip visually, then unmounts and un-hides the header logo. */
    const doneTimer = window.setTimeout(() => {
      setPhase("gone");
      document.body.classList.remove("intro-flying");
    }, 2950);
    return () => {
      window.clearTimeout(flyTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(doneTimer);
      document.body.classList.remove("intro-flying");
    };
  }, [ready]);

  if (phase === "gone") return null;

  return (
    <div className={`intro-overlay intro-overlay--${phase}`} aria-hidden="true">
      <div ref={logoRef} className="intro-logo" style={styleRef.current}>
        <Logo name={name} />
      </div>
    </div>
  );
}
