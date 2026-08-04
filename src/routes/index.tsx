import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { InkFilm } from "@/components/InkFilm";
import { CursorBloom } from "@/components/CursorBloom";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Halide — See the difference before you ship it" },
      {
        name: "description",
        content:
          "Halide turns generic default interfaces into designed products. One continuous ink film, one visible quality difference, eight sections of proof.",
      },
      { property: "og:title", content: "Halide — See the difference before you ship it" },
      {
        property: "og:description",
        content:
          "A design engine for AI tools and developer products. Watch the default become the designed version as you scroll.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const A = {
  acid: { hex: "#D8FF3E", rgb: "216,255,62" },
  orange: { hex: "#FF5C38", rgb: "255,92,56" },
  cyan: { hex: "#6FE3FF", rgb: "111,227,255" },
  magenta: { hex: "#FF3D9A", rgb: "255,61,154" },
};

function Split({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split(" ").map((word, wi) => (
        <span key={wi} className="word-mask">
          {word.split("").map((c, ci) => (
            <span key={ci} className="char">
              {c}
            </span>
          ))}
          {wi < text.split(" ").length - 1 ? <span className="char">&nbsp;</span> : null}
        </span>
      ))}
    </span>
  );
}

function SectionIndex({ n, className = "" }: { n: string; className?: string }) {
  return (
    <div className={className}>
      <div className="mono-label">{n} / 08</div>
      <span className="rule-56 mt-2 sect-rule" />
    </div>
  );
}

function Landing() {
  const planeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      /* headline character masks */
      gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
        const chars = el.querySelectorAll(".char");
        gsap.from(chars, {
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
      const wipe = document.querySelector<HTMLElement>("[data-wipe]");
      if (wipe) {
        const state = { v: 72 };
        gsap.to(state, {
          v: 24,
          ease: "none",
          scrollTrigger: {
            trigger: "#s03",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.4,
          },
          onUpdate: () => wipe.style.setProperty("--wipe", `${state.v}%`),
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
        y: 24,
        scrollTrigger: { trigger: "#s05", start: "72% center", end: "88% center", scrub: 0.6 },
      });

      /* 06 — count up */
      const stat = document.querySelector<HTMLElement>("[data-count]");
      if (stat) {
        const obj = { n: 0 };
        gsap.to(obj, {
          n: 4.7,
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: { trigger: stat, start: "top 80%" },
          onUpdate: () => (stat.textContent = obj.n.toFixed(1) + "×"),
        });
      }

      /* cover badge rotation driven by scroll */
      gsap.to("[data-badge]", {
        rotation: 240,
        ease: "none",
        scrollTrigger: { trigger: "#s01", start: "top top", end: "bottom top", scrub: 0.5 },
      });

      /* scroll-velocity skew on the whole plane */
      if (!reduced && planeRef.current) {
        const setSkew = gsap.quickTo(planeRef.current, "skewY", {
          duration: 0.5,
          ease: "power3.out",
        });
        ScrollTrigger.create({
          onUpdate: (self) => {
            const s = gsap.utils.clamp(-2.2, 2.2, self.getVelocity() / -420);
            setSkew(s);
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <InkFilm />
      <CursorBloom />

      <header className="fixed top-0 left-0 z-20 flex w-full items-center justify-between px-[clamp(1.25rem,5vw,5rem)] py-6">
        <a href="#s01" className="display text-lg">
          Halide
        </a>
        <nav className="flex items-center gap-6 font-mono text-[0.68rem] tracking-[0.16em] uppercase">
          {["Argument", "Difference", "Offer", "Spec", "Contact"].map((l) => (
            <a key={l} href={`#s0${["Argument", "Difference", "Offer", "Spec", "Contact"].indexOf(l) + 2}`} className="nav-link">
              <span className="mr-2 opacity-50">·</span>
              {l}
            </a>
          ))}
        </nav>
      </header>

      <main ref={planeRef} className="plane">
        {/* 01 COVER */}
        <section
          id="s01"
          data-section
          data-accent-rgb={A.acid.rgb}
          style={{ ["--accent" as string]: A.acid.hex }}
          className="sect flex flex-col items-center justify-center text-center"
        >
          <h1 className="display text-[clamp(2.8rem,10.5vw,9.5rem)]" data-split>
            <Split text="Default" />
            <br />
            <span style={{ color: A.acid.hex }}>
              <Split text="Is Not" />
            </span>
          </h1>
          <p
            className="display-cond mt-8 max-w-[19ch] text-[clamp(1.4rem,3.2vw,2.4rem)]"
            data-fade
          >
            A product people remember
          </p>
          <p className="body-copy mt-6 max-w-[46ch]" data-fade>
            Halide rebuilds the surface of AI tools and developer products, so the quality of the
            thinking underneath finally shows on the screen.
          </p>
          <SectionIndex n="01" className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center [&_.rule-56]:mx-auto" />
          <div
            data-badge
            className="absolute right-[clamp(1.25rem,5vw,5rem)] bottom-10 h-24 w-24 rounded-full border border-[rgba(245,243,239,0.2)]"
          >
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <defs>
                <path id="circ" d="M50,50 m-34,0 a34,34 0 1,1 68,0 a34,34 0 1,1 -68,0" />
              </defs>
              <text className="fill-[rgba(245,243,239,0.62)] font-mono text-[9px] tracking-[0.24em] uppercase">
                <textPath href="#circ">Scroll · to · develop · the · image ·</textPath>
              </text>
            </svg>
          </div>
        </section>

        {/* 02 ARGUMENT */}
        <section
          id="s02"
          data-section
          data-accent-rgb={A.orange.rgb}
          style={{ ["--accent" as string]: A.orange.hex }}
          className="sect relative flex flex-col justify-between pt-28"
        >
          <div className="pointer-events-none absolute inset-y-0 right-0 w-2/3 bg-gradient-to-l from-[rgba(6,7,8,0.82)] to-transparent" />
          <div className="relative ml-auto max-w-[38ch] pt-24 text-right">
            <SectionIndex n="02" className="mb-6 [&_.rule-56]:ml-auto" />
            <p className="body-copy" data-fade>
              Most tools ship the same screen. The same centred hero, the same three cards, the same
              translucent border. The engineering is different every time; the surface never is.
            </p>
            <div className="mt-8 flex flex-wrap justify-end gap-2" data-fade>
              {["Interface", "Motion", "Type system", "Colour", "Density", "Proof"].map((c) => (
                <span key={c} className="chip">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <h2 className="display max-w-[12em] text-[clamp(2.6rem,10vw,8rem)]" data-split>
              <Split text="Sameness" />{" "}
              <span style={{ color: A.orange.hex }}>
                <Split text="Costs" />
              </span>
            </h2>
            <div className="mono-label mt-5">
              Observed across 240 launches / 2023—2026 / no outlier removed
            </div>
          </div>
        </section>

        {/* 03 DIFFERENCE — full bleed */}
        <section
          id="s03"
          data-section
          data-accent-rgb={A.cyan.rgb}
          style={{ ["--accent" as string]: A.cyan.hex }}
          className="relative h-[180vh]"
        >
          <div className="sticky top-0 h-screen overflow-hidden" data-wipe>
            {/* lower pane: generic default */}
            <div className="absolute inset-0 flex items-center bg-gradient-to-br from-[#4338ca] to-[#7c3aed]">
              <div className="w-[46%] px-[5vw] text-center">
                <h3 className="text-3xl font-semibold text-white/95">Welcome to your platform</h3>
                <p className="mx-auto mt-3 max-w-[36ch] text-base text-white/80">
                  Everything you need to build, ship and scale — all in one place.
                </p>
                <div className="mt-8 grid grid-cols-3 gap-4">
                  {["⚡", "🔒", "📈"].map((e, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/20 bg-white/10 p-5 text-center"
                    >
                      <div className="text-2xl">{e}</div>
                      <div className="mt-2 text-base text-white/90">Feature {i + 1}</div>
                      <div className="mt-1 text-base text-white/70">
                        Powerful and easy to use.
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-8 rounded-full bg-white px-7 py-3 text-base font-medium text-indigo-700">
                  Get started
                </button>
              </div>
            </div>

            {/* upper pane: designed version */}
            <div
              className="absolute inset-0 flex items-center justify-end bg-[#0a0b0c]"
              style={{ clipPath: "inset(0 0 0 var(--wipe, 72%))" }}
            >
              <div className="w-[40%] pr-[6vw]">
                <div className="mono-label">Same content · redrawn</div>
                <h3 className="display mt-4 text-[clamp(2rem,4.6vw,4rem)]">
                  Build ship{" "}
                  <span style={{ color: A.cyan.hex }}>scale</span>
                </h3>
                <div className="mt-10">
                  {[
                    ["01", "Latency", "p95 · 42ms"],
                    ["02", "Isolation", "per-tenant keys"],
                    ["03", "Throughput", "1.4M req/min"],
                  ].map(([i, n, note]) => (
                    <div
                      key={i}
                      className="flex items-baseline justify-between border-t border-[rgba(245,243,239,0.14)] py-4"
                    >
                      <div className="flex items-baseline gap-5">
                        <span className="mono-label">{i}</span>
                        <span className="display-card text-2xl">{n}</span>
                      </div>
                      <span className="mono-label">{note}</span>
                    </div>
                  ))}
                </div>
                <button
                  className="mt-9 rounded-full px-7 py-3 font-mono text-[0.7rem] tracking-[0.18em] text-[#0a0b0c] uppercase"
                  style={{ background: A.cyan.hex }}
                >
                  Open the console
                </button>
              </div>
            </div>

            <div
              className="absolute top-0 bottom-0 w-px bg-[rgba(245,243,239,0.85)]"
              style={{ left: "var(--wipe, 72%)" }}
            >
              <div className="absolute top-1/2 left-1/2 h-[38px] w-[38px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(245,243,239,0.85)] bg-[rgba(10,11,12,0.6)] backdrop-blur-sm" />
            </div>

            <SectionIndex n="03" className="absolute bottom-8 left-[clamp(1.25rem,5vw,5rem)] z-10" />
          </div>
        </section>

        {/* 04 OFFER */}
        <section
          id="s04"
          data-section
          data-accent-rgb={A.magenta.rgb}
          style={{ ["--accent" as string]: A.magenta.hex }}
          className="sect flex gap-[clamp(1rem,4vw,4rem)] pt-28"
        >
          <div className="shrink-0 pt-[6vh]" style={{ writingMode: "vertical-rl" }}>
            <h2 className="display text-[clamp(2.2rem,6vw,5rem)]" data-split>
              <Split text="The Offer" />
            </h2>
          </div>
          <div className="flex flex-1 flex-col">
            <div className="ml-auto max-w-[40ch] pt-16 text-right">
              <SectionIndex n="04" className="mb-5 [&_.rule-56]:ml-auto" />
              <p className="body-copy" data-fade>
                Three engagements. Each ends with a shipped surface, not a deck — and with the
                tokens, motion rules and components your team keeps.
              </p>
            </div>
            <div
              className="mt-auto grid grid-cols-1 gap-6 pt-16 md:grid-cols-3"
              style={{ perspective: "900px" }}
            >
              {[
                ["01", "Rework", "One surface redrawn end to end, from grid to motion.", "4 weeks · fixed", "From $18k"],
                ["02", "System", "A full token and component system your team can extend.", "8 weeks · fixed", "From $46k"],
                ["03", "Resident", "An embedded designer inside your product team.", "Monthly · rolling", "From $12k/mo"],
              ].map(([i, name, desc, spec, price], k) => (
                <article
                  key={i}
                  className="offer-card"
                  style={{ marginBottom: `${k * 5}vh` }}
                  data-fade
                >
                  <div className="bar" />
                  <div className="relative p-7">
                    <div className="mono-label">Engagement {i}</div>
                    <h3
                      className="display-card mt-4 text-[clamp(1.6rem,2.6vw,2.4rem)]"
                      style={{ color: A.magenta.hex }}
                    >
                      {name}
                    </h3>
                    <p className="body-copy mt-4">{desc}</p>
                    <div className="mono-label mt-6">{spec}</div>
                    <div className="mt-6 border-t border-[rgba(245,243,239,0.14)] pt-4">
                      <span className="mono-label">{price}</span>
                    </div>
                    <span className="ghost-num">{i}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 05 POSITION */}
        <section
          id="s05"
          data-section
          data-accent-rgb={A.acid.rgb}
          style={{ ["--accent" as string]: A.acid.hex }}
          className="relative h-[220vh]"
        >
          <div className="sticky top-0 flex h-screen flex-col items-center justify-center px-[clamp(1.25rem,5vw,5rem)] text-center">
            <SectionIndex n="05" className="mb-10 [&_.rule-56]:mx-auto" />
            <p
              className="display-cond max-w-[18ch] text-[clamp(2.2rem,5.8vw,5rem)]"
              style={{ lineHeight: 0.94 }}
              data-words
            >
              {"A product is judged before it is understood".split(" ").map((w, i) => (
                <span key={i} className="w mr-[0.22em] inline-block">
                  {w}
                </span>
              ))}
            </p>
            <div className="mono-label mt-10" data-attrib>
              Halide · position statement · rev 04
            </div>
          </div>
        </section>

        {/* 06 INDEX */}
        <section
          id="s06"
          data-section
          data-accent-rgb={A.orange.rgb}
          style={{ ["--accent" as string]: A.orange.hex }}
          className="sect grid grid-cols-1 items-center gap-16 pt-28 md:grid-cols-[0.9fr_1.1fr]"
        >
          <div>
            <SectionIndex n="06" className="mb-8" />
            <div
              className="display text-[clamp(4rem,11vw,9rem)]"
              data-count
              style={{ color: A.orange.hex }}
            >
              0.0×
            </div>
            <p className="body-copy mt-5 max-w-[34ch]">
              median lift in trial-to-paid across shipped reworks, measured{" "}
              <span style={{ color: A.orange.hex }}>ninety days after launch</span>.
            </p>
          </div>
          <div>
            {[
              ["Vector runtime", "series B · 2026"],
              ["Ledger console", "series A · 2025"],
              ["Orbit agents", "seed · 2025"],
              ["Northlight DB", "series C · 2024"],
              ["Paper compiler", "bootstrap · 2024"],
              ["Signal mesh", "series A · 2023"],
            ].map(([n, note]) => (
              <div key={n} className="idx-row flex items-baseline justify-between">
                <span className="idx-name display-card text-[clamp(1.3rem,2.6vw,2.1rem)]">{n}</span>
                <span className="idx-note mono-label">{note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 07 SPEC */}
        <section
          id="s07"
          data-section
          data-accent-rgb={A.cyan.rgb}
          style={{ ["--accent" as string]: A.cyan.hex }}
          className="sect relative flex flex-col justify-center pt-32"
        >
          <div className="pointer-events-none absolute inset-x-0 top-[12%] bottom-[12%] bg-gradient-to-b from-transparent via-[rgba(6,7,8,0.82)] to-transparent" />
          <div className="relative">
            <SectionIndex n="07" className="mb-8" />
            <h2 className="display max-w-[16ch] text-[clamp(1.8rem,4vw,3.2rem)]" data-split>
              <Split text="What you actually receive" />
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-x-14 border-t border-[rgba(245,243,239,0.3)] pt-8 md:grid-cols-3">
              {[
                [
                  ["Grid", "12 col / 4 gutter"],
                  ["Type ramp", "9 steps"],
                  ["Width axis", "62–125"],
                  ["Motion", "cubic-bezier(.6,0,.2,1)"],
                ],
                [
                  ["Tokens", "oklch, 84 values"],
                  ["Components", "38 shipped"],
                  ["Dark", "native, not inverted"],
                  ["Density", "3 modes"],
                ],
                [
                  ["Handoff", "repo + figma"],
                  ["Review", "weekly, recorded"],
                  ["Licence", "yours, perpetual"],
                  ["Support", "60 days"],
                ],
              ].map((col, ci) => (
                <div key={ci}>
                  {col.map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-baseline justify-between border-b border-[rgba(245,243,239,0.1)] py-3"
                    >
                      <span className="mono-label">{k}</span>
                      <span className="mono-label text-right" style={{ color: A.cyan.hex }}>
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 08 CLOSE */}
        <section
          id="s08"
          data-section
          data-accent-rgb={A.magenta.rgb}
          style={{ ["--accent" as string]: A.magenta.hex }}
          className="sect relative flex flex-col items-center justify-center text-center"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(6,7,8,0.88) 0%, rgba(6,7,8,0.5) 55%, transparent 80%)",
            }}
          />
          <div className="relative flex flex-col items-center">
            <SectionIndex n="08" className="mb-10 [&_.rule-56]:mx-auto" />
            <h2 className="display text-[clamp(2.4rem,8vw,7rem)]" data-split>
              <Split text="Make it" />
              <br />
              <span>
                {"Yours".split("").map((c, i) => (
                  <span
                    key={i}
                    style={{ color: [A.acid.hex, A.orange.hex, A.cyan.hex, A.magenta.hex, A.acid.hex][i] }}
                  >
                    <Split text={c} />
                  </span>
                ))}
              </span>
            </h2>
            <p className="body-copy mt-8 max-w-[46ch]" data-fade>
              Send one screen. We return it redrawn within five working days, with the reasoning
              written down beside it.
            </p>
            <a href="mailto:studio@halide.design" className="pill-cta mt-10" data-fade>
              <span className="fill" />
              <span>Start the rework</span>
              <span className="arrow">→</span>
            </a>
            <div className="mono-label mt-8 flex flex-wrap justify-center gap-6">
              <a href="mailto:studio@halide.design" className="ext-link">
                studio@halide.design
              </a>
              <a href="#s01" className="ext-link">
                back to top
              </a>
            </div>
          </div>
        </section>

        <footer className="relative flex flex-wrap items-baseline justify-between gap-4 bg-gradient-to-b from-transparent to-[#060708] px-[clamp(1.25rem,5vw,5rem)] py-10">
          <span className="display text-lg">Halide</span>
          <span className="mono-label">Interface work for products that deserve the second look</span>
          <span className="mono-label">© 2026</span>
        </footer>
      </main>
    </>
  );
}
