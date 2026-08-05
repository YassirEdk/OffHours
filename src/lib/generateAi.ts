import { createServerFn } from "@tanstack/react-start";
import type { Brief, ContentPack, Idea, Caption, IdeaKind } from "@/lib/pack";
import { generatePack as generateDeterministic } from "@/lib/generate";

/* Server function — calls Groq server-side so the API key never reaches the
   browser. The client calls generatePackAi({ data: brief }); this handler runs
   in Node under TanStack Start's server runtime.

   Falls back to the deterministic generator if the key is missing or the API
   errors: the app should never dead-end because Groq is down. */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
/* Llama 3.3 70B is the best free-tier model on Groq for structured JSON. If
   you want faster/cheaper, try "llama-3.1-8b-instant"; for better reasoning,
   "deepseek-r1-distill-llama-70b". */
const MODEL = "llama-3.3-70b-versatile";

const IDEA_KINDS: IdeaKind[] = ["proof", "opinion", "build", "series", "receipt"];

const SYSTEM_PROMPT = `You write social-media content packs for small businesses. The user gives you a brief. You return a JSON object matching the shape below — no prose, no markdown, only JSON.

The pack has FIVE ideas, one for each of these kinds, in this exact order:
  proof   — one real number, one real process, one small ask
  opinion — a specific position the business will say in public
  build   — screen recording, show the work, no music
  series  — a standing weekly series with three distinct posts
  receipt — one client, one before-and-after, real numbers

Each idea has EXACTLY three captions. Each caption has a hook (one line, the first 2 seconds), a body (several sentences, use \\n for line breaks), a cta (call-to-action), and an ask that is one of "save", "share", "comment", "follow".

For the SERIES idea only, each of its three captions has a variant object: { label, title, format } — because the three captions are three different posts, not three ways to write the same one.

Hashtags: 10 to 15 per idea, no duplicates within an idea, niche-specific tags first.

Return this JSON shape exactly:
{
  "ideas": [
    {
      "kind": "proof" | "opinion" | "build" | "series" | "receipt",
      "title": "short internal name",
      "premise": "one sentence on why this post works",
      "format": "production note, e.g. 'Reel + TikTok · 22 sec · screen recording'",
      "captions": [
        { "hook": "...", "body": "...", "cta": "...", "ask": "save|share|comment|follow", "variant": { "label": "...", "title": "...", "format": "..." } }
      ],
      "hashtags": ["#tag1", "#tag2", "..."]
    }
  ],
  "cadence": [
    { "day": "Tuesday", "idea": "The weekly deletions" },
    { "day": "Thursday", "idea": "The position" },
    { "day": "Sunday", "idea": "Show the work" },
    { "day": "Monthly", "idea": "The receipt" },
    { "day": "Stories", "idea": "Daily · 3 frames" }
  ]
}

Use the brief's proof numbers (task, before, cost, who, client, took) concretely in the captions. Vague captions ("unlock the power of AI") are the thing to avoid — real numbers and real steps are the point.

Voice rules — read carefully, these are the ones that make output sound written by a human rather than a template:
  - Never place brief.who (or brief.name) as an appositive after "I" or "We". The string "I, Me,", "I, {name},", "We, the team,", or any "I, X,"/"We, X," construction is forbidden. If the sentence starts in first person, just say "I" or "We".
  - brief.who describes who does the manual task. Refer to that person by role in the third person ("our office manager"), or fold it into the sentence naturally. Do not use it as the speaker's name.
  - Do not emit template placeholder text of any kind: no "{name}", no "[Name]", no "Me" as a stand-in for a person, no "TBD".
  - Prefer concrete verbs and specific nouns over marketing verbs ("enhance", "unlock", "leverage", "empower", "revolutionize", "elevate", "seamless", "cutting-edge", "game-changer") — avoid those entirely.
  - Spell out whole numbers under ten in prose ("one day", not "1 day"). Keep numerals for money, percentages, and measurements.
  - No em-dash-lists-of-adjectives, no rhetorical questions used as filler, no "In today's fast-paced world" openings.

Tone: match brief.tone. Audience: brief.audience. Niche: brief.niche.`;

export const generatePackAi = createServerFn({ method: "POST" })
  .validator((brief: unknown) => brief as Brief)
  .handler(async ({ data: brief }): Promise<ContentPack> => {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      console.warn("[generatePackAi] GROQ_API_KEY not set — using deterministic fallback");
      return generateDeterministic(brief);
    }

    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Here is the brief:\n${JSON.stringify(brief, null, 2)}` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error(`[generatePackAi] Groq ${res.status}: ${body.slice(0, 500)}`);
        return generateDeterministic(brief);
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        console.error("[generatePackAi] empty content from Groq");
        return generateDeterministic(brief);
      }

      const parsed = JSON.parse(content) as { ideas?: Idea[]; cadence?: ContentPack["cadence"] };
      sanitizeVoice(parsed);
      const pack = validatePack(parsed, brief);
      if (!pack) {
        console.warn("[generatePackAi] response failed shape validation — using fallback");
        return generateDeterministic(brief);
      }
      return pack;
    } catch (err) {
      console.error("[generatePackAi] fetch/parse error", err);
      return generateDeterministic(brief);
    }
  });

/* Strip patterns the model shouldn't have produced but sometimes does. The
   worst offender is "I, {who}," / "We, {who}," — an appositive that reads as
   an un-filled template placeholder. We also drop any literal "{...}" or
   "[...]" placeholders the model may have echoed from the prompt. */
function cleanCaption(text: string): string {
  return text
    /* "I, Me,", "I, John,", "We, the team," → "I" / "We" */
    .replace(/\b(I|We)\s*,\s*[^,.!?\n]{1,40}?\s*,\s*/gi, "$1 ")
    /* literal placeholder tokens */
    .replace(/\{[^{}\n]{1,40}\}/g, "")
    .replace(/\[[A-Z][^\]\n]{1,40}\]/g, "")
    /* stray double spaces / spaces before punctuation from the strips above */
    .replace(/ {2,}/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

function sanitizeVoice(parsed: { ideas?: Idea[] }): void {
  if (!Array.isArray(parsed.ideas)) return;
  for (const idea of parsed.ideas) {
    if (!Array.isArray(idea?.captions)) continue;
    for (const cap of idea.captions as Caption[]) {
      if (typeof cap.hook === "string") cap.hook = cleanCaption(cap.hook);
      if (typeof cap.body === "string") cap.body = cleanCaption(cap.body);
      if (typeof cap.cta === "string") cap.cta = cleanCaption(cap.cta);
    }
  }
}

/* Cheap runtime shape check. LLMs mostly follow JSON schemas but don't
   guarantee them, so refuse anything that would crash the renderer downstream
   (missing fields, wrong caption count, unknown idea kind). */
function validatePack(
  parsed: { ideas?: Idea[]; cadence?: ContentPack["cadence"] },
  brief: Brief,
): ContentPack | null {
  const { ideas, cadence } = parsed;
  if (!Array.isArray(ideas) || ideas.length !== 5) return null;
  const kindsSeen = new Set<string>();
  for (const idea of ideas) {
    if (!idea || typeof idea !== "object") return null;
    if (!IDEA_KINDS.includes(idea.kind)) return null;
    kindsSeen.add(idea.kind);
    if (typeof idea.title !== "string" || typeof idea.premise !== "string") return null;
    if (typeof idea.format !== "string") return null;
    if (!Array.isArray(idea.captions) || idea.captions.length !== 3) return null;
    if (!Array.isArray(idea.hashtags) || idea.hashtags.length < 1) return null;
    for (const cap of idea.captions as Caption[]) {
      if (!cap || typeof cap.hook !== "string" || typeof cap.body !== "string") return null;
      if (typeof cap.cta !== "string") return null;
    }
  }
  if (kindsSeen.size !== 5) return null;

  return {
    brief,
    ideas: ideas as Idea[],
    cadence: Array.isArray(cadence) && cadence.length > 0
      ? cadence
      : [
          { day: "Tuesday", idea: "The weekly deletions" },
          { day: "Thursday", idea: "The position" },
          { day: "Sunday", idea: "Show the work" },
          { day: "Monthly", idea: "The receipt" },
        ],
  };
}
