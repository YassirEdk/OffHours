import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { InkFilm } from "@/components/InkFilm";
import { CursorBloom } from "@/components/CursorBloom";
import { Logo, LogoMark } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Offhours — five posts that sell automation" },
      {
        name: "description",
        content:
          "Five post ideas and fifteen Instagram and TikTok captions for an agency that automates the boring half of a small business. Hooks, CTAs and hashtags written out.",
      },
      { property: "og:title", content: "Offhours — five posts that sell automation" },
      {
        property: "og:description",
        content:
          "A content pack for SMB automation agencies. One proof post, one opinion post, one build post, on repeat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContentPack,
});

const A = {
  acid: { hex: "#D8FF3E", rgb: "216,255,62" },
  orange: { hex: "#FF5C38", rgb: "255,92,56" },
  cyan: { hex: "#6FE3FF", rgb: "111,227,255" },
  magenta: { hex: "#FF3D9A", rgb: "255,61,154" },
};

type Caption = { hook: string; body: string; cta: string };
type CaptionSet = Record<"a" | "b" | "c", Caption>;

/* Written for Instagram and TikTok, not a feed you read sitting down: the hook
   is held as its own field because it does its own job — it is line one of the
   caption and the first two seconds of the video, and it has to work with the
   rest of the post collapsed behind "more". Body lines stay short enough to
   survive that fold, and every CTA asks for a save, share, comment or follow —
   the four things that actually move reach on both platforms. */
const CAPS: Record<"invoice" | "position" | "receipt" | "build", CaptionSet> = {
  invoice: {
    a: {
      hook: "She said invoicing takes ten minutes.",
      body: "The screen recording is 4 hours 11 minutes long.\n\nCopy the job sheet. Paste the template. Check the rate card. Email it. Log it. Chase it nine days later.\n\nNone of that is work. That's the tax on the work.",
      cta: "Save this if your Sunday looks like that 📌",
    },
    b: {
      hook: "4 hours. One invoice. Every single week.",
      body: "Nobody in that business thinks they have a problem.\n\nIt's just Tuesday. It's been Tuesday for six years.",
      cta: "Comment TIME and I'll show you what we cut it to",
    },
    c: {
      hook: "POV: you finally time the task you do every week.",
      body: "Her guess: 10 minutes.\nActual: 4 hours 11 minutes.\n\nRecord yourself doing it once. You'll never un-see it.",
      cta: "Send this to whoever does your invoices 👀",
    },
  },
  position: {
    a: {
      hook: "Half the people who DM us don't need AI.",
      body: "We tell them.\n\nLast month: one needed a formula. One needed to fire a supplier. One needed a part-time bookkeeper, not a bot.\n\nWe quoted 2 of 11.",
      cta: "Follow if you're tired of being sold to",
    },
    b: {
      hook: "Things we talked people OUT of this year:",
      body: '→ a chatbot for a shop with 9 customers\n→ "AI reporting" on data nobody reads\n→ automating a task they were about to drop anyway\n\nFastest automation? Delete the step.',
      cta: "Save this before you buy any AI tool 📌",
    },
    c: {
      hook: "An agency that never says no isn't an agency.",
      body: "It's an order desk.\n\nWe'd rather be the people who told you the truth in March than the ones who took the money in June.",
      cta: "Share this with the friend about to sign a retainer",
    },
  },
  receipt: {
    a: {
      hook: "£2,400 a month in admin. Gone in 9 days.",
      body: "14-person plumbing firm. One office manager. Her entire morning turning job sheets into invoices.\n\nWe didn't replace her. We replaced her mornings.",
      cta: "Save this one 📌 full breakdown in the highlights",
    },
    b: {
      hook: "Nine days, and I'm not editing out the bad one.",
      body: "Day 1–2 we watched.\nDay 3–6 we built.\nDay 7 it broke.\nDay 8 we fixed it.\nDay 9 they stopped thinking about it.\n\nEvery real project has a day 7. Most people edit theirs out.",
      cta: "Comment DAY7 and I'll send you the whole thing",
    },
    c: {
      hook: "I asked her what she'd do with a spare morning.",
      body: "She said she'd call the customers who'd gone quiet.\n\nShe brought back £6k in six weeks.\n\nThat was never in the proposal.",
      cta: "Follow for receipts, not promises",
    },
  },
  build: {
    a: {
      hook: "I rebuilt a client's intake form in 20 minutes. Unedited.",
      body: "Watch me pick the wrong field type at 4:10 and fix it at 6:30.\n\nI left it in on purpose. It isn't magic and it shouldn't be sold like it is.",
      cta: "Save this, then send me a form you hate 📌",
    },
    b: {
      hook: 'Every agency says "transparent".',
      body: "Almost none of them will show you the screen.\n\nIf you can't watch someone work, you're buying a promise.",
      cta: "Watch the full 20 min before you hire anyone",
    },
    c: {
      hook: "Your form has 14 fields.",
      body: "6 get used.\n3 make people leave.\n\nRebuilt one today in 19 minutes — routing by job value, confirmation email, straight into the sheet.\n\nThe form isn't the hard part. Deciding what to stop asking is.",
      cta: "Comment FORM and yours is next 👇",
    },
  },
};

/* 10–15 per idea, mixed reach: two or three broad (#smallbusiness), the rest
   narrow enough that the post can actually place in them. Kept out of a shared
   block on purpose — a boilerplate tag list posted five times a week is the
   fastest way to get a niche read wrong. */
const TAGS = {
  invoice:
    "#smallbusinesstips #automation #aitools #smallbusinessowner #productivityhacks #entrepreneurlife #businesstips #timesaver #adminlife #smallbiz #reels #fyp #workflow #sidehustle",
  mondays:
    "#smallbusinessowner #automation #workflow #timemanagement #businessowner #operations #adminwork #smallbiz #entrepreneur #aiforbusiness #businessgrowth #mondaymotivation #carousel",
  position:
    "#aitools #smallbusinesstips #businessadvice #entrepreneurship #realtalk #aihype #consulting #smallbusiness #businessowner #founders #marketingtips #fyp",
  receipt:
    "#casestudy #aiautomation #smallbusiness #businessgrowth #costsaving #operations #tradesbusiness #smallbusinessowner #entrepreneur #beforeandafter #automation #results",
  build:
    "#buildinpublic #nocode #automation #aitools #techtok #smallbusiness #productivity #reels #businessautomation #screenrecording #showyourwork #buildwithme",
};

const OFFER_CARDS = [
  {
    eyebrow: "Caption A · the ledger",
    name: "Three deletions",
    ghost: "A",
    spec: "Carousel · 6 slides",
    hook: "3 things we deleted from someone's Monday:",
    body: "→ Copying orders into the sheet — 40 min\n→ Chasing 3 unsigned quotes — 25 min\n→ Building the weekly report — 55 min\n\n2 hours back. Same 5 people. Nobody learned new software.",
    cta: "Save this 📌 which one would you delete first?",
  },
  {
    eyebrow: "Caption B · the objection",
    name: "Nobody retrained",
    ghost: "B",
    spec: "Story set · 3 frames",
    hook: "Nobody on their team learned anything.",
    body: "No dashboard. No login. Orders still arrive by email — they just land in the sheet on their own now.\n\nGood automation is invisible. If your staff need training on it, it's a second job, not a fix.",
    cta: "Comment MONDAY for this week's three",
  },
  {
    eyebrow: "Caption C · the running tally",
    name: "Week nineteen",
    ghost: "C",
    spec: "Grid drop · milestone",
    hook: "Week 19 of posting everything we automate.",
    body: "61 tasks. ~340 hours a year. 11 businesses.\n\nNone of it clever. All of it something someone was doing by hand on a Monday because that's how it had always been done.",
    cta: "19 weeks of these on the grid — go look",
  },
];

/* Vector, not emoji — emoji render as a different typeface on every OS and go
   blurry the moment the slide is exported. These stay sharp at any size and
   need no network request. */
const PROMO_FEATURES = [
  {
    label: "Boost Efficiency",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M13 2 4.6 13.2a.6.6 0 0 0 .48.96H10.4l-1.3 7.6a.6.6 0 0 0 1.08.44L19.4 10.8a.6.6 0 0 0-.48-.96H13.6L14.9 2.6A.6.6 0 0 0 13 2Z"
          fill="url(#promoA)"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="promoA" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF6C2" />
            <stop offset="1" stopColor="#FFC53D" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    label: "Drive Innovation",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2.6a6.6 6.6 0 0 0-3.9 11.94c.5.36.8.94.8 1.56v.5h6.2v-.5c0-.62.3-1.2.8-1.56A6.6 6.6 0 0 0 12 2.6Z"
          fill="url(#promoB)"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path
          d="M9.6 18.7h4.8M10.3 21h3.4"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="promoB" x1="6" y1="3" x2="18" y2="17" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFDF0" />
            <stop offset="1" stopColor="#8FD3FF" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    label: "Scale Faster",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 20h18"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <rect x="4.4" y="12.5" width="3.6" height="5.4" rx="1" fill="rgba(255,255,255,0.55)" />
        <rect x="10.2" y="9" width="3.6" height="8.9" rx="1" fill="rgba(255,255,255,0.75)" />
        <rect x="16" y="5" width="3.6" height="12.9" rx="1" fill="url(#promoC)" />
        <path
          d="m14.6 6.6 5-2.2-1.1 4.6"
          stroke="#B7FF6B"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="promoC" x1="16" y1="5" x2="20" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D9FFA8" />
            <stop offset="1" stopColor="#6BD968" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
];

const POSITION_LINE = "Half the people who DM us don't need AI. We tell them.";
const POSITION_HI = [6, 7, 8];

/* The six frames of idea 01, designed. Layouts deliberately differ frame to
   frame — six identical templates is what makes a carousel read as filler. */
const SLIDES: { kicker: string; centre?: boolean; render: React.ReactNode }[] = [
  {
    kicker: "The recording",
    render: (
      <div className="mt-auto flex flex-col">
        <span className="display text-[3.4rem] leading-[0.82]" style={{ color: A.orange.hex }}>
          4:11
        </span>
        <p className="display-cond mt-3 max-w-[15ch] text-[1.15rem]">To send one invoice</p>
        <p className="body-copy mt-3 max-w-[26ch] text-[0.78rem]">
          She guessed it took ten minutes.
        </p>
      </div>
    ),
  },
  {
    kicker: "Where the hours go",
    render: (
      <div className="mt-4 flex flex-1 flex-col">
        {[
          ["Copy the job sheet", "38m"],
          ["Paste the template", "24m"],
          ["Check the rate card", "31m"],
          ["Email it out", "19m"],
          ["Log it in the sheet", "42m"],
          ["Chase it, 9 days later", "97m"],
        ].map(([step, time]) => (
          <div
            key={step}
            className="flex items-baseline justify-between gap-2 border-t border-[rgba(245,243,239,0.14)] py-[0.42rem]"
          >
            <span className="text-[0.76rem] leading-snug">{step}</span>
            <span className="font-mono text-[0.64rem] tabular-nums" style={{ color: A.orange.hex }}>
              {time}
            </span>
          </div>
        ))}
        <div
          className="mt-auto flex items-baseline justify-between border-t pt-3"
          style={{ borderColor: A.orange.hex }}
        >
          <span className="display-card text-[0.95rem]">Total</span>
          <span className="display text-[1.5rem] tabular-nums" style={{ color: A.orange.hex }}>
            4:11
          </span>
        </div>
      </div>
    ),
  },
  {
    kicker: "",
    centre: true,
    render: (
      <>
        <p className="display max-w-[12ch] text-[1.75rem]">
          None of that is <span style={{ color: A.orange.hex }}>work</span>
        </p>
        <p className="body-copy mt-4 max-w-[28ch] text-[0.82rem]">
          That's the tax on the work. It never shows up on an invoice, so nobody ever costs it.
        </p>
      </>
    ),
  },
  {
    kicker: "Same job, every week",
    render: (
      <div className="mt-auto">
        <div className="flex items-baseline gap-2">
          <span className="display text-[3rem] leading-[0.82]">27</span>
          <span className="display-cond text-[1rem]" style={{ color: A.orange.hex }}>
            days a year
          </span>
        </div>
        <p className="body-copy mt-3 max-w-[27ch] text-[0.78rem]">
          Four hours a week, fifty weeks. More than a working month, spent moving numbers between
          two windows.
        </p>
      </div>
    ),
  },
  {
    kicker: "After nine days",
    render: (
      <>
        <div className="mt-4 grid flex-1 grid-cols-2 gap-3">
          <div className="flex flex-col gap-2 border-r border-[rgba(245,243,239,0.14)] pr-3">
            <span className="font-mono text-[0.52rem] tracking-[0.18em] text-[rgba(245,243,239,0.45)] uppercase">
              Before
            </span>
            <span className="display-card text-[1.2rem]">6 steps</span>
            <span className="body-copy text-[0.72rem]">Every one by hand</span>
          </div>
          <div className="flex flex-col gap-2">
            <span
              className="font-mono text-[0.52rem] tracking-[0.18em] uppercase"
              style={{ color: A.orange.hex }}
            >
              After
            </span>
            <span className="display-card text-[1.2rem]" style={{ color: A.orange.hex }}>
              1 step
            </span>
            <span className="body-copy text-[0.72rem]">She approves it</span>
          </div>
        </div>
        <p className="body-copy mt-3 text-[0.76rem]">
          We didn't replace her. We replaced her mornings.
        </p>
      </>
    ),
  },
  {
    kicker: "",
    centre: true,
    render: (
      <>
        <p className="display max-w-[13ch] text-[1.6rem]">
          What's <span style={{ color: A.orange.hex }}>your</span> four hours?
        </p>
        <p className="body-copy mt-4 max-w-[27ch] text-[0.8rem]">
          Send me the task you dread most. I'll tell you free if it's worth automating — and I'll
          say no if it isn't.
        </p>
        <span
          className="mt-5 inline-flex w-fit rounded-full px-4 py-2 font-mono text-[0.56rem] tracking-[0.16em] uppercase"
          style={{ background: A.orange.hex, color: "#0A0B0C" }}
        >
          Comment "four" →
        </span>
      </>
    ),
  },
];

/* --i is the character's position in the whole phrase, not in its word, so any
   effect that wants to travel along a headline (see .grad-sell) can stagger off
   it and still cross word boundaries smoothly. */
function Split({ text }: { text: string }) {
  const words = text.split(" ");
  let n = 0;
  return (
    <>
      {words.map((word, wi) => (
        <span key={wi} className="word-mask">
          {word.split("").map((c, ci) => (
            <span key={ci} className="char" style={{ ["--i" as string]: n++ }}>
              {c}
            </span>
          ))}
          {wi < words.length - 1 ? (
            <span className="char" style={{ ["--i" as string]: n++ }}>
              &nbsp;
            </span>
          ) : null}
        </span>
      ))}
    </>
  );
}

function SectionIndex({ n, label, className = "" }: { n: string; label: string; className?: string }) {
  return (
    <div className={className}>
      <div className="mono-label">
        {n} — {label}
      </div>
      <span className="rule-56 sect-rule mt-2" />
    </div>
  );
}

/* In-page jumps are buttons, not anchors, so nothing ever writes #s03 into the
   address bar or the history stack — the section ids stay, since the
   ScrollTriggers key off them. */
function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
}

function Hashtags({ tags, className = "" }: { tags: string; className?: string }) {
  return (
    <div className={className}>
      <p className="mono-label">Hashtags · {tags.split(" ").length}</p>
      <p className="mt-2 font-mono text-[0.6rem] leading-[2] tracking-[0.06em] text-[rgba(245,243,239,0.4)]">
        {tags}
      </p>
    </div>
  );
}

function CaptionSwitcher({
  set,
  align = "left",
  className = "",
}: {
  set: CaptionSet;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const [active, setActive] = useState<"a" | "b" | "c">("a");
  const [copied, setCopied] = useState(false);
  const cap = set[active];

  const copy = async () => {
    const text = `${cap.hook}\n\n${cap.body}\n\n${cap.cta}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable — the button still confirms so the UI doesn't stall */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const justify =
    align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";

  return (
    <div className={className}>
      <div className={`flex flex-wrap gap-2 ${justify}`}>
        {(["a", "b", "c"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={active === k}
            onClick={() => setActive(k)}
            className="chip"
            style={
              active === k
                ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#0a0b0c" }
                : undefined
            }
          >
            Caption {k.toUpperCase()}
          </button>
        ))}
        <button type="button" onClick={copy} className="chip">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mono-label mt-5">Hook · line one</p>
      <p className="display-card mt-2 text-[clamp(1rem,1.7vw,1.35rem)] leading-[1.12]">
        {cap.hook}
      </p>
      <p className="body-copy mt-4 whitespace-pre-line">{cap.body}</p>
      <p className="mono-label mt-4">CTA</p>
      <p
        className="mt-1 font-mono text-[0.66rem] leading-[1.7] tracking-[0.12em] uppercase"
        style={{ color: "var(--accent)" }}
      >
        → {cap.cta}
      </p>
    </div>
  );
}

function ContentPack() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      /* headline character masks */
      gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
        gsap.from(el.querySelectorAll(".char"), {
          yPercent: 112,
          rotation: 5,
          duration: 1.05,
          stagger: 0.022,
          ease: "power4.out",
          scrollTrigger: { trigger: el, start: "top 72%" },
        });
      });

      gsap.utils.toArray<HTMLElement>(".sect-rule").forEach((el) => {
        gsap.from(el, {
          scaleX: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-fade]").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 26,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 86%" },
        });
      });

      /* 03 — scroll-wiped before/after */
      // Opens on the generic post full-bleed, then the designed version pushes
      // in from the right as you scroll. --reveal tracks the same tween so
      // anything that should only exist once the dark side arrives can fade in.
      const wipe = document.querySelector<HTMLElement>("[data-wipe]");
      if (wipe) {
        const state = { v: 100 };
        gsap.to(state, {
          v: 0,
          ease: "none",
          scrollTrigger: { trigger: "#s03", start: "top top", end: "bottom bottom", scrub: 0.4 },
          onUpdate: () => {
            wipe.style.setProperty("--wipe", `${state.v}%`);
            // fades the dark side's chrome in as it arrives
            wipe.style.setProperty("--reveal", String(gsap.utils.clamp(0, 1, (100 - state.v) / 25)));
            // fades the divider, handle and purple label out as the purple runs
            // out, so the section lands on a clean full-screen designed post
            wipe.style.setProperty("--chrome", String(gsap.utils.clamp(0, 1, (state.v - 1) / 12)));
          },
        });
      }

      /* 05 — word by word */
      gsap.from("[data-words] .w", {
        opacity: 0.1,
        yPercent: 35,
        ease: "none",
        stagger: 1,
        scrollTrigger: { trigger: "#s05", start: "top top", end: "70% bottom", scrub: 0.6 },
      });
      gsap.from("[data-attrib]", {
        opacity: 0,
        y: 22,
        ease: "none",
        scrollTrigger: { trigger: "#s05", start: "72% bottom", end: "88% bottom", scrub: 0.6 },
      });

      /* 06 — count up to the headline number */
      const counter = document.querySelector<HTMLElement>("[data-count]");
      if (counter) {
        const n = { v: 0 };
        gsap.to(n, {
          v: 2400,
          duration: 1.6,
          ease: "power3.out",
          scrollTrigger: { trigger: counter, start: "top 80%" },
          onUpdate: () => {
            counter.textContent = Math.round(n.v).toLocaleString("en-GB");
          },
        });
      }

      /* 08 — the deck runs sideways while the page scrolls down. Distance is a
         function so it is remeasured on every refresh: --card is viewport-height
         based, so a resize changes how far the track has to travel. */
      const stage = document.querySelector<HTMLElement>("[data-deck-stage]");
      const frame = document.querySelector<HTMLElement>("[data-deck]");
      const track = document.querySelector<HTMLElement>("[data-deck-track]");
      if (stage && frame && track) {
        gsap.to(track, {
          x: () => -Math.max(0, track.scrollWidth - frame.clientWidth),
          ease: "none",
          scrollTrigger: {
            trigger: "#s08",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.5,
            invalidateOnRefresh: true,
            onUpdate: (self) => stage.style.setProperty("--deck", String(self.progress)),
          },
        });
      }

      /* cover badge, rotated by scroll rather than an idle loop */
      gsap.to("[data-badge]", {
        rotation: 300,
        ease: "none",
        scrollTrigger: { trigger: "#s01", start: "top top", end: "bottom top", scrub: 0.5 },
      });

      /* No scroll-velocity skew here — the plane stays flat while scrolling. */
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <InkFilm />
      <CursorBloom />

      <header className="fixed top-0 right-0 left-0 z-20 flex items-center justify-between px-[clamp(1.25rem,5vw,5rem)] py-5">
        <button
          type="button"
          onClick={() => scrollToSection("s01")}
          aria-label="Offhours — back to top"
          className="cursor-pointer"
        >
          <Logo />
        </button>
        <nav className="flex items-center gap-6 font-mono text-[0.68rem] tracking-[0.16em] uppercase">
          {[
            ["Proof", "s03"],
            ["Receipts", "s06"],
            ["Make it yours", "s09"],
          ].map(([label, id]) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              className="nav-link cursor-pointer"
            >
              <span className="mr-2 opacity-50">·</span>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="plane">
        {/* ============ 01 COVER ============ */}
        <section
          id="s01"
          data-section
          data-accent-rgb={A.acid.rgb}
          style={{ ["--accent" as string]: A.acid.hex }}
          className="sect flex flex-col items-center justify-center gap-5 text-center"
        >
          <h1 className="display text-[clamp(2.4rem,7.2vw,6.2rem)]" data-split>
            <Split text="Five posts" />
            <br />
            <span className="grad-sell">
              <Split text="that sell" />
            </span>
          </h1>
          {/* One line, and the two nouns carry the argument: the thing sold in the
             section accent, the thing refused in the accent furthest from it. */}
          <p
            className="display-cond text-[clamp(1.2rem,2.6vw,2rem)] whitespace-nowrap"
            data-fade
          >
            <span className="yellow-lit">Automation</span>, not{" "}
            <span className="yellow-dull">hype</span>
          </p>
          <p className="body-copy max-w-[46ch]" data-fade>
            Fifteen captions, every hook and CTA written out, for an agency that automates the boring
            half of a small business.
          </p>

          <dl
            className="mt-3 grid w-full max-w-[1000px] grid-cols-[repeat(auto-fit,minmax(148px,1fr))] gap-px border border-[rgba(245,243,239,0.14)] bg-[rgba(245,243,239,0.14)] text-left"
            data-fade
          >
            {[
              ["Business", "Offhours — AI automation"],
              ["Audience", "Owners & side-hustlers · 22–45"],
              ["Platform", "Instagram + TikTok"],
              ["Goal", "Saves, shares, followers"],
              ["Tone", "Fast · plain · anti-hype"],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-2 bg-[rgba(10,11,12,0.6)] px-4 py-4">
                <dt className="font-mono text-[0.58rem] tracking-[0.18em] text-[rgba(245,243,239,0.42)] uppercase">
                  {k}
                </dt>
                <dd className="font-mono text-[0.7rem] leading-[1.5] tracking-[0.06em] uppercase">
                  {v}
                </dd>
              </div>
            ))}
          </dl>

          <SectionIndex
            n="01"
            label="The brief"
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center [&_.rule-56]:mx-auto"
          />
          <div
            data-badge
            className="absolute right-[clamp(1.25rem,5vw,5rem)] bottom-10 h-24 w-24 rounded-full border border-[rgba(245,243,239,0.2)]"
          >
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <defs>
                <path id="circ" d="M50,50 m-34,0 a34,34 0 1,1 68,0 a34,34 0 1,1 -68,0" />
              </defs>
              <text className="fill-[rgba(245,243,239,0.62)] font-mono text-[9px] tracking-[0.24em] uppercase">
                <textPath href="#circ">Five · ideas · fifteen · captions · one · week ·</textPath>
              </text>
            </svg>
          </div>
        </section>

        {/* ============ 02 THE ARGUMENT ============ */}
        <section
          id="s02"
          data-section
          data-accent-rgb={A.orange.rgb}
          style={{ ["--accent" as string]: A.orange.hex }}
          className="sect flex flex-col justify-between"
        >
          <div
            className="pointer-events-none absolute inset-y-0 right-0 left-[46%]"
            style={{ background: "linear-gradient(to left, rgba(10,11,12,0.82), transparent)" }}
          />

          <div className="relative z-[1] flex justify-end">
            <div className="flex max-w-[40ch] flex-col items-end text-right">
              <SectionIndex
                n="02"
                label="The four-hour invoice"
                className="[&_.rule-56]:ml-auto [&_.rule-56]:origin-right"
              />
              <CaptionSwitcher set={CAPS.invoice} align="right" className="mt-5 w-full" />
            </div>
          </div>

          <div className="relative z-[1] mt-auto flex flex-col gap-4">
            <h2 className="display text-[clamp(2.6rem,10vw,8rem)]" data-split>
              <Split text="Four" />{" "}
              <span style={{ color: A.orange.hex }}>
                <Split text="hours" />
              </span>
            </h2>
            <p className="font-mono text-[0.62rem] tracking-[0.2em] text-[rgba(245,243,239,0.62)] uppercase">
              Reel + TikTok · 22 sec · screen recording, timer running in the corner
            </p>
            <Hashtags tags={TAGS.invoice} className="max-w-[46ch]" />
          </div>
        </section>

        {/* ============ 03 THE DIFFERENCE ============ */}
        <section
          id="s03"
          data-section
          data-accent-rgb={A.cyan.rgb}
          style={{ ["--accent" as string]: A.cyan.hex }}
          className="relative min-h-[180vh]"
        >
          <div
            data-wipe
            className="sticky top-0 h-screen overflow-hidden"
            style={{
              ["--wipe" as string]: "100%",
              ["--reveal" as string]: "0",
              ["--chrome" as string]: "1",
            }}
          >
            {/* the generic default */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg,#4C3BCF 0%,#7A45D8 55%,#9B4DE0 100%)" }}
            >
              <div className="wipe-anchor wipe-anchor--generic flex w-[min(86vw,500px)] flex-col items-center gap-5 text-center text-white">
                  <h3 className="promo-title text-[1.6rem] leading-snug font-bold">
                    Unlock the Power of AI for Your Business
                  </h3>
                  <p className="text-[0.95rem] leading-relaxed opacity-90">
                    In today's fast-paced digital landscape, businesses that fail to leverage AI risk
                    being left behind. Are you ready to transform your workflow?
                  </p>
                  <div className="grid w-full grid-cols-3 gap-3">
                    {PROMO_FEATURES.map((f) => (
                      <div
                        key={f.label}
                        className="promo-card flex flex-col items-center gap-3 px-2 py-5 text-[0.8rem]"
                      >
                        <span className="promo-icon">{f.icon}</span>
                        <span className="font-medium">{f.label}</span>
                      </div>
                    ))}
                  </div>
                  <span className="promo-cta rounded-full bg-white px-7 py-3 text-[0.88rem] font-semibold text-[#4C3BCF]">
                    DM me "AI" to learn more!
                  </span>
                  <span className="font-mono text-[0.58rem] tracking-[0.18em] text-white/55 uppercase">
                    0 comments · 3 likes
                  </span>
              </div>
            </div>

            {/* the written version */}
            <div
              className="absolute inset-0 bg-[#0a0b0c]"
              style={{ clipPath: "inset(0 0 0 var(--wipe))" }}
            >
              <div className="wipe-anchor wipe-anchor--designed flex w-[min(86vw,540px)] flex-col gap-6">
                  <h3 className="display proof-title text-[clamp(1.5rem,3.2vw,2.8rem)]">
                    Four hours and <span className="hi">eleven</span> minutes
                  </h3>
                  <p className="body-copy">
                    That's how long it took this client to send one invoice. I have the screen
                    recording.
                  </p>
                  <div className="flex flex-col">
                    {[
                      ["01", "One real number", 'Not "efficiency"'],
                      ["02", "One real process", "Named, timed, shown"],
                      ["03", "One small ask", "Costs them nothing"],
                    ].map(([n, name, note]) => (
                      <div
                        key={n}
                        className="proof-row grid grid-cols-[2.4rem_1fr_auto] items-baseline gap-4 border-t border-[rgba(245,243,239,0.14)] px-2 py-3 font-mono text-[0.68rem] tracking-[0.12em] uppercase"
                      >
                        <span className="proof-num">{n}</span>
                        <span className="tracking-[0.08em]">{name}</span>
                        <span className="text-right text-[rgba(245,243,239,0.62)]">{note}</span>
                      </div>
                    ))}
                  </div>
                  <span
                    className="proof-stat ml-4 font-mono text-[0.58rem] tracking-[0.18em] uppercase"
                    style={{ color: A.cyan.hex }}
                  >
                    41 comments · 2 booked calls
                  </span>
              </div>
            </div>

            <div className="pointer-events-none absolute top-[5.5rem] right-0 left-0 z-[4] mx-auto flex w-full max-w-[1560px] justify-between px-[clamp(1.5rem,4vw,4rem)] font-mono text-[0.6rem] tracking-[0.2em] uppercase">
              <span className="text-white/75" style={{ opacity: "var(--chrome)" }}>
                What everyone posts
              </span>
              {/* fades in as the dark pane arrives, rather than sitting on purple */}
              <span style={{ color: A.cyan.hex, opacity: "var(--reveal)" }}>What gets replies</span>
            </div>
            <div
              className="absolute inset-y-0 z-[4] w-px bg-[rgba(245,243,239,0.75)]"
              style={{ left: "var(--wipe)", opacity: "var(--chrome)" }}
            />
            <div
              className="absolute top-1/2 z-[5] -mt-[19px] -ml-[19px] flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[rgba(245,243,239,0.75)] bg-[rgba(10,11,12,0.6)] font-mono text-[0.6rem] backdrop-blur-sm"
              style={{ left: "var(--wipe)", opacity: "var(--chrome)" }}
            >
              ⟺
            </div>
          </div>
        </section>

        {/* ============ 04 THE OFFER ============ */}
        <section
          id="s04"
          data-section
          data-accent-rgb={A.magenta.rgb}
          style={{ ["--accent" as string]: A.magenta.hex }}
          className="sect grid grid-cols-1 content-between gap-[clamp(1.5rem,4vw,3.5rem)] lg:grid-cols-[auto_minmax(0,1fr)]"
        >
          <h2
            className="display-cond text-[clamp(2rem,5.5vw,4.4rem)] lg:row-span-2 lg:[writing-mode:vertical-rl]"
            data-split
          >
            <Split text="Deleted" />{" "}
            <span style={{ color: A.magenta.hex }}>
              <Split text="Mondays" />
            </span>
          </h2>

          <div className="flex max-w-[42ch] flex-col items-start gap-4 lg:ml-auto lg:items-end lg:text-right" data-fade>
            <SectionIndex n="04" label="Automated this week" className="lg:[&_.rule-56]:ml-auto" />
            <p className="body-copy">
              A standing weekly series. Three things you removed from somebody's week, with the
              before-time and the after-time. It compounds — after two months it reads as a portfolio
              nobody had to write.
            </p>
            <Hashtags tags={TAGS.mondays} className="lg:text-left" />
          </div>

          <div className="grid grid-cols-1 items-end gap-[clamp(0.9rem,2vw,1.5rem)] [perspective:900px] md:grid-cols-3">
            {OFFER_CARDS.map((card, i) => (
              <article
                key={card.ghost}
                className="offer-card relative flex flex-col overflow-hidden"
                style={{ marginBottom: `${i * 5}vh` }}
                data-fade
              >
                <div className="bar" />
                <div className="flex flex-1 flex-col gap-3 px-5 pt-5 pb-4">
                  <span className="mono-label">{card.eyebrow}</span>
                  <h4 className="display-card text-[1.25rem]" style={{ color: A.magenta.hex }}>
                    {card.name}
                  </h4>
                  <span className="mono-label">Hook · line one</span>
                  <p className="display-card -mt-2 text-[1.05rem] leading-[1.12]">{card.hook}</p>
                  <p className="text-[0.88rem] leading-relaxed whitespace-pre-line text-[rgba(245,243,239,0.82)]">
                    {card.body}
                  </p>
                  <span className="mono-label -mb-2">CTA</span>
                  <p
                    className="font-mono text-[0.62rem] tracking-[0.2em] uppercase"
                    style={{ color: A.magenta.hex }}
                  >
                    → {card.cta}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-[rgba(245,243,239,0.14)] px-5 py-3">
                  <span className="font-mono text-[0.62rem] tracking-[0.2em] text-[rgba(245,243,239,0.62)] uppercase">
                    {card.spec}
                  </span>
                </div>
                <span className="ghost-num display">{card.ghost}</span>
              </article>
            ))}
          </div>
        </section>

        {/* ============ 05 THE POSITION ============ */}
        <section
          id="s05"
          data-section
          data-accent-rgb={A.acid.rgb}
          style={{ ["--accent" as string]: A.acid.hex }}
          className="relative min-h-[220vh]"
        >
          <div className="sticky top-0 flex h-screen flex-col items-center justify-center gap-9 px-[clamp(1.25rem,5vw,5rem)] text-center">
            <p
              className="display max-w-[17ch] text-[clamp(2.2rem,5.8vw,5rem)] leading-[0.94]"
              data-words
            >
              {POSITION_LINE.split(" ").map((w, i) => (
                <span
                  key={i}
                  className="w inline-block"
                  style={POSITION_HI.includes(i) ? { color: A.acid.hex } : undefined}
                >
                  {w}
                  {i < POSITION_LINE.split(" ").length - 1 ? " " : ""}
                </span>
              ))}
            </p>

            <div className="flex max-w-[62ch] flex-col items-center gap-4" data-attrib>
              <p className="mono-label">05 — The position · Talking Reel · 30 sec</p>
              <p className="body-copy max-w-[56ch]">
                Turning people away in public is the single most credible thing an agency can do. Say
                which problems are a spreadsheet formula, which are a hiring problem, and which are
                actually worth paying you for.
              </p>
              <CaptionSwitcher set={CAPS.position} align="center" className="w-full max-w-[58ch] text-left" />
              <Hashtags tags={TAGS.position} className="w-full max-w-[58ch] text-left" />
            </div>
          </div>
        </section>

        {/* ============ 06 THE INDEX ============ */}
        <section
          id="s06"
          data-section
          data-accent-rgb={A.orange.rgb}
          style={{ ["--accent" as string]: A.orange.hex }}
          className="sect flex flex-col justify-center"
        >
          <div className="grid grid-cols-1 items-center gap-[clamp(2rem,6vw,5rem)] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="flex flex-col gap-4">
              <SectionIndex n="06" label="The receipt" />
              <p className="display text-[clamp(2.2rem,5vw,4.2rem)] leading-[0.92] [overflow-wrap:anywhere]">
                £<span data-count>0</span>
                <span style={{ color: A.orange.hex }}>/mo</span>
              </p>
              <p className="body-copy max-w-[32ch]">
                One client, one process, one number they can check. Case studies fail when they're
                vague — this one names the task, the cost and the nine days it took.
              </p>
              <p className="font-mono text-[0.62rem] tracking-[0.2em] text-[rgba(245,243,239,0.62)] uppercase">
                Carousel · 6 slides · 4:5 · once a month
              </p>
            </div>

            <div>
              {[
                ["The manual step", "Slide 01 · name it exactly"],
                ["Who was doing it", 'Slide 02 · a person, not "the team"'],
                ["What it cost", "Slide 03 · hours × their rate"],
                ["What we built", "Slide 04 · in one sentence"],
                ["What broke first", "Slide 05 · always include this"],
                ["The number now", "Slide 06 · nine days later"],
              ].map(([name, note], i, arr) => (
                <div
                  key={name}
                  className={`idx-row grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 ${
                    i === arr.length - 1 ? "border-b border-[rgba(245,243,239,0.14)]" : ""
                  }`}
                >
                  <span className="idx-name display-card text-[clamp(1rem,2.2vw,1.7rem)]">{name}</span>
                  <span className="idx-note text-right font-mono text-[0.6rem] tracking-[0.16em] uppercase">
                    {note}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <CaptionSwitcher set={CAPS.receipt} className="mt-8 max-w-[64ch]" />
          <Hashtags tags={TAGS.receipt} className="mt-6 max-w-[64ch]" />
        </section>

        {/* ============ 07 THE BUILD ============ */}
        <section
          id="s07"
          data-section
          data-accent-rgb={A.cyan.rgb}
          style={{ ["--accent" as string]: A.cyan.hex }}
          className="sect flex flex-col justify-center gap-10"
        >
          <div className="flex flex-col gap-4" data-fade>
            <SectionIndex n="07" label="Build it in twenty minutes" />
            <h2 className="display-cond max-w-[22ch] text-[clamp(1.9rem,5vw,3.6rem)]">
              Show the work, not the slide about the work
            </h2>
          </div>

          <div className="grid grid-cols-1 items-start gap-[clamp(1.5rem,5vw,4rem)] lg:grid-cols-2">
            <div className="flex flex-col gap-5" data-fade>
              <p className="body-copy max-w-[52ch]">
                Screen recording, no edit, no music. Take a real intake form and rebuild it live while
                narrating. Twenty minutes cut to ninety seconds. This is the post that converts the
                sceptics, because you can't fake it.
              </p>
              <CaptionSwitcher set={CAPS.build} />
              <Hashtags tags={TAGS.build} />
            </div>

            <div
              className="border border-[rgba(245,243,239,0.14)] bg-[rgba(10,11,12,0.72)] backdrop-blur-lg"
              data-fade
            >
              <div className="flex items-center gap-2 border-b border-[rgba(245,243,239,0.14)] px-4 py-3">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-[9px] w-[9px] rounded-full bg-[rgba(245,243,239,0.28)]" />
                ))}
                <span className="ml-auto font-mono text-[0.58rem] tracking-[0.18em] text-[rgba(245,243,239,0.62)] uppercase">
                  intake-rebuild · 19:47
                </span>
              </div>
              <div className="overflow-x-auto px-5 py-5 font-mono text-[0.72rem] leading-[1.95] text-[rgba(245,243,239,0.82)]">
                {[
                  ["00:00", "the form as it is today", "14 fields, 3 required"],
                  ["02:15", "what actually gets used", "6 fields, always"],
                  ["04:10", "wrong field type", "left in on purpose"],
                  ["06:30", "fixed, and why", ""],
                  ["09:40", "routing by job value", ""],
                  ["13:05", "the confirmation email", ""],
                  ["17:20", "it writes to the sheet", ""],
                  ["19:47", "done. hand it over.", ""],
                ].map(([t, what, note]) => (
                  <div key={t} className="grid grid-cols-[4.5rem_1fr_auto] gap-3 whitespace-nowrap">
                    <span style={{ color: A.cyan.hex }}>{t}</span>
                    <span>{what}</span>
                    <span className="text-[rgba(245,243,239,0.4)]">{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============ 08 THE DECK ============ */}
        <section
          id="s08"
          data-section
          data-accent-rgb={A.orange.rgb}
          style={{ ["--accent" as string]: A.orange.hex }}
          className="relative min-h-[260vh]"
        >
          {/* Three slides stand in the frame at rest and the other three are queued
             off the right edge, so the deck arrives the way it will actually be
             swiped. --card sizes off viewport height, and the frame is exactly
             three cards wide, so what's visible stays three however tall the
             window is. --deck carries the same scrub value out to the progress
             rule. */}
          <div
            data-deck-stage
            className="sticky top-0 flex h-screen flex-col justify-center gap-[clamp(1.25rem,3.5vh,2.25rem)] overflow-hidden px-[clamp(1.25rem,5vw,5rem)] py-[8vh]"
            style={{
              ["--card" as string]: "clamp(220px, 34vh, 380px)",
              ["--deck" as string]: "0",
            }}
          >
            <div className="flex flex-col gap-4" data-fade>
              <SectionIndex n="08" label="Idea 01, designed" />
              <h2 className="display-cond max-w-[22ch] text-[clamp(1.9rem,5vw,3.4rem)]">
                What the four-hour invoice actually looks like
              </h2>
              <p className="body-copy max-w-[54ch]">
                Six slides at 4:5 — the tallest ratio Instagram allows, so it takes the most feed
                height per swipe. Same frames work as a TikTok photo slideshow.
              </p>
            </div>

            <div data-deck className="deck-frame deck-mask">
              <div data-deck-track className="flex gap-4 will-change-transform">
                {SLIDES.map((s, i) => (
                  <article
                    key={i}
                    className="relative flex aspect-[4/5] w-[var(--card)] shrink-0 flex-col overflow-hidden border border-[rgba(245,243,239,0.14)] bg-[#0A0B0C] p-[clamp(1rem,2.2vh,1.5rem)]"
                  >
                    <div className={`flex flex-1 flex-col ${s.centre ? "justify-center" : ""}`}>
                      <span className="mono-label">{s.kicker}</span>
                      {s.render}
                    </div>
                    <div className="flex items-end justify-between pt-4">
                      <span className="font-mono text-[0.55rem] tracking-[0.2em] text-[rgba(245,243,239,0.45)]">
                        {String(i + 1).padStart(2, "0")} / 06
                      </span>
                      <span className="logo text-[rgba(245,243,239,0.45)]">
                        <LogoMark size={11} />
                        <span className="logo-word display text-[0.62rem]">Offhours</span>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="deck-frame flex items-center gap-5">
              <span className="mono-label whitespace-nowrap">
                Keep scrolling · export at 1080 × 1350
              </span>
              <span className="deck-rule" />
            </div>
          </div>
        </section>

        {/* ============ 09 THE SPEC ============ */}
        <section
          id="s09"
          data-section
          data-accent-rgb={A.magenta.rgb}
          style={{ ["--accent" as string]: A.magenta.hex }}
          className="sect flex flex-col justify-center"
        >
          <div className="flex flex-col gap-4" data-fade>
            <SectionIndex n="09" label="The spec" />
            <h2 className="display-cond max-w-[20ch] text-[clamp(1.9rem,5vw,3.4rem)]">
              What the week actually looks like
            </h2>
            <p className="body-copy max-w-[54ch]">
              Three a week beats seven. One proof, one opinion, one build — same three on both apps.
              That's the whole engine.
            </p>
          </div>

          <div
            className="relative mt-9 border-t border-[rgba(245,243,239,0.28)] pt-6"
            style={{ background: "linear-gradient(to bottom, rgba(10,11,12,0.5), rgba(10,11,12,0.82))" }}
            data-fade
          >
            <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-x-[clamp(1.5rem,4vw,3.5rem)]">
              {[
                [
                  ["Tuesday", "04 · Automated this week"],
                  ["Thursday", "05 · The position"],
                  ["Sunday", "07 · The build"],
                  ["Monthly", "06 · The receipt"],
                  ["Stories", "Daily · 3 frames"],
                ],
                [
                  ["Best slots", "07:30 · 12:15 · 19:00"],
                  ["Hook window", "First 2 seconds"],
                  ["Hashtags", "10–15, in caption"],
                  ["Captions", "Burned in, always"],
                  ["Link", "Bio only"],
                ],
                [
                  ["Cross-post", "Native upload, both"],
                  ["Never", "TikTok watermark on IG"],
                  ["Reply window", "First 60 min"],
                  ["Total time", "~2 hrs"],
                  ["Start with", "Section 02"],
                ],
              ].map((col, ci) => (
                <dl key={ci}>
                  {col.map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between gap-4 border-b border-[rgba(245,243,239,0.08)] py-[0.62rem] font-mono text-[0.66rem] tracking-[0.12em] tabular-nums uppercase"
                    >
                      <dt className="text-[rgba(245,243,239,0.45)]">{k}</dt>
                      <dd className="text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              ))}
            </div>
          </div>
        </section>

        {/* ============ 09 THE CLOSE ============ */}
        <section
          id="s10"
          data-section
          data-accent-rgb={A.acid.rgb}
          style={{ ["--accent" as string]: A.acid.hex }}
          className="sect flex flex-col items-center justify-center gap-6 text-center"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(10,11,12,0.9) 25%, transparent 72%)",
            }}
          />
          <span className="mono-label relative" data-fade>
            10 — Next
          </span>
          <h2 className="display relative max-w-[17ch] text-[clamp(2.2rem,7vw,5.4rem)]" data-split>
            <Split text="Now make it" />{" "}
            <span>
              <span style={{ color: A.acid.hex }}>y</span>
              <span style={{ color: A.orange.hex }}>o</span>
              <span style={{ color: A.cyan.hex }}>u</span>
              <span style={{ color: A.magenta.hex }}>rs</span>
            </span>
          </h2>
          <p className="body-copy relative max-w-[50ch]" data-fade>
            Swap Offhours for your name, your niche and your real numbers. The structure holds — one
            proof post, one opinion post, one build post, on repeat.
          </p>
          <button
            type="button"
            onClick={() => scrollToSection("s01")}
            className="pill-cta relative cursor-pointer"
            data-fade
          >
            <span className="fill" />
            <span>Back to the top</span>
            <span className="arrow">→</span>
          </button>
          <p className="mono-label relative" data-fade>
            Offhours — owners &amp; side-hustlers, 22–45 — Instagram + TikTok — saves &amp; shares — anti-hype
          </p>
        </section>
      </main>

      <footer
        className="relative z-[2] flex flex-wrap items-baseline justify-between gap-4 px-[clamp(1.25rem,5vw,5rem)] py-9 font-mono text-[0.62rem] tracking-[0.16em] text-[rgba(245,243,239,0.62)] uppercase"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(6,7,8,0.92))" }}
      >
        <Logo size={20} wordmarkClassName="display text-base text-[#f5f3ef]" />
        <span>Five ideas · fifteen captions · one week</span>
        <span>Working example — swap in your own</span>
      </footer>
    </>
  );
}
