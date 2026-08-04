/// <reference lib="webworker" />
import { InkEngine } from "@/lib/inkEngine";
import type { RGB } from "@/lib/ink";

/* Runs the ink field off the main thread. Workers have no requestAnimationFrame,
   so the clock is a self-scheduling timeout — the engine gates its own frame
   rate anyway, and nothing here needs to align to a display refresh: the result
   is a putImageData into an OffscreenCanvas the compositor picks up. */

type InitMsg = { type: "init"; canvas: OffscreenCanvas; reduced: boolean };
type RampMsg = { type: "ramp"; accents: RGB[]; stops: number[] };
type ScrollMsg = { type: "scroll"; target: number };
type HiddenMsg = { type: "hidden"; hidden: boolean };
type BudgetMsg = { type: "budget"; floorMs: number };
type Msg = InitMsg | RampMsg | ScrollMsg | HiddenMsg | BudgetMsg;

let engine: InkEngine | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

const loop = () => {
  engine?.tick(performance.now());
  // 16ms poll: the engine decides whether the frame is actually due, and a
  // sleeping timeout costs nothing next to the field itself.
  timer = setTimeout(loop, 16);
};

self.onmessage = (e: MessageEvent<Msg>) => {
  const msg = e.data;
  switch (msg.type) {
    case "init": {
      const ctx = msg.canvas.getContext("2d");
      if (!ctx) return;
      engine = new InkEngine(ctx, msg.reduced);
      if (!timer) loop();
      break;
    }
    case "ramp":
      engine?.setRamp(msg.accents, msg.stops);
      break;
    case "scroll":
      engine?.setTarget(msg.target);
      break;
    case "hidden":
      engine?.setHidden(msg.hidden);
      break;
    case "budget":
      engine?.setFloor(msg.floorMs);
      break;
  }
};
