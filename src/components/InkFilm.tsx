import { useEffect, useRef } from "react";
import { fbm4, valueNoise, hexToRgb, mixHsv, ACCENTS, type RGB } from "@/lib/ink";

const BW = 200;
const BH = 113;

const GROUND: RGB = [10, 11, 12];

export function InkFilm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const buffer = document.createElement("canvas");
    buffer.width = BW;
    buffer.height = BH;
    const bctx = buffer.getContext("2d");
    if (!bctx) return;
    const image = bctx.createImageData(BW, BH);
    const data = image.data;

    // Bake the static water base once.
    const base = new Float32Array(BW * BH);
    for (let y = 0; y < BH; y++) {
      for (let x = 0; x < BW; x++) {
        const n = fbm4(x * 0.05, y * 0.05, 11.3);
        base[y * BW + x] = 0.012 + n * 0.03;
      }
    }

    /* ------------------------------------------------------------------
       Glitch pass. Runs on the 200x113 buffer before the upscale, so the
       tears come out chunky and soft-edged rather than hairline-sharp.
       Bursts are short and irregular: long enough to register, rare enough
       that the page still reads as a background and not a broken screen.
       ------------------------------------------------------------------ */
    type Band = { y0: number; y1: number; dx: number; dr: number; db: number; lit: boolean };

    const scratch = new Uint8ClampedArray(BW * BH * 4);
    let bands: Band[] = [];
    let burstUntil = 0;
    let nextBurst = 0;
    let burstZ = 0; // field displacement, so the ink itself tears, not just the pixels

    const planBurst = (now: number) => {
      const count = 4 + ((Math.random() * 8) | 0);
      bands = [];
      for (let i = 0; i < count; i++) {
        const y0 = (Math.random() * BH) | 0;
        const h = 2 + ((Math.random() * 26) | 0);
        bands.push({
          y0,
          y1: Math.min(BH, y0 + h),
          dx: ((Math.random() * 2 - 1) * 64) | 0,
          dr: ((Math.random() * 2 - 1) * 15) | 0,
          db: ((Math.random() * 2 - 1) * 15) | 0,
          lit: Math.random() < 0.5,
        });
      }
      // Occasional hard tear: everything below a point shunts sideways at once.
      if (Math.random() < 0.4) {
        const y0 = ((Math.random() * BH * 0.7) | 0) + 10;
        bands.push({
          y0,
          y1: BH,
          dx: ((Math.random() * 2 - 1) * 40) | 0,
          dr: ((Math.random() * 2 - 1) * 10) | 0,
          db: ((Math.random() * 2 - 1) * 10) | 0,
          lit: true,
        });
      }
      burstZ = (Math.random() * 2 - 1) * 5.5;
      // Long enough for a viewer to actually register the tear, short enough
      // that the page never feels broken.
      burstUntil = now + 130 + Math.random() * 520;
      // Cluster: bursts often arrive in stuttering pairs or triples.
      nextBurst = burstUntil + (Math.random() < 0.45 ? 60 + Math.random() * 140 : 320 + Math.random() * 1500);
    };

    const applyGlitch = () => {
      scratch.set(data);
      for (const b of bands) {
        for (let y = b.y0; y < b.y1; y++) {
          const row = y * BW;
          for (let x = 0; x < BW; x++) {
            const idx = (row + x) << 2;
            const sx = (((x + b.dx) % BW) + BW) % BW;
            const rx = (((x + b.dx + b.dr) % BW) + BW) % BW;
            const bx2 = (((x + b.dx + b.db) % BW) + BW) % BW;
            data[idx] = scratch[(row + rx) << 2] as number;
            data[idx + 1] = scratch[((row + sx) << 2) + 1] as number;
            data[idx + 2] = scratch[((row + bx2) << 2) + 2] as number;
          }
        }
        // A blown-out scan edge on some bands reads as signal loss.
        if (b.lit) {
          const row = b.y0 * BW;
          for (let x = 0; x < BW; x++) {
            const idx = (row + x) << 2;
            data[idx] = Math.min(255, (data[idx] as number) + 90);
            data[idx + 1] = Math.min(255, (data[idx + 1] as number) + 90);
            data[idx + 2] = Math.min(255, (data[idx + 2] as number) + 90);
          }
        }
      }
    };

    // The ramp walks the four accents in order, one per section, cycling for as
    // many [data-section] elements as the page actually has. Derived at measure
    // time so a route with 8 sections and one with 9 both stay anchored.
    const CYCLE: RGB[] = [ACCENTS.acid, ACCENTS.orange, ACCENTS.cyan, ACCENTS.magenta].map(hexToRgb);

    let accents: RGB[] = CYCLE.slice();
    let stops: number[] = accents.map((_, i) => i / (accents.length - 1));

    const measure = () => {
      const total = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
      if (els.length < 2) return;

      accents = els.map((_, i) => CYCLE[i % CYCLE.length] as RGB);
      stops = els.map((el) => {
        const r = el.getBoundingClientRect();
        const centre = r.top + window.scrollY + r.height / 2 - window.innerHeight / 2;
        return Math.min(1, Math.max(0, centre / total));
      });
    };

    const rampColour = (t: number): RGB => {
      const firstStop = stops[0] as number;
      if (t <= firstStop) return accents[0] as RGB;
      for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i] as number;
        const b = stops[i + 1] as number;
        if (t <= b) {
          const k = b - a < 1e-6 ? 0 : (t - a) / (b - a);
          return mixHsv(accents[i] as RGB, accents[i + 1] as RGB, k);
        }
      }
      return accents[accents.length - 1] as RGB;
    };

    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      measure();
      current = -999; // force redraw
    };

    // Seconds since mount, advanced by the loop. Drives the idle drift.
    let clock = 0;

    const render = (t: number) => {
      const [ar, ag, ab] = rampColour(t);

      // Scroll positions the dye; `clock` keeps it moving when nobody is scrolling.
      // The plumes should be visibly alive on a still page — roughly one full
      // rework of the field every ~20s — while scroll still drives the larger
      // shifts between sections.
      const glitching = !reduced && performance.now() < burstUntil;

      // burstZ yanks the noise field sideways mid-burst, so the plumes themselves
      // jump rather than the tear only smearing whatever was already drawn.
      const z = t * 7.5 + clock * 0.34 + (glitching ? burstZ : 0);
      const fx = t * 2.4 + clock * 0.15 + (glitching ? burstZ * 0.4 : 0);
      const fy = -t * 3.1 - clock * 0.105;

      // Drifting radial bias keeps a dense bloom on screen, and keeps it moving.
      const bx = 0.5 + 0.32 * Math.sin(t * 5.1 + 0.7 + clock * 0.21);
      const by = 0.5 + 0.28 * Math.cos(t * 3.7 + 1.9 + clock * 0.16);

      let p = 0;
      for (let y = 0; y < BH; y++) {
        const v = y / BH;
        for (let x = 0; x < BW; x++) {
          const u = x / BW;
          const sx = x * 0.045 + fx;
          const sy = y * 0.045 + fy;

          // two cheap samples -> domain warp
          const w1 = valueNoise(sx * 1.6, sy * 1.6, z * 0.5);
          const w2 = valueNoise(sx * 1.6 + 5.2, sy * 1.6 + 1.3, z * 0.5 + 3.4);

          const f = fbm4(sx + w1 * 2.6, sy + w2 * 2.6, z);

          const dx = (u - bx) * 1.35;
          const dy = v - by;
          const bias = 0.16 * (1 - Math.min(1, Math.sqrt(dx * dx + dy * dy) * 1.7));
          const field = f + bias;

          // two thresholds: dense core + soft skirt (a single one draws contour lines)
          const skirt = Math.min(1, Math.max(0, (field - 0.56) / 0.26));
          const core = Math.min(1, Math.max(0, (field - 0.70) / 0.16));

          // shade plumes using a warp sample so shapes have a near and far side
          const shade = 0.68 + w1 * 0.55;

          const b0 = base[p] as number;
          const dye = skirt * 0.14 + core * 0.34;
          // Flare the dye mid-burst — on a near-black ground a sideways shift of
          // dark pixels is invisible, so the tear needs something bright to move.
          const l = dye * shade * (glitching ? 2.2 : 1);

          const idx = p << 2;
          data[idx] = Math.min(255, GROUND[0] + b0 * 255 + ar * l);
          data[idx + 1] = Math.min(255, GROUND[1] + b0 * 255 + ag * l);
          data[idx + 2] = Math.min(255, GROUND[2] + b0 * 255 + ab * l);
          data[idx + 3] = 255;
          p++;
        }
      }
      if (glitching) applyGlitch();

      bctx.putImageData(image, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(buffer, 0, 0, canvas.width, canvas.height);
    };

    let target = 0;
    let current = -999;
    let last = 0;
    let raf = 0;

    // ~30fps — enough that the moving plumes read as fluid rather than stepped.
    const FRAME_MS = 33;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let t0 = performance.now();
    let hidden = document.hidden;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (hidden) return;

      if (reduced) {
        // No ambient motion — redraw only when the scroll position moves.
        const delta = target - current;
        if (Math.abs(delta) < 0.00025) {
          current = target;
          return; // fully at rest: no redraw
        }
        if (now - last < 33) return;
        last = now;
        current += delta * 0.12;
        render(current);
        return;
      }

      if (now > nextBurst) planBurst(now);

      if (now - last < FRAME_MS) return;
      last = now;
      clock = (now - t0) / 1000;
      const delta = target - current;
      current = Math.abs(delta) < 0.00025 ? target : current + delta * 0.12;
      render(current);
    };

    const onVisibility = () => {
      hidden = document.hidden;
      // Re-anchor so the film resumes where it left off instead of jumping.
      if (!hidden) {
        t0 = performance.now() - clock * 1000;
        last = 0;
      }
    };

    const onScroll = () => {
      const total = Math.max(1, document.body.scrollHeight - window.innerHeight);
      target = Math.min(1, Math.max(0, window.scrollY / total));
    };

    resize();
    onScroll();
    current = target;
    render(current);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="ink-film" aria-hidden="true">
      <canvas ref={canvasRef} />
      <div className="ink-caustics" />
      <div className="ink-vignette" />
      <svg className="ink-grain" xmlns="http://www.w3.org/2000/svg">
        <filter id="inkGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#inkGrain)" />
      </svg>
    </div>
  );
}
