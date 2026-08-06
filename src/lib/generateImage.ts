import { createServerFn } from "@tanstack/react-start";
import type { Brand } from "@/context/BrandContext";

/* Image generation via Together AI (FLUX.1-schnell).

   Server function — the API key sits in TOGETHER_API_KEY on the server, so
   the browser never sees it. FLUX-schnell renders in 4 steps (~2-4 seconds
   real time) at $0.003/image. The $1 signup credit is ~333 images. */

const TOGETHER_URL = "https://api.together.xyz/v1/images/generations";
/* FLUX.1.1-pro — best-in-class text rendering, runs serverless on Together
   (FLUX.1-dev is not serverless there, it needs a rented endpoint). ~$0.04
   per image, so the $1 signup credit is ~25 images. If you want to trade
   quality for cost, drop back to "black-forest-labs/FLUX.1-schnell"
   (~$0.003/image) — text quality will suffer but the code is unchanged. */
const MODEL = "black-forest-labs/FLUX.1.1-pro";

type Input = {
  hook: string;
  cta: string;
  ideaKind: string;
  businessName: string;
  /** From brief.business — e.g. "logistics automation agency", "bakery". */
  businessType: string;
  /** From brief.niche — e.g. "logistics", "sourdough". */
  niche: string;
  brand?: Pick<Brand, "styleKeywords" | "primaryColor"> | null;
  /** Passed by the client so each Regenerate click gets a fresh image. */
  seed: number;
};

export const generateCaptionImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as Input)
  .handler(async ({ data }): Promise<{ dataUrl: string; size: string }> => {
    const key = process.env.TOGETHER_API_KEY;
    if (!key) throw new Error("TOGETHER_API_KEY is not set on the server");

    const prompt = buildPrompt(data);

    const res = await fetch(TOGETHER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        width: 1024,
        height: 1024,
        /* FLUX.1.1-pro manages its own step count — don't pass `steps`, the
           API rejects or ignores it. If you switch back to FLUX-schnell, add
           `steps: 4`; for FLUX-dev-lora / open models add `steps: 28`. */
        n: 1,
        seed: data.seed,
        response_format: "b64_json",
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Together ${res.status}: ${body.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      data?: Array<{ b64_json?: string; url?: string }>;
    };
    const first = json.data?.[0];
    /* Together returns either b64_json (what we asked for) or url — support
       both, fall back to fetching the URL if that's what came back. */
    if (first?.b64_json) {
      return { dataUrl: `data:image/jpeg;base64,${first.b64_json}`, size: "1024x1024" };
    }
    if (first?.url) {
      const imgRes = await fetch(first.url);
      const ct = imgRes.headers.get("content-type") ?? "image/jpeg";
      const buf = new Uint8Array(await imgRes.arrayBuffer());
      let bin = "";
      const chunk = 0x8000;
      for (let i = 0; i < buf.length; i += chunk) {
        bin += String.fromCharCode(...buf.subarray(i, i + chunk));
      }
      return { dataUrl: `data:${ct};base64,${btoa(bin)}`, size: "1024x1024" };
    }
    throw new Error("Together returned no image data");
  });

/* Style pool — rotated per generation so five posts don't all share the
   same mood. Each entry is a complete style spec; the seed picks one. The
   user's own style keywords override the pool entirely if set. */
const STYLE_POOL = [
  "moody cinematic editorial photography, dark near-black background, high contrast, single warm accent light, subtle film grain, 35mm dslr, shallow depth of field",
  "bright natural window light, minimal composition, muted linen palette, magazine editorial, medium format film aesthetic",
  "high contrast documentary photography, chiaroscuro lighting, deep shadows, single hard light source, black and slate palette, gritty film grain",
  "clean commercial studio photography, seamless gradient background, soft diffused lighting, product-catalog polish, colour-graded pastel palette",
  "golden hour outdoor photography, warm amber sunlight, long shadows, cinematic wide-aperture lens, filmic colour grade",
  "cool blue-hour photography, teal and orange colour grade, atmospheric fog, cinematic film-still composition",
  "overhead flatlay editorial, top-down composition, neutral concrete or oak surface, single soft window light, geometric arrangement",
  "moody neon-lit photography, cyberpunk colour palette, magenta and cyan rim lighting, deep blacks, cinematic anamorphic feel",
];

function buildPrompt(input: Input): string {
  /* Pick a style — the user's keywords override the pool entirely (so a
     brand-consistent look is possible when they want one), otherwise rotate
     through STYLE_POOL by seed. Adding a small seed offset for style means
     the scene and the style don't rotate in lockstep. */
  const userStyle = input.brand?.styleKeywords?.trim();
  const style =
    userStyle || STYLE_POOL[Math.abs(input.seed + 7919) % STYLE_POOL.length];
  const color = input.brand?.primaryColor?.trim();
  const scene = visualForNiche(input.niche, input.businessType, input.seed);

  /* Anti-text goes FIRST — FLUX weighs earlier tokens more heavily. Framing
     the shot as a "candid documentary photograph" rather than an "editorial
     image" or "post design" also reduces the model's tendency to add
     signage, logos, and brand text.

     Deliberately NO mention of the business name anywhere in the prompt —
     including it makes FLUX try to render the name as text in the photo
     (that "meaAfrica" lettering baked into the frame). */
  const parts = [
    `NO TEXT, NO LETTERS, NO WORDS, NO SIGNS, NO LOGOS, NO BRAND NAMES, NO WRITING, NO WATERMARKS, NO NUMBERS, NO CAPTIONS anywhere in the image.`,
    `A candid documentary photograph.`,
    `Subject: ${scene}.`,
    `Format: square 1:1 crop, subject offset to the right, generous empty space on the bottom-left.`,
    `Style: ${style}.`,
  ];
  if (color) parts.push(`Subtle ${color} rim light or accent prop.`);
  parts.push(
    "A pure clean photograph with zero typography of any kind — no writing, no lettering, no logos, absolutely no text.",
  );
  return parts.join(" ");
}

/* Turn the brief's niche into a concrete visual — FLUX needs to be told what
   to draw, and needs variety across regenerations so five posts don't all
   show the same truck. Each niche returns an array of concrete scenes; the
   seed picks one, so each regenerate rolls a different visual. */
function visualForNiche(niche: string, businessType: string, seed: number): string {
  const haystack = `${niche} ${businessType}`.toLowerCase();
  const scenes = pickScenes(haystack);
  const pick = scenes[Math.abs(seed) % scenes.length];
  return pick;
}

function pickScenes(haystack: string): string[] {
  if (/(logistic|freight|trucking|shipping|supply|warehouse|3pl|import|export|customs)/.test(haystack)) {
    return [
      "a semi-truck driving on an open highway at golden hour",
      "a cargo ship at a container port stacked with colourful shipping containers",
      "a cargo plane at a night airfield with runway lights",
      "a warehouse interior with tall pallet racks and forklifts, industrial lighting",
      "a hand pushing a stack of cardboard shipping boxes on a wheeled dolly",
      "an overhead shot of cardboard boxes lined up on a conveyor belt",
      "a driver's-eye view through a truck windshield at dawn",
    ];
  }
  if (/(gaming|esports|streamer|twitch|game ?dev)/.test(haystack)) {
    return [
      "a professional gaming setup with a triple-monitor rig lit by RGB",
      "a high-end mechanical keyboard with backlit keys, close-up macro",
      "an ergonomic gaming chair in front of a moody neon-lit desk",
      "a graphics card removed from a PC, held under studio lighting",
      "a controller resting on a dark desk under a single spotlight",
      "an open PC tower with liquid cooling tubes glowing softly",
      "a headset on a stand next to a mouse and mousepad, cinematic",
    ];
  }
  if (/(bakery|patisserie|bread|cafe|coffee|pastry)/.test(haystack)) {
    return [
      "a sourdough loaf being sliced on a wooden board, morning window light",
      "a pour-over coffee dripping into a glass carafe, dark background",
      "espresso being pulled with rich crema, close-up",
      "a rustic bakery counter lined with pastries and croissants",
      "flour-dusted hands shaping dough on a marble surface",
    ];
  }
  if (/(fitness|gym|training|coach|personal trainer|crossfit)/.test(haystack)) {
    return [
      "a barbell loaded with plates on a squat rack, chalky floor, warehouse gym",
      "dumbbells laid out on a rack, moody side lighting",
      "hands wrapping wrists with athletic tape before a workout",
      "an empty boxing ring with a single spotlight",
      "kettlebells lined up in size order on a rubber floor",
    ];
  }
  if (/(fashion|clothing|apparel|boutique|streetwear)/.test(haystack)) {
    return [
      "folded stacks of neutral-toned clothing on a wooden shelf",
      "a clothing rack with linen shirts, soft window light",
      "close-up of denim fabric texture with visible stitching",
      "shoes lined up on a bench in a boutique, editorial lighting",
      "a mannequin torso wearing an unstructured blazer",
    ];
  }
  if (/(restaurant|dining|food|kitchen|chef|catering)/.test(haystack)) {
    return [
      "a chef's hands plating a dish with tweezers, close-up",
      "steam rising from a pan on a professional gas range",
      "an overhead flatlay of ingredients — herbs, oils, produce on marble",
      "a wine glass on a candlelit restaurant table",
      "a cutting board with sliced sourdough and a knife",
    ];
  }
  if (/(salon|barber|beauty|hair|spa|nail)/.test(haystack)) {
    return [
      "professional hairdressing scissors and combs on a marble counter",
      "a barber chair in an empty shop, morning light",
      "a shampoo station with warm ambient lighting",
      "brushes and cosmetics laid flat on a beige surface",
    ];
  }
  if (/(law|legal|attorney|lawyer|paralegal|notary)/.test(haystack)) {
    return [
      "a fountain pen resting on a stack of signed documents",
      "a wall of leather-bound law books in a firm office",
      "a lawyer's desk with a lamp, gavel out of shot",
      "a handshake across a polished conference table",
    ];
  }
  if (/(real ?estate|property|realtor|homes|rentals)/.test(haystack)) {
    return [
      "a set of house keys on a signed contract",
      "an architectural exterior of a modern home at dusk",
      "an empty staged living room with tall windows",
      "a for-sale sign on a manicured suburban lawn",
    ];
  }
  /* Word boundaries around `auto` so this doesn't match "automation" —
     that was pulling a mechanic's-workshop scene for an automation agency. */
  if (/(automotive|autobody|\bauto (shop|repair|service|body)|garage|mechanic|car dealer|dealership|body shop)/.test(haystack)) {
    return [
      "a car on a hydraulic lift in a clean workshop",
      "a torque wrench lying across an engine bay",
      "tools organized on a red pegboard in a garage",
      "a mechanic's gloved hands working under a car hood",
    ];
  }
  if (/(plumb|electric|contractor|trades|construction|handyman|hvac)/.test(haystack)) {
    return [
      "a professional toolbox with tools laid out on a workbench",
      "copper pipes and fittings on a workshop floor",
      "an electrician's meter reading a panel",
      "hands operating a cordless drill, close-up",
    ];
  }
  if (/(print|stationery|business ?card|card ?folio|greeting ?card|invitation|letterpress|packaging design)/.test(haystack)) {
    return [
      "a stack of premium business cards fanned out on a marble surface, top-down macro, moody spotlight",
      "a single embossed business card standing upright against a soft-lit backdrop, shallow depth of field",
      "hands holding a matte-finish business card between thumb and forefinger, cinematic close-up",
      "letterpress printing plates and a stack of freshly printed cards on an oak workshop table",
      "an overhead flatlay of business cards, brand paper samples and a fountain pen on charcoal linen",
      "close-up macro of the edge of a thick cotton-paper business card, showing the crisp die-cut",
    ];
  }
  if (/(agency|marketing|design|studio|creative|branding|advertising)/.test(haystack)) {
    return [
      "a designer's desk with printed brand guidelines and pantone swatches",
      "a laptop showing wireframes, next to a coffee cup",
      "a moodboard pinned to a wall with fabric and paint chips",
      "typography prints laid out on a studio floor",
    ];
  }
  /* AI / automation / SaaS — but note: if the user's business is
     "logistics automation" or "invoicing automation", the specific niche
     matcher above (logistics, finance, etc.) usually catches it first,
     giving them a truck/desk scene rather than a generic laptop shot. */
  if (/(saas|software|tech|\bai\b|automation|no ?code|\bdev\b|\bapi\b|workflow|integrat)/.test(haystack)) {
    return [
      "an overhead shot of a modern desk with a laptop, notebook and a coffee cup — moody spotlight",
      "hands typing on a backlit mechanical keyboard, cinematic close-up",
      "an abstract shot of glowing data-flow lines connecting nodes on a dark background",
      "a laptop screen glowing softly in a dark room, aerial view",
      "a wall of screens showing dashboards in a control room, cool blue lighting",
      "a coffee cup next to an open laptop on a wooden desk, morning light",
    ];
  }
  if (/(finance|accounting|bookkeep|tax|invest)/.test(haystack)) {
    return [
      "a laptop showing a stock chart, a coffee cup nearby",
      "stacks of neatly organized receipts and a calculator",
      "a pen ticking off numbers on a printed spreadsheet",
      "a leather-bound ledger open on a desk with a fountain pen",
    ];
  }
  if (/(medical|clinic|dental|health ?care|therapy|physio)/.test(haystack)) {
    return [
      "a stethoscope resting on a clean medical desk",
      "a bright clinic reception with warm wood accents",
      "medical instruments arranged on a sterile tray",
    ];
  }
  if (/(education|tutor|teach|course|training)/.test(haystack)) {
    return [
      "a stack of open books and a fountain pen on a wooden desk",
      "a chalkboard with faint erased writing, moody lighting",
      "a laptop next to a notebook and highlighter",
    ];
  }
  if (/(travel|tourism|hotel|hospitality|airbnb)/.test(haystack)) {
    return [
      "a suitcase, passport and camera laid out on a bed",
      "a boutique hotel lobby with warm ambient lighting",
      "a plane wing over cloud tops seen through an oval window",
    ];
  }
  if (/(pet|vet|dog|cat|animal)/.test(haystack)) {
    return [
      "a golden retriever sitting patiently on a wooden floor",
      "a veterinarian's hands examining a cat, warm lighting",
      "a pet leash and collar on a vintage side table",
    ];
  }

  /* Fallback — kept deliberately neutral. Earlier version said "professional
     tools relevant to the trade" which literally produced wrenches, drills,
     and pegboards for anything not in the specific matchers above. Neutral
     workspace scenes never miss that badly. */
  return [
    "a minimal desk scene with a laptop, a notebook and a ceramic mug, single warm lamp, dark background",
    "an overhead flatlay of a leather notebook, a fountain pen and a coffee cup on charcoal linen",
    "a moody close-up of a hand writing in a notebook with a fountain pen, warm lamp light",
    "an editorial shot of a clean workspace — laptop closed, a plant, and a mug — soft window light",
    "an abstract shot of soft warm light falling across a matte concrete surface, no props",
  ];
}

function truncate(s: string, max: number): string {
  const trimmed = s.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + "…";
}
