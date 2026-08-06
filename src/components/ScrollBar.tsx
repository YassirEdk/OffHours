import { useEffect, useRef } from "react";

/* Fixed rainbow strip at the top of the viewport whose width tracks the
   page's scroll progress. rAF-throttled so scroll never fights the paint
   loop — the transform-origin left anchor means the growth reads as
   "filling from the logo side" rather than a bar that slides in. */
export function ScrollBar() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
      el.style.transform = `scaleX(${p})`;
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="site-chameleon-bar" aria-hidden="true" />;
}
