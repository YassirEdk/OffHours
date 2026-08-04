import { fbm4, valueNoise, mixHsv, type RGB } from "@/lib/ink";

/* The ink field, extracted from the component so it can run in either place:
   inside a worker against an OffscreenCanvas (the normal path), or on the main
   thread against a plain canvas (the fallback). The host supplies the clock —
   requestAnimationFrame on the main thread, a self-scheduling timeout in the
   worker, which has no rAF. */

export const BW = 200;
export const BH = 113;

const GROUND: RGB = [10, 11, 12];

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

type Band = { y0: number; y1: number; dx: number; dr: number; db: number; lit: boolean };

export class InkEngine {
  private ctx: Ctx2D;
  private image: ImageData;
  private data: Uint8ClampedArray;
  private base: Float32Array;
  private scratch: Uint8ClampedArray;

  private bands: Band[] = [];
  private burstUntil = 0;
  private nextBurst = 0;
  private burstZ = 0;

  private accents: RGB[] = [];
  private stops: number[] = [];

  private target = 0;
  private current = -999;
  private last = 0;
  private clock = 0;
  private t0 = 0;

  private hidden = false;
  private reduced = false;

  /* ~30fps by default — enough that the plumes read as fluid rather than
     stepped. On a machine that cannot hold that, `frameMs` backs off on its own
     (see tick) so the film degrades to a slower drift instead of saturating a
     core and starving everything else. */
  private frameMs = 33;
  private renderCost = 0;
  private floorMs = 33;

  constructor(ctx: Ctx2D, reduced = false) {
    this.ctx = ctx;
    this.reduced = reduced;
    this.image = ctx.createImageData(BW, BH);
    this.data = this.image.data;
    this.scratch = new Uint8ClampedArray(BW * BH * 4);

    // Bake the static water base once.
    this.base = new Float32Array(BW * BH);
    for (let y = 0; y < BH; y++) {
      for (let x = 0; x < BW; x++) {
        const n = fbm4(x * 0.05, y * 0.05, 11.3);
        this.base[y * BW + x] = 0.012 + n * 0.03;
      }
    }
    this.t0 = performance.now();
  }

  setRamp(accents: RGB[], stops: number[]) {
    if (accents.length < 2) return;
    this.accents = accents;
    this.stops = stops;
    this.current = -999; // force a redraw against the new ramp
  }

  setTarget(t: number) {
    this.target = t;
  }

  setHidden(hidden: boolean) {
    this.hidden = hidden;
    if (!hidden) {
      // Re-anchor so the film resumes where it left off instead of jumping.
      this.t0 = performance.now() - this.clock * 1000;
      this.last = 0;
    }
  }

  setReduced(reduced: boolean) {
    this.reduced = reduced;
  }

  /** Slowest the film is allowed to run. Raised when the page reports that it
      cannot composite this many updates a second — every canvas update makes
      the compositor re-blend the overlays above it, so fewer updates buys frames
      back everywhere else. */
  setFloor(ms: number) {
    this.floorMs = Math.max(33, ms);
  }

  /* ------------------------------------------------------------------
     Glitch pass. Runs on the 200x113 buffer before it reaches the screen,
     so the tears come out chunky and soft-edged rather than hairline-sharp.
     Bursts are short and irregular: long enough to register, rare enough
     that the page still reads as a background and not a broken screen.
     ------------------------------------------------------------------ */
  private planBurst(now: number) {
    const count = 4 + ((Math.random() * 8) | 0);
    this.bands = [];
    for (let i = 0; i < count; i++) {
      const y0 = (Math.random() * BH) | 0;
      const h = 2 + ((Math.random() * 26) | 0);
      this.bands.push({
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
      this.bands.push({
        y0,
        y1: BH,
        dx: ((Math.random() * 2 - 1) * 40) | 0,
        dr: ((Math.random() * 2 - 1) * 10) | 0,
        db: ((Math.random() * 2 - 1) * 10) | 0,
        lit: true,
      });
    }
    this.burstZ = (Math.random() * 2 - 1) * 5.5;
    this.burstUntil = now + 130 + Math.random() * 520;
    // Cluster: bursts often arrive in stuttering pairs or triples.
    this.nextBurst =
      this.burstUntil +
      (Math.random() < 0.45 ? 60 + Math.random() * 140 : 320 + Math.random() * 1500);
  }

  private applyGlitch() {
    const { data, scratch } = this;
    scratch.set(data);
    for (const b of this.bands) {
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
  }

  private rampColour(t: number): RGB {
    const { accents, stops } = this;
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
  }

  render(t: number) {
    if (this.accents.length < 2) return;
    const [ar, ag, ab] = this.rampColour(t);
    const { data, base } = this;

    // Scroll positions the dye; `clock` keeps it moving when nobody is
    // scrolling — roughly one full rework of the field every ~20s.
    const glitching = !this.reduced && performance.now() < this.burstUntil;

    // burstZ yanks the noise field sideways mid-burst, so the plumes themselves
    // jump rather than the tear only smearing whatever was already drawn.
    const z = t * 7.5 + this.clock * 0.34 + (glitching ? this.burstZ : 0);
    const fx = t * 2.4 + this.clock * 0.15 + (glitching ? this.burstZ * 0.4 : 0);
    const fy = -t * 3.1 - this.clock * 0.105;

    // Drifting radial bias keeps a dense bloom on screen, and keeps it moving.
    const bx = 0.5 + 0.32 * Math.sin(t * 5.1 + 0.7 + this.clock * 0.21);
    const by = 0.5 + 0.28 * Math.cos(t * 3.7 + 1.9 + this.clock * 0.16);

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

        // two thresholds: dense core + soft skirt (a single one draws contours)
        const skirt = Math.min(1, Math.max(0, (field - 0.56) / 0.26));
        const core = Math.min(1, Math.max(0, (field - 0.7) / 0.16));

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
    if (glitching) this.applyGlitch();

    // Straight blit at native buffer size — CSS stretches the canvas, so the
    // compositor does the upscale instead of a per-frame CPU resample.
    this.ctx.putImageData(this.image, 0, 0);
  }

  /** Called by the host's clock. `now` is a performance.now()-style timestamp. */
  tick(now: number) {
    if (this.hidden) return;

    if (this.reduced) {
      // No ambient motion — redraw only when the scroll position moves.
      const delta = this.target - this.current;
      if (Math.abs(delta) < 0.00025) {
        this.current = this.target;
        return;
      }
      if (now - this.last < 33) return;
      this.last = now;
      this.current += delta * 0.12;
      this.render(this.current);
      return;
    }

    if (now > this.nextBurst) this.planBurst(now);
    if (now - this.last < this.frameMs) return;
    this.last = now;
    this.clock = (now - this.t0) / 1000;

    const delta = this.target - this.current;
    this.current = Math.abs(delta) < 0.00025 ? this.target : this.current + delta * 0.12;

    const t = performance.now();
    this.render(this.current);
    const cost = performance.now() - t;

    /* Keep the duty cycle under ~45%: a machine where one field costs 40ms
       should draw every 90ms, not every 33ms. Smoothed so one slow frame
       doesn't push it around, and capped at 8fps so it never fully stalls. */
    this.renderCost = this.renderCost === 0 ? cost : this.renderCost * 0.8 + cost * 0.2;
    this.frameMs = Math.min(200, Math.max(this.floorMs, this.renderCost * 2.2));
  }
}
