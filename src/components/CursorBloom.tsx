import { useEffect } from "react";
import { gsap } from "gsap";

export function CursorBloom() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = document.createElement("div");
    el.className = "cursor-bloom";
    document.body.appendChild(el);

    const setX = gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" });
    const setY = gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" });

    const move = (e: PointerEvent) => {
      el.style.opacity = "1";
      setX(e.clientX);
      setY(e.clientY);
    };
    window.addEventListener("pointermove", move);

    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-accent-rgb]"));
    const pick = () => {
      const mid = window.innerHeight / 2;
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) {
          document.documentElement.style.setProperty(
            "--bloom-rgb",
            s.dataset["accentRgb"] ?? "216,255,62",
          );
          break;
        }
      }
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", pick);
      el.remove();
    };
  }, []);

  return null;
}
