import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { InkFilm } from "@/components/InkFilm";
import { CursorBloom } from "@/components/CursorBloom";
import { Logo, LogoMark } from "@/components/Logo";
import { usePack } from "@/context/PackContext";
import { PackActions } from "@/components/PackActions";
import { GOAL_LABEL, PLATFORM_LABEL, ideaByKind, type Caption } from "@/lib/pack";

const A = {
  acid: { hex: "#D8FF3E", rgb: "216,255,62" },
  orange: { hex: "#FF5C38", rgb: "255,92,56" },
  cyan: { hex: "#6FE3FF", rgb: "111,227,255" },
  magenta: { hex: "#FF3D9A", rgb: "255,61,154" },
};

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

function Hashtags({ tags, className = "" }: { tags: string[]; className?: string }) {
  return (
    <div className={className}>
      <p className="mono-label">Hashtags · {tags.length}</p>
      <p className="mt-2 font-mono text-[0.6rem] leading-[2] tracking-[0.06em] text-[rgba(245,243,239,0.4)]">
        {tags.join(" ")}
      </p>
    </div>
  );
}

const LETTERS = ["A", "B", "C"] as const;

function CaptionSwitcher({
  captions,
  align = "left",
  className = "",
}: {
  captions: Caption[];
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const cap = captions[active] ?? captions[0];
  if (!cap) return null;

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
        {captions.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={active === i}
            onClick={() => setActive(i)}
            className="chip"
            style={
              active === i
                ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#0a0b0c" }
                : undefined
            }
          >
            Caption {LETTERS[i] ?? i + 1}
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

/* Exported so the /pack route can mount the same view driven by a URL brief,
   without duplicating a ~700-line component. `/` opens on the example pack;
   `/pack?brief=...` opens on a generated one. */
export function ContentPack() {
  /* All of the writing on this page comes from the pack; the sections, the
     type, the scroll behaviour and the designed deck are the design and stay
     here. Swap the pack and the page says something else, unchanged. */
  const pack = usePack();
  const { brief } = pack;
  const proof = ideaByKind(pack, "proof");
  const series = ideaByKind(pack, "series");
  const opinion = ideaByKind(pack, "opinion");
  const receipt = ideaByKind(pack, "receipt");
  const build = ideaByKind(pack, "build");

  /* Section 05 sets the opinion post's hook as a wall of type, with its closing
     three words in the accent — that is where the turn is in a line like "half
     the people who DM us / don't need AI". Counting back from the end keeps the
     emphasis on the payoff whatever the hook says. */
  const positionHook = opinion.captions[0].hook;
  const positionFollow = opinion.captions[0].body.split("\n")[0] ?? "";
  const positionWords = `${positionHook} ${positionFollow}`.trim().split(" ");
  const positionHighlightFrom = Math.max(0, positionHook.split(" ").length - 3);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    let ctx: gsap.Context | null = null;
    const init = () => {
      ctx = gsap.context(() => {
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
      const wipePane = document.querySelector<HTMLElement>("[data-wipe-pane]");
      const wipeInner = document.querySelector<HTMLElement>("[data-wipe-pane-inner]");
      const wipeChrome = document.querySelector<HTMLElement>("[data-wipe-chrome]");
      const wipeAnchors = Array.from(document.querySelectorAll<HTMLElement>(".wipe-anchor"));
      if (wipe && wipePane && wipeInner && wipeChrome) {
        // Measured once per refresh instead of per frame — reading clientWidth
        // inside onUpdate would force layout on every scrubbed frame.
        let stageW = wipe.clientWidth;
        const measureStage = () => {
          stageW = wipe.clientWidth;
          wipe.style.setProperty("--stage-w", `${stageW}px`);
        };
        measureStage();
        ScrollTrigger.addEventListener("refresh", measureStage);

        const state = { v: 100 };
        gsap.to(state, {
          v: 0,
          ease: "none",
          scrollTrigger: { trigger: "#s03", start: "top top", end: "bottom bottom", scrub: 0.4 },
          onUpdate: () => {
            // Written straight onto the three moving elements. Setting a custom
            // property on the parent instead would invalidate style for the
            // whole pinned subtree on every frame, to move three boxes.
            wipePane.style.transform = `translate3d(${state.v}%,0,0)`;
            wipeInner.style.transform = `translate3d(${-state.v}%,0,0)`;
            wipeChrome.style.transform = `translate3d(${state.v}%,0,0)`;
            // Both anchors centre themselves in their own visible strip, which
            // CSS works out from the divider position. Set on the two elements
            // that read it, not on the pinned parent — a custom property there
            // invalidates style for everything beneath it on every frame.
            const x = (stageW * state.v) / 100;
            for (const a of wipeAnchors) a.style.setProperty("--wipe-x", `${x}px`);
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
    };

    if (document.body.classList.contains("intro-active")) {
      const onDone = () => init();
      window.addEventListener("intro:done", onDone, { once: true });
      return () => {
        window.removeEventListener("intro:done", onDone);
        ctx?.revert();
      };
    }
    init();
    return () => ctx?.revert();
  }, []);

  return (
    <>
      <InkFilm />
      <CursorBloom />

      <header className="fixed top-0 right-0 left-0 z-20 flex items-center justify-between px-[clamp(1.25rem,5vw,5rem)] py-5">
        <button
          type="button"
          onClick={() => scrollToSection("s01")}
          aria-label={`${brief.name} — back to top`}
          className="cursor-pointer"
        >
          <Logo name={brief.name} className="header-logo" />
        </button>
        <nav className="flex items-center gap-6 font-mono text-[0.68rem] tracking-[0.16em] uppercase">
          {(
            [
              ["Proof", "s03"],
              ["Receipts", "s06"],
              ["Make it yours", "s09"],
            ] as const
          ).map(([label, id]) => (
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
            <span className="yellow-rust" data-text="hype">
              hype
            </span>
          </p>
          <p className="body-copy max-w-[46ch]" data-fade>
            Fifteen captions, every hook and CTA written out, for an agency that automates the boring
            half of a small business.
          </p>

          <dl
            className="mt-3 grid w-full max-w-[1000px] grid-cols-[repeat(auto-fit,minmax(148px,1fr))] gap-px border border-[rgba(245,243,239,0.14)] bg-[rgba(245,243,239,0.14)] text-left"
            data-fade
          >
            {/* The five answers the brief asks for, straight off the brief. */}
            {[
              ["Business", `${brief.name} — ${brief.business}`],
              ["Audience", brief.audience],
              ["Platform", brief.platforms.map((p) => PLATFORM_LABEL[p]).join(" + ")],
              ["Goal", GOAL_LABEL[brief.goal]],
              ["Tone", brief.tone.join(" · ")],
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

          <PackActions />

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
                label={proof.title}
                className="[&_.rule-56]:ml-auto [&_.rule-56]:origin-right"
              />
              <CaptionSwitcher captions={proof.captions} align="right" className="mt-5 w-full" />
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
              {proof.format}
            </p>
            <Hashtags tags={proof.hashtags} className="max-w-[46ch]" />
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

            {/* The written version. Two nested transforms rather than a
               clip-path: the outer pane slides right and clips with overflow,
               the inner counter-slides by the same amount so the content stays
               pinned to the viewport. Visually identical to inset(0 0 0 x), but
               transforms are composited — clip-path on a full-viewport element
               repaints the entire pane on every scrubbed frame. */}
            <div
              data-wipe-pane
              className="absolute inset-0 overflow-hidden will-change-transform"
              style={{ transform: "translate3d(100%,0,0)" }}
            >
              <div
                data-wipe-pane-inner
                className="absolute inset-0 bg-[#0a0b0c] will-change-transform"
                style={{ transform: "translate3d(-100%,0,0)" }}
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
            </div>

            <div className="pointer-events-none absolute top-[5.5rem] right-0 left-0 z-[4] mx-auto flex w-full max-w-[1560px] justify-between px-[clamp(1.5rem,4vw,4rem)] font-mono text-[0.6rem] tracking-[0.2em] uppercase">
              <span className="text-white/75" style={{ opacity: "var(--chrome)" }}>
                What everyone posts
              </span>
              {/* fades in as the dark pane arrives, rather than sitting on purple */}
              <span style={{ color: A.cyan.hex, opacity: "var(--reveal)" }}>What gets replies</span>
            </div>

            {/* Divider and handle ride one full-width wrapper. They used to be
               positioned with `left: var(--wipe)`, which is a layout property —
               animating it re-laid-out the pinned pane every frame. A percentage
               translate on a 1px rule would be meaningless, hence the wrapper:
               it spans the viewport, so translating it by --wipe moves both
               pieces exactly as `left` did, on the compositor. */}
            <div
              data-wipe-chrome
              className="pointer-events-none absolute inset-0 z-[4] will-change-transform"
              style={{ opacity: "var(--chrome)", transform: "translate3d(100%,0,0)" }}
            >
              <div className="absolute inset-y-0 left-0 w-px bg-[rgba(245,243,239,0.75)]" />
              <div className="absolute top-1/2 left-0 z-[5] -mt-[19px] -ml-[19px] flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[rgba(245,243,239,0.75)] bg-[rgba(10,11,12,0.86)] font-mono text-[0.6rem]">
                ⟺
              </div>
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
            <SectionIndex n="04" label={series.title} className="lg:[&_.rule-56]:ml-auto" />
            <p className="body-copy">{series.premise}</p>
            <Hashtags tags={series.hashtags} className="lg:text-left" />
          </div>

          {/* The series is the one idea whose three captions are three different
             posts rather than three ways to write one, so each card carries its
             own variant label and format. */}
          <div className="grid grid-cols-1 items-end gap-[clamp(0.9rem,2vw,1.5rem)] [perspective:900px] md:grid-cols-3">
            {series.captions.map((cap, i) => (
              <article
                key={i}
                className="offer-card relative flex flex-col overflow-hidden"
                style={{ marginBottom: `${i * 5}vh` }}
                data-fade
              >
                <div className="bar" />
                <div className="flex flex-1 flex-col gap-3 px-5 pt-5 pb-4">
                  <span className="mono-label">
                    Caption {LETTERS[i] ?? i + 1}
                    {cap.variant ? ` · ${cap.variant.label}` : ""}
                  </span>
                  <h4 className="display-card text-[1.25rem]" style={{ color: A.magenta.hex }}>
                    {cap.variant?.title ?? series.title}
                  </h4>
                  <span className="mono-label">Hook · line one</span>
                  <p className="display-card -mt-2 text-[1.05rem] leading-[1.12]">{cap.hook}</p>
                  <p className="text-[0.88rem] leading-relaxed whitespace-pre-line text-[rgba(245,243,239,0.82)]">
                    {cap.body}
                  </p>
                  <span className="mono-label -mb-2">CTA</span>
                  <p
                    className="font-mono text-[0.62rem] tracking-[0.2em] uppercase"
                    style={{ color: A.magenta.hex }}
                  >
                    → {cap.cta}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-[rgba(245,243,239,0.14)] px-5 py-3">
                  <span className="font-mono text-[0.62rem] tracking-[0.2em] text-[rgba(245,243,239,0.62)] uppercase">
                    {cap.variant?.format ?? series.format}
                  </span>
                </div>
                <span className="ghost-num display">{LETTERS[i] ?? i + 1}</span>
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
              {positionWords.map((w, i) => (
                <span
                  key={i}
                  className="w inline-block"
                  style={i >= positionHighlightFrom ? { color: A.acid.hex } : undefined}
                >
                  {w}
                  {i < positionWords.length - 1 ? " " : ""}
                </span>
              ))}
            </p>

            <div className="flex max-w-[62ch] flex-col items-center gap-4" data-attrib>
              <p className="mono-label">
                05 — {opinion.title} · {opinion.format}
              </p>
              <p className="body-copy max-w-[56ch]">{opinion.premise}</p>
              <CaptionSwitcher captions={opinion.captions} align="center" className="w-full max-w-[58ch] text-left" />
              <Hashtags tags={opinion.hashtags} className="w-full max-w-[58ch] text-left" />
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
              <SectionIndex n="06" label={receipt.title} />
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

          <CaptionSwitcher captions={receipt.captions} className="mt-8 max-w-[64ch]" />
          <Hashtags tags={receipt.hashtags} className="mt-6 max-w-[64ch]" />
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
            <SectionIndex n="07" label={build.title} />
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
              <CaptionSwitcher captions={build.captions} />
              <Hashtags tags={build.hashtags} />
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
                        <span className="logo-word display text-[0.62rem]">{brief.name}</span>
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
                pack.cadence.map((c) => [c.day, c.idea]),
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
            Swap in your name, your niche and your real numbers. The structure holds — one
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
            {brief.name} — {brief.audience} —{" "}
            {brief.platforms.map((pf) => PLATFORM_LABEL[pf]).join(" + ")} —{" "}
            {GOAL_LABEL[brief.goal]} — {brief.tone.join(" · ")}
          </p>
        </section>
      </main>

      <footer
        className="relative z-[2] flex flex-wrap items-baseline justify-between gap-4 px-[clamp(1.25rem,5vw,5rem)] py-9 font-mono text-[0.62rem] tracking-[0.16em] text-[rgba(245,243,239,0.62)] uppercase"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(6,7,8,0.92))" }}
      >
        <Logo name={brief.name} size={20} wordmarkClassName="display text-base text-[#f5f3ef]" />
        <span>Five ideas · fifteen captions · one week</span>
        <span>Working example — swap in your own</span>
      </footer>
    </>
  );
}
