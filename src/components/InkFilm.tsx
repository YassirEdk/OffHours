import { useEffect, useRef } from "react";
import { hexToRgb, ACCENTS, type RGB } from "@/lib/ink";
import { InkEngine, BW, BH } from "@/lib/inkEngine";

/* The field itself lives in lib/inkEngine and runs in a worker against an
   OffscreenCanvas. It is ~1M noise lookups per frame; on the main thread that
   competed with scroll, GSAP and layout for the same 16ms, which is what made
   the page feel slow even though the film only asks for 30fps. Off-thread, the
   main thread's only job here is measuring the DOM and posting numbers.

   Browsers without transferControlToOffscreen fall back to the old in-page
   loop, which still works — it is just the thing that has to share. */

export function InkFilm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* Setting .width / .height throws `InvalidStateError` on a canvas whose
       control has already been transferred to a worker — which can happen if
       this effect runs against the same canvas element twice (e.g. a route
       change that reuses the DOM node, an error-boundary reset). Skip and
       bail; the previous mount is still driving it. */
    try {
      canvas.width = BW;
      canvas.height = BH;
    } catch {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // The ramp walks the four accents in order, one per section, cycling for as
    // many [data-section] elements as the page actually has. Derived at measure
    // time so a route with 8 sections and one with 9 both stay anchored.
    const CYCLE: RGB[] = [ACCENTS.acid, ACCENTS.orange, ACCENTS.cyan, ACCENTS.magenta].map(
      hexToRgb,
    );

    let post: (accents: RGB[], stops: number[]) => void;
    let setTarget: (t: number) => void;
    let setHidden: (h: boolean) => void;
    let setFloor: (ms: number) => void;
    let dispose: () => void;

    const worker = supportsOffscreen(canvas)
      ? new Worker(new URL("./inkFilm.worker.ts", import.meta.url), { type: "module" })
      : null;

    if (worker) {
      const offscreen = canvas.transferControlToOffscreen();
      worker.postMessage({ type: "init", canvas: offscreen, reduced }, [offscreen]);
      post = (accents, stops) => worker.postMessage({ type: "ramp", accents, stops });
      setTarget = (target) => worker.postMessage({ type: "scroll", target });
      setHidden = (hidden) => worker.postMessage({ type: "hidden", hidden });
      setFloor = (floorMs) => worker.postMessage({ type: "budget", floorMs });
      dispose = () => worker.terminate();
    } else {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const engine = new InkEngine(ctx, reduced);
      let raf = 0;
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        engine.tick(now);
      };
      raf = requestAnimationFrame(loop);
      post = (accents, stops) => engine.setRamp(accents, stops);
      setTarget = (t) => engine.setTarget(t);
      setHidden = (h) => engine.setHidden(h);
      setFloor = (ms) => engine.setFloor(ms);
      dispose = () => cancelAnimationFrame(raf);
    }

    /* Every canvas update makes the compositor re-blend the grain, the caustics
       and the cursor bloom across the whole viewport. With hardware
       acceleration that is free; without it, measured here, those three layers
       cost more than the field itself. So: watch the frames the page actually
       delivers and, if they are not arriving, shed the most expensive effects
       in order of how little they carry — grain first, then caustics and the
       bloom, plus a slower film. A capable machine never leaves level 0. */
    let level = 0;
    let probeRaf = 0;
    let probeTimer = 0;
    let scrolled = false;

    const applyLevel = (next: number) => {
      if (next <= level) return;
      level = next;
      document.documentElement.setAttribute("data-perf", String(level));
      if (level >= 2) setFloor(66); // ~15fps film
    };

    /* Sampled only while the page is being scrolled. An idle page delivers its
       frames fine even on a machine that collapses under scroll — measuring at
       rest reports everything is well and degrades nothing, which is exactly
       the trap this used to fall into. */
    const probe = () => {
      const samples: number[] = [];
      let rounds = 0;
      let prev = 0;

      const median = () => {
        const sorted = samples.slice().sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)] as number;
      };

      const step = (now: number) => {
        // `scrolled` rather than comparing now against a stored timestamp: rAF's
        // `now` is the frame's start time, which on a struggling machine lags
        // performance.now() by most of a frame — the comparison went negative
        // and the window it was meant to define stopped meaning anything.
        if (prev && scrolled) samples.push(now - prev);
        scrolled = false;
        prev = now;

        /* Two tiers, because the sample window has to be counted in frames
           delivered. A machine at 2fps needs eleven seconds of scrolling to
           produce 24 frames, so waiting for a full window is slowest to help
           exactly the machine in the worst trouble. A handful of frames is
           already conclusive when each one takes 60ms+. */
        if (samples.length >= 8 && median() > 60) {
          applyLevel(2);
          return;
        }
        if (samples.length >= 24) {
          const m = median();
          // 16.7ms = 60fps, 33ms = 30fps. Deliberately lenient: this should fire
          // for a machine in trouble, not for a stray hitch.
          if (m > 45) applyLevel(2);
          else if (m > 27) applyLevel(1);
          samples.length = 0;
          rounds++;
          // Stop once there is nothing left worth shedding, or after a few
          // windows — this loop should not outlive its usefulness.
          if (level >= 2 || rounds >= 3) return;
        }
        probeRaf = requestAnimationFrame(step);
      };
      probeRaf = requestAnimationFrame(step);
    };
    // Let hydration, fonts and the ScrollTrigger setup settle first.
    probeTimer = window.setTimeout(probe, 1200);

    const measure = () => {
      const total = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
      if (els.length < 2) return;

      const accents = els.map((_, i) => CYCLE[i % CYCLE.length] as RGB);
      const stops = els.map((el) => {
        const r = el.getBoundingClientRect();
        const centre = r.top + window.scrollY + r.height / 2 - window.innerHeight / 2;
        return Math.min(1, Math.max(0, centre / total));
      });
      post(accents, stops);
    };

    const onScroll = () => {
      scrolled = true;
      const total = Math.max(1, document.body.scrollHeight - window.innerHeight);
      setTarget(Math.min(1, Math.max(0, window.scrollY / total)));
    };

    const onResize = () => measure();
    const onVisibility = () => setHidden(document.hidden);

    measure();
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(probeRaf);
      clearTimeout(probeTimer);
      dispose();
    };
  }, []);

  return (
    <div className="ink-film" aria-hidden="true">
      <canvas ref={canvasRef} />
      <div className="ink-caustics" />
      <div className="ink-vignette" />
      <svg className="ink-grain" xmlns="http://www.w3.org/2000/svg">
        <filter id="inkGrain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#inkGrain)" />
      </svg>
    </div>
  );
}

function supportsOffscreen(canvas: HTMLCanvasElement) {
  return typeof Worker !== "undefined" && typeof canvas.transferControlToOffscreen === "function";
}
