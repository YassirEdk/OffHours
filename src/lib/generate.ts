import type { Brief, Caption, ContentPack, Idea, Platform } from "@/lib/pack";

/* Turns a brief into a pack.

   Everything here is built out of the brief's own proof block — the task, the
   time, the cost, the client. That is deliberate: a generator that only knows
   "bakery, funny, Instagram" can only produce the kind of post this page exists
   to argue against. Specifics are the whole difference between "Unlock the
   Power of AI for Your Business" and "four hours and eleven minutes".

   Pure and deterministic: same brief in, same pack out. No network, no key. */

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);

/** First noun-ish word, for phrases that need the niche in the singular. */
const shortNiche = (s: string) => s.trim().split(/\s+/)[0]?.toLowerCase() ?? "work";

const PLATFORM_TAGS: Record<Platform, string[]> = {
  instagram: ["#reels", "#explorepage"],
  tiktok: ["#fyp", "#tiktokmademebuyit"],
  facebook: ["#supportsmallbusiness"],
  linkedin: ["#smallbusiness", "#operations"],
  youtube: ["#shorts"],
};

const CORE_TAGS = [
  "#smallbusiness",
  "#smallbusinessowner",
  "#smallbusinesstips",
  "#entrepreneur",
  "#businessowner",
  "#businesstips",
  "#businessgrowth",
  "#smallbiz",
];

/** 10–15, no duplicates, niche-first so the specific tags outrank the generic
    ones a post has no chance of placing in. */
function buildTags(brief: Brief, lead: string[]): string[] {
  const nicheTags = [`#${slug(brief.niche)}`, `#${slug(brief.business)}`];
  const platformTags = brief.platforms.flatMap((p) => PLATFORM_TAGS[p]);
  const out: string[] = [];
  for (const tag of [...lead, ...nicheTags, ...platformTags, ...CORE_TAGS]) {
    if (tag.length > 1 && !out.includes(tag)) out.push(tag);
    if (out.length >= 13) break;
  }
  return out;
}

function ideas(brief: Brief): Idea[] {
  const { proof: p, name, promise } = brief;
  const niche = shortNiche(brief.niche);

  const proofCaptions: [Caption, Caption, Caption] = [
    {
      hook: `They said ${p.task} takes ten minutes.`,
      body: `The screen recording is ${p.before} long.\n\nNobody ever times the thing they do every week. That's why it never gets fixed.\n\nNone of that is work. That's the tax on the work.`,
      cta: "Save this if your week looks like that 📌",
      ask: "save",
    },
    {
      hook: `${p.before}. ${sentenceCase(p.task)}. Every single week.`,
      body: `${sentenceCase(p.client)}. ${sentenceCase(p.who)}.\n\nNobody in that business thinks they have a problem. It's just Tuesday, and it has been Tuesday for years.`,
      cta: "Comment TIME and I'll show you what we cut it to",
      ask: "comment",
    },
    {
      hook: "POV: you finally time the task you do every week.",
      body: `The guess: 10 minutes.\nActual: ${p.before}.\n\nRecord yourself doing it once. You'll never un-see it.`,
      cta: `Send this to whoever handles ${p.task} 👀`,
      ask: "share",
    },
  ];

  const seriesCaptions: [Caption, Caption, Caption] = [
    {
      variant: { label: "the ledger", title: "Three deletions", format: "Carousel · 6 slides" },
      hook: "3 things we deleted from someone's week:",
      body: `→ ${sentenceCase(p.task)} — the big one\n→ Chasing the same three people\n→ Building a report nobody opens\n\nHours back. Same team. Nobody learned new software.`,
      cta: "Save this 📌 which one would you delete first?",
      ask: "save",
    },
    {
      variant: {
        label: "the objection",
        title: "Nobody retrained",
        format: "Story set · 3 frames",
      },
      hook: "Nobody on their team learned anything.",
      body: `No dashboard. No login. Nothing moved.\n\nGood ${niche} is invisible. If your staff need training on it, it's a second job, not a fix.`,
      cta: "Comment WEEK for this week's three",
      ask: "comment",
    },
    {
      variant: {
        label: "the running tally",
        title: "The tally so far",
        format: "Grid drop · milestone",
      },
      hook: `Everything ${name} has taken off someone's plate, in public.`,
      body: `None of it clever. All of it something someone was doing by hand because that's how it had always been done.`,
      cta: "The whole run is on the grid — go look",
      ask: "follow",
    },
  ];

  const opinionCaptions: [Caption, Caption, Caption] = [
    {
      hook: `Half the people who DM us don't need ${niche}.`,
      body: `We tell them.\n\nSome need a smaller fix. Some need to stop doing the thing entirely. Some need a person, not a product.\n\nWe say so before we quote.`,
      cta: "Follow if you're tired of being sold to",
      ask: "follow",
    },
    {
      hook: "Things we talked people OUT of this year:",
      body: `→ the expensive version of a ten-minute fix\n→ a report on data nobody reads\n→ a job they were about to drop anyway\n\nThe fastest fix is deleting the step.`,
      cta: `Save this before you buy any ${niche} tool 📌`,
      ask: "save",
    },
    {
      hook: "A business that never says no isn't a business.",
      body: "It's an order desk.\n\nWe'd rather be the people who told you the truth in March than the ones who took the money in June.",
      cta: "Share this with whoever's about to sign something",
      ask: "share",
    },
  ];

  const receiptCaptions: [Caption, Caption, Caption] = [
    {
      hook: `${sentenceCase(p.cost)} gone in ${p.took}.`,
      body: `${sentenceCase(p.client)}. ${sentenceCase(p.who)}. Their whole morning went on ${p.task}.\n\nWe didn't replace them. We replaced their mornings.`,
      cta: "Save this one 📌 full breakdown in the highlights",
      ask: "save",
    },
    {
      hook: `${sentenceCase(p.took)}, and I'm not editing out the bad day.`,
      body: `We watched first. Then we built. Then it broke. Then we fixed it. Then they stopped thinking about it.\n\nEvery real project has the day it breaks. Most people edit theirs out.`,
      cta: "Comment BREAKDOWN and I'll send you the whole thing",
      ask: "comment",
    },
    {
      hook: "I asked them what they'd do with a spare morning.",
      body: "They said they'd call the customers who'd gone quiet.\n\nThat was never in the proposal, and it paid for the work.",
      cta: "Follow for receipts, not promises",
      ask: "follow",
    },
  ];

  const buildCaptions: [Caption, Caption, Caption] = [
    {
      hook: `I fixed ${p.task} in 20 minutes. Unedited.`,
      body: `Watch me get it wrong once and fix it on camera.\n\nI left that in on purpose. It isn't magic and it shouldn't be sold like it is.`,
      cta: "Save this, then send me the job you hate 📌",
      ask: "save",
    },
    {
      hook: 'Everyone says "transparent".',
      body: "Almost nobody will show you the screen.\n\nIf you can't watch someone work, you're buying a promise.",
      cta: "Watch the full twenty minutes before you hire anyone",
      ask: "follow",
    },
    {
      hook: `Most of ${p.task} is steps nobody chose.`,
      body: `They're there because someone did it that way once.\n\nThe work isn't the hard part. Deciding what to stop doing is.`,
      cta: "Comment YOURS and I'll take a look 👇",
      ask: "comment",
    },
  ];

  return [
    {
      kind: "proof",
      /* Naming it after the task rather than the number: "The 2 hours 40
         minutes sourdough problem" is what a template sounds like. */
      title: `${sentenceCase(p.task)}, timed`,
      premise: `One real number, one real process, one small ask. Case studies fail when they are vague — this one names ${p.task} and times it.`,
      format: `${formatFor(brief, "video")} · 22 sec · screen recording, timer running`,
      captions: proofCaptions,
      hashtags: buildTags(brief, ["#timesaver", "#productivityhacks", "#behindthescenes"]),
    },
    {
      kind: "series",
      title: "The weekly deletions",
      premise:
        "A standing weekly series. Three things you removed from somebody's week, with the before-time and the after-time. It compounds — after two months it reads as a portfolio nobody had to write.",
      format: "Carousel, story set and grid drop, one of each",
      captions: seriesCaptions,
      hashtags: buildTags(brief, ["#workflow", "#timemanagement", "#operations", "#adminwork"]),
    },
    {
      kind: "opinion",
      title: "The position",
      premise: `Turning people away in public is the most credible thing ${name} can do. Say which problems aren't worth paying you for.`,
      format: `${formatFor(brief, "video")} · 30 sec · talking to camera`,
      captions: opinionCaptions,
      hashtags: buildTags(brief, ["#realtalk", "#businessadvice", "#founders", "#marketingtips"]),
    },
    {
      kind: "receipt",
      title: "The receipt",
      premise: `One client, one process, one number they can check — ${p.cost}, ${p.took}.`,
      format: "Carousel · 6 slides · 4:5 · once a month",
      captions: receiptCaptions,
      hashtags: buildTags(brief, ["#casestudy", "#beforeandafter", "#results", "#costsaving"]),
    },
    {
      kind: "build",
      title: "Show the work",
      premise: `Screen recording, no edit, no music. Do the real thing while narrating. This is the post that converts the sceptics, because ${promise} is easy to claim and hard to fake.`,
      format: "Screen recording · 20 min, cut to 90 sec",
      captions: buildCaptions,
      hashtags: buildTags(brief, [
        "#buildinpublic",
        "#showyourwork",
        "#behindthescenes",
        "#howitsmade",
      ]),
    },
  ];
}

/** Instagram and TikTok both want vertical video; LinkedIn and Facebook don't
    have Reels, so the label should not promise one. */
function formatFor(brief: Brief, kind: "video"): string {
  if (kind !== "video") return "Post";
  const names: string[] = [];
  if (brief.platforms.includes("instagram")) names.push("Reel");
  if (brief.platforms.includes("tiktok")) names.push("TikTok");
  if (brief.platforms.includes("youtube")) names.push("Short");
  if (names.length === 0) names.push("Native video");
  return names.join(" + ");
}

function sentenceCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generatePack(brief: Brief): ContentPack {
  const list = ideas(brief);
  return {
    brief,
    ideas: list,
    /* Three a week beats seven: one proof, one opinion, one build, with the
       receipt monthly because it needs a finished job behind it. */
    cadence: [
      { day: "Tuesday", idea: "The weekly deletions" },
      { day: "Thursday", idea: "The position" },
      { day: "Sunday", idea: "Show the work" },
      { day: "Monthly", idea: "The receipt" },
      { day: "Stories", idea: "Daily · 3 frames" },
    ],
  };
}
