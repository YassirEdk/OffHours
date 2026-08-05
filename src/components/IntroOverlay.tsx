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
    return () => {
      window.removeEventListener("resize", onResize);
      document.body.classList.remove("intro-active");
      document.body.classList.remove("intro-post");
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const flyTimer = window.setTimeout(() => setPhase("fly"), 1150);
    const doneTimer = window.setTimeout(() => {
      setPhase("gone");
      /* Release the intro-active class FIRST so entrance elements return to
         their natural opacity:1 in the DOM. Then dispatch intro:done — GSAP's
         `.from({opacity:0})` will now read the natural end value correctly
         and animate 0→1. Both are synchronous, so no paint happens in between. */
      document.body.classList.remove("intro-active");
      document.body.classList.add("intro-post");
      window.dispatchEvent(new Event("intro:done"));
      window.setTimeout(() => document.body.classList.remove("intro-post"), 700);
    }, 2950);
    return () => {
      window.clearTimeout(flyTimer);
      window.clearTimeout(doneTimer);
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
