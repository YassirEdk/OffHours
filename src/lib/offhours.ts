import type { Brief, ContentPack } from "@/lib/pack";

/* The worked example. This is hand-written, not generated — it is the standard
   the generator is aiming at, and the page ships with it so there is something
   real on screen before anyone fills in a brief.

   Written for Instagram and TikTok, not a feed you read sitting down: the hook
   lands in the first line (first two seconds on video), lines stay short enough
   to survive the "more" fold, and every CTA asks for a save, share, comment or
   follow — the four things that actually move reach on both platforms. */

export const OFFHOURS_BRIEF: Brief = {
  name: "Offhours",
  business: "AI automation",
  promise: "automates the boring half of a small business",
  audience: "Owners & side-hustlers · 22–45",
  platforms: ["instagram", "tiktok"],
  goal: "saves",
  tone: ["fast", "plain", "anti-hype"],
  niche: "automation",
  proof: {
    task: "sending one invoice",
    before: "4 hours 11 minutes",
    cost: "£2,400 a month",
    who: "one office manager",
    client: "14-person plumbing firm",
    took: "9 days",
  },
};

export const OFFHOURS_PACK: ContentPack = {
  brief: OFFHOURS_BRIEF,
  ideas: [
    {
      kind: "proof",
      title: "The four-hour invoice",
      premise:
        "One real number, one real process, one small ask. Case studies fail when they are vague — this one names the task and times it.",
      format: "Reel + TikTok · 22 sec · screen recording, timer running in the corner",
      captions: [
        {
          hook: "She said invoicing takes ten minutes.",
          body: "The screen recording is 4 hours 11 minutes long.\n\nCopy the job sheet. Paste the template. Check the rate card. Email it. Log it. Chase it nine days later.\n\nNone of that is work. That's the tax on the work.",
          cta: "Save this if your Sunday looks like that 📌",
          ask: "save",
        },
        {
          hook: "4 hours. One invoice. Every single week.",
          body: "Nobody in that business thinks they have a problem.\n\nIt's just Tuesday. It's been Tuesday for six years.",
          cta: "Comment TIME and I'll show you what we cut it to",
          ask: "comment",
        },
        {
          hook: "POV: you finally time the task you do every week.",
          body: "Her guess: 10 minutes.\nActual: 4 hours 11 minutes.\n\nRecord yourself doing it once. You'll never un-see it.",
          cta: "Send this to whoever does your invoices 👀",
          ask: "share",
        },
      ],
      hashtags: [
        "#smallbusinesstips",
        "#automation",
        "#aitools",
        "#smallbusinessowner",
        "#productivityhacks",
        "#entrepreneurlife",
        "#businesstips",
        "#timesaver",
        "#adminlife",
        "#smallbiz",
        "#reels",
        "#fyp",
        "#workflow",
        "#sidehustle",
      ],
    },
    {
      kind: "series",
      title: "Deleted Mondays",
      premise:
        "A standing weekly series. Three things you removed from somebody's week, with the before-time and the after-time. It compounds — after two months it reads as a portfolio nobody had to write.",
      format: "Carousel, story set and grid drop, one of each",
      captions: [
        {
          variant: { label: "the ledger", title: "Three deletions", format: "Carousel · 6 slides" },
          hook: "3 things we deleted from someone's Monday:",
          body: "→ Copying orders into the sheet — 40 min\n→ Chasing 3 unsigned quotes — 25 min\n→ Building the weekly report — 55 min\n\n2 hours back. Same 5 people. Nobody learned new software.",
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
          body: "No dashboard. No login. Orders still arrive by email — they just land in the sheet on their own now.\n\nGood automation is invisible. If your staff need training on it, it's a second job, not a fix.",
          cta: "Comment MONDAY for this week's three",
          ask: "comment",
        },
        {
          variant: {
            label: "the running tally",
            title: "Week nineteen",
            format: "Grid drop · milestone",
          },
          hook: "Week 19 of posting everything we automate.",
          body: "61 tasks. ~340 hours a year. 11 businesses.\n\nNone of it clever. All of it something someone was doing by hand on a Monday because that's how it had always been done.",
          cta: "19 weeks of these on the grid — go look",
          ask: "follow",
        },
      ],
      hashtags: [
        "#smallbusinessowner",
        "#automation",
        "#workflow",
        "#timemanagement",
        "#businessowner",
        "#operations",
        "#adminwork",
        "#smallbiz",
        "#entrepreneur",
        "#aiforbusiness",
        "#businessgrowth",
        "#mondaymotivation",
        "#carousel",
      ],
    },
    {
      kind: "opinion",
      title: "The position",
      premise:
        "Turning people away in public is the single most credible thing an agency can do. Say which problems are a spreadsheet formula, which are a hiring problem, and which are actually worth paying you for.",
      format: "Talking Reel · 30 sec",
      captions: [
        {
          hook: "Half the people who DM us don't need AI.",
          body: "We tell them.\n\nLast month: one needed a formula. One needed to fire a supplier. One needed a part-time bookkeeper, not a bot.\n\nWe quoted 2 of 11.",
          cta: "Follow if you're tired of being sold to",
          ask: "follow",
        },
        {
          hook: "Things we talked people OUT of this year:",
          body: '→ a chatbot for a shop with 9 customers\n→ "AI reporting" on data nobody reads\n→ automating a task they were about to drop anyway\n\nFastest automation? Delete the step.',
          cta: "Save this before you buy any AI tool 📌",
          ask: "save",
        },
        {
          hook: "An agency that never says no isn't an agency.",
          body: "It's an order desk.\n\nWe'd rather be the people who told you the truth in March than the ones who took the money in June.",
          cta: "Share this with the friend about to sign a retainer",
          ask: "share",
        },
      ],
      hashtags: [
        "#aitools",
        "#smallbusinesstips",
        "#businessadvice",
        "#entrepreneurship",
        "#realtalk",
        "#aihype",
        "#consulting",
        "#smallbusiness",
        "#businessowner",
        "#founders",
        "#marketingtips",
        "#fyp",
      ],
    },
    {
      kind: "receipt",
      title: "The receipt",
      premise:
        "One client, one process, one number they can check. Name the task, the cost and the nine days it took.",
      format: "Carousel · 6 slides · 4:5 · once a month",
      captions: [
        {
          hook: "£2,400 a month in admin. Gone in 9 days.",
          body: "14-person plumbing firm. One office manager. Her entire morning turning job sheets into invoices.\n\nWe didn't replace her. We replaced her mornings.",
          cta: "Save this one 📌 full breakdown in the highlights",
          ask: "save",
        },
        {
          hook: "Nine days, and I'm not editing out the bad one.",
          body: "Day 1–2 we watched.\nDay 3–6 we built.\nDay 7 it broke.\nDay 8 we fixed it.\nDay 9 they stopped thinking about it.\n\nEvery real project has a day 7. Most people edit theirs out.",
          cta: "Comment DAY7 and I'll send you the whole thing",
          ask: "comment",
        },
        {
          hook: "I asked her what she'd do with a spare morning.",
          body: "She said she'd call the customers who'd gone quiet.\n\nShe brought back £6k in six weeks.\n\nThat was never in the proposal.",
          cta: "Follow for receipts, not promises",
          ask: "follow",
        },
      ],
      hashtags: [
        "#casestudy",
        "#aiautomation",
        "#smallbusiness",
        "#businessgrowth",
        "#costsaving",
        "#operations",
        "#tradesbusiness",
        "#smallbusinessowner",
        "#entrepreneur",
        "#beforeandafter",
        "#automation",
        "#results",
      ],
    },
    {
      kind: "build",
      title: "Build it in twenty minutes",
      premise:
        "Screen recording, no edit, no music. Take a real intake form and rebuild it live while narrating. This is the post that converts the sceptics, because you can't fake it.",
      format: "Screen recording · 20 min, cut to 90 sec",
      captions: [
        {
          hook: "I rebuilt a client's intake form in 20 minutes. Unedited.",
          body: "Watch me pick the wrong field type at 4:10 and fix it at 6:30.\n\nI left it in on purpose. It isn't magic and it shouldn't be sold like it is.",
          cta: "Save this, then send me a form you hate 📌",
          ask: "save",
        },
        {
          hook: 'Every agency says "transparent".',
          body: "Almost none of them will show you the screen.\n\nIf you can't watch someone work, you're buying a promise.",
          cta: "Watch the full 20 min before you hire anyone",
          ask: "follow",
        },
        {
          hook: "Your form has 14 fields.",
          body: "6 get used.\n3 make people leave.\n\nRebuilt one today in 19 minutes — routing by job value, confirmation email, straight into the sheet.\n\nThe form isn't the hard part. Deciding what to stop asking is.",
          cta: "Comment FORM and yours is next 👇",
          ask: "comment",
        },
      ],
      hashtags: [
        "#buildinpublic",
        "#nocode",
        "#automation",
        "#aitools",
        "#techtok",
        "#smallbusiness",
        "#productivity",
        "#reels",
        "#businessautomation",
        "#screenrecording",
        "#showyourwork",
        "#buildwithme",
      ],
    },
  ],
  /* Names match the idea titles above, so the week reads as a pointer to the
     sections rather than a second, slightly different set of names. */
  cadence: [
    { day: "Tuesday", idea: "Deleted Mondays" },
    { day: "Thursday", idea: "The position" },
    { day: "Sunday", idea: "Build it in twenty minutes" },
    { day: "Monthly", idea: "The receipt" },
    { day: "Stories", idea: "Daily · 3 frames" },
  ],
};
