import { useEffect, useRef } from "react";
import { fbm4, valueNoise, hexToRgb, mixHsv, SECTION_ACCENTS, type RGB } from "@/lib/ink";

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

    const accents = SECTION_ACCENTS.map(hexToRgb);
    let stops: number[] = accents.map((_, i) => i / (accents.length - 1));

    const measure = () => {
      const total = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
      if (els.length === accents.length) {
        stops = els.map((el) => {
          const r = el.getBoundingClientRect();
          const centre = r.top + window.scrollY + r.height / 2 - window.innerHeight / 2;
          return Math.min(1, Math.max(0, centre / total));
        });
      }
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

    const render = (t: number) => {
      const [ar, ag, ab] = rampColour(t);
      const z = t * 7.5;
      const fx = t * 2.4;
      const fy = -t * 3.1;

      // Slowly drifting radial bias keeps a dense bloom on screen at every position.
      const bx = 0.5 + 0.32 * Math.sin(t * 5.1 + 0.7);
      const by = 0.5 + 0.28 * Math.cos(t * 3.7 + 1.9);

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
          const l = dye * shade;

          const idx = p << 2;
          data[idx] = Math.min(255, GROUND[0] + b0 * 255 + ar * l);
          data[idx + 1] = Math.min(255, GROUND[1] + b0 * 255 + ag * l);
          data[idx + 2] = Math.min(255, GROUND[2] + b0 * 255 + ab * l);
          data[idx + 3] = 255;
          p++;
        }
      }
      bctx.putImageData(image, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(buffer, 0, 0, canvas.width, canvas.height);
    };

    let target = 0;
    let current = -999;
    let last = 0;
    let raf = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const delta = target - current;
      if (Math.abs(delta) < 0.00025) {
        current = target;
        return; // fully at rest: no redraw
      }
      if (now - last < 33) return;
      last = now;
      current += delta * 0.12;
      render(current);
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
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
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
