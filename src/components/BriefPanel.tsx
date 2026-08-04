import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { usePackContext } from "@/context/PackContext";
import { GOAL_LABEL, PLATFORM_LABEL, type Brief, type Goal, type Platform } from "@/lib/pack";
import { briefToParam } from "@/lib/briefUrl";

/* The five questions the brief asks for, plus the proof block — the numbers a
   generator cannot invent and without which every post comes out as "unlock the
   power of AI for your business". The panel opens seeded with whatever pack is
   on screen, so it reads as editing the brief rather than starting from nothing. */

const PLATFORMS: Platform[] = ["instagram", "tiktok", "facebook", "linkedin", "youtube"];
const GOALS: Goal[] = ["saves", "engagement", "awareness", "sales", "followers"];

/* First-open state — a blank brief with just enough scaffolding to satisfy
   the shape (one platform selected, since togglePlatform refuses to leave the
   list empty; a goal preselected because the chips are single-choice). Once
   the user has generated a pack, we seed with their previous brief instead of
   this, so they can edit rather than starting from scratch. */
const EMPTY_BRIEF: Brief = {
  name: "",
  business: "",
  promise: "",
  audience: "",
  platforms: ["instagram"],
  goal: "saves",
  tone: [],
  niche: "",
  proof: { task: "", before: "", cost: "", who: "", client: "", took: "" },
};

export function BriefPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { brief: current, isExample, setBrief } = usePackContext();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Brief>(EMPTY_BRIEF);
  /* Two-step wizard: step 1 asks the basic brief (business, audience,
     platforms, goal), step 2 asks the specific numbers that make captions
     concrete. Splitting them keeps the modal shorter — twelve visible fields
     at once is what makes people bounce. */
  const [step, setStep] = useState<1 | 2>(1);
  const firstField = useRef<HTMLInputElement>(null);

  /* Reseed each time it opens, so it never shows a stale edit from last time.
     Blank on the first open (the Offhours example isn't *their* brief and
     shouldn't be pre-filled into their form); the user's previous brief on
     subsequent opens so they can edit rather than retype. Also reset to step
     one so re-opening always starts at the top of the flow. */
  useEffect(() => {
    if (open) {
      setDraft(isExample ? EMPTY_BRIEF : current);
      setStep(1);
      // Focus after paint, or the field is not in the document yet.
      requestAnimationFrame(() => firstField.current?.focus());
    }
  }, [open, current, isExample]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // The page behind is a scroll experience; letting it move while a modal is
    // open is disorienting, and on iOS it scrolls the wrong element entirely.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  /* Rendered on <body>, not where it sits in the tree. `.plane` carries
     will-change:transform, which makes it the containing block for every fixed
     descendant — inside it the scrim anchors to the full page height instead of
     the viewport, so the panel lands halfway down and runs off the bottom. */
  if (!open || typeof document === "undefined") return null;

  const set = <K extends keyof Brief>(key: K, value: Brief[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setProof = <K extends keyof Brief["proof"]>(key: K, value: string) =>
    setDraft((d) => ({ ...d, proof: { ...d.proof, [key]: value } }));

  const togglePlatform = (p: Platform) =>
    setDraft((d) => {
      const has = d.platforms.includes(p);
      // Never let it reach zero — a pack with no platform has no format to name.
      if (has && d.platforms.length === 1) return d;
      return { ...d, platforms: has ? d.platforms.filter((x) => x !== p) : [...d.platforms, p] };
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    /* Step 1 → advance to the numbers. The submit button acts as "Continue"
       here, so the browser's built-in required-field validation runs first;
       if `name` or `business` is empty, this handler never fires. */
    if (step === 1) {
      setStep(2);
      /* Scroll the panel to the top so the numbers block is visible from
       the first line. Focus goes to the first proof input on next paint. */
      requestAnimationFrame(() => {
        firstField.current?.focus();
        const panel = document.querySelector<HTMLElement>(".brief-panel");
        panel?.scrollTo({ top: 0, behavior: "auto" });
      });
      return;
    }
    /* Step 2 → the real submit. Set the brief before navigating so /pack
       renders with the generated pack on the very first paint. */
    setBrief(draft);
    onClose();
    navigate({ to: "/pack", search: { brief: briefToParam(draft) } });
  };

  return createPortal(
    <div className="brief-scrim" role="dialog" aria-modal="true" aria-label="Your brief">
      <button className="brief-backdrop" aria-label="Close" onClick={onClose} type="button" />
      <form className="brief-panel" onSubmit={submit}>
        <header className="brief-head">
          <div>
            <p className="mono-label">
              {step === 1 ? "Step 1 · the brief" : "Step 2 · the numbers"}
            </p>
            <h2 className="display-cond mt-1 text-[clamp(1.4rem,3vw,2rem)]">
              {step === 1 ? "Make it yours" : "The numbers"}
            </h2>
          </div>
          <button type="button" className="chip" onClick={onClose}>
            Close
          </button>
        </header>

        {step === 1 ? (
          <div className="brief-grid">
            <Field label="Business name">
              <input
                ref={firstField}
                className="brief-input"
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </Field>
            <Field label="What it is" hint="bakery, gym, clothing brand">
              <input
                className="brief-input"
                value={draft.business}
                onChange={(e) => set("business", e.target.value)}
                required
              />
            </Field>
            <Field label="What it does for people" hint="one verb phrase" wide>
              <input
                className="brief-input"
                value={draft.promise}
                onChange={(e) => set("promise", e.target.value)}
              />
            </Field>
            <Field label="Audience" hint="age, interests, location" wide>
              <input
                className="brief-input"
                value={draft.audience}
                onChange={(e) => set("audience", e.target.value)}
              />
            </Field>
            <Field label="Niche" hint="seeds the hashtags">
              <input
                className="brief-input"
                value={draft.niche}
                onChange={(e) => set("niche", e.target.value)}
              />
            </Field>
            <Field label="Tone" hint="comma separated">
              <input
                className="brief-input"
                value={draft.tone.join(", ")}
                onChange={(e) =>
                  set(
                    "tone",
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  )
                }
              />
            </Field>

            <Field label="Platform" wide group>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const on = draft.platforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      className="chip"
                      aria-pressed={on}
                      onClick={() => togglePlatform(p)}
                    >
                      {PLATFORM_LABEL[p]}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Goal" wide group>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className="chip"
                    aria-pressed={draft.goal === g}
                    onClick={() => set("goal", g)}
                  >
                    {GOAL_LABEL[g]}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        ) : (
          <div className="brief-proof">
            <p className="body-copy mt-2 mb-4 max-w-[62ch] text-[0.86rem]">
              Every caption is built out of these. Vague in, vague out — a pack written from tone
              alone is how you end up posting "unlock the power of AI for your business".
            </p>
            <div className="brief-grid">
              <Field label="The manual task" hint="sending one invoice">
                <input
                  ref={firstField}
                  className="brief-input"
                  value={draft.proof.task}
                  onChange={(e) => setProof("task", e.target.value)}
                />
              </Field>
              <Field label="How long it takes" hint="4 hours 11 minutes">
                <input
                  className="brief-input"
                  value={draft.proof.before}
                  onChange={(e) => setProof("before", e.target.value)}
                />
              </Field>
              <Field label="What it costs" hint="£2,400 a month">
                <input
                  className="brief-input"
                  value={draft.proof.cost}
                  onChange={(e) => setProof("cost", e.target.value)}
                />
              </Field>
              <Field label="Who does it" hint="one office manager">
                <input
                  className="brief-input"
                  value={draft.proof.who}
                  onChange={(e) => setProof("who", e.target.value)}
                />
              </Field>
              <Field label="The client" hint="14-person plumbing firm">
                <input
                  className="brief-input"
                  value={draft.proof.client}
                  onChange={(e) => setProof("client", e.target.value)}
                />
              </Field>
              <Field label="How long the fix took" hint="9 days">
                <input
                  className="brief-input"
                  value={draft.proof.took}
                  onChange={(e) => setProof("took", e.target.value)}
                />
              </Field>
            </div>
          </div>
        )}

        <footer className="brief-foot">
          {step === 1 ? (
            <>
              <p className="mono-label">Next · the numbers behind the captions</p>
              <button type="submit" className="pill-cta">
                <span className="fill" />
                <span>Continue</span>
                <span className="arrow">→</span>
              </button>
            </>
          ) : (
            <>
              <button type="button" className="chip" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button type="submit" className="pill-cta">
                <span className="fill" />
                <span>Generate the pack</span>
                <span className="arrow">→</span>
              </button>
            </>
          )}
        </footer>
      </form>
    </div>,
    document.body,
  );
}

/* `group` swaps the <label> for a role="group". A label wrapping several
   buttons hands its whole text to every one of them, so the platform chips end
   up announced as "Platform TikTok Facebook LinkedIn YouTube" instead of their
   own names. Labels are for one control. */
function Field({
  label,
  hint,
  wide = false,
  group = false,
  children,
}: {
  label: string;
  hint?: string;
  wide?: boolean;
  group?: boolean;
  children: React.ReactNode;
}) {
  const className = `brief-field ${wide ? "brief-field--wide" : ""}`;
  /* Label and hint are separate children rather than one run of text: the
     caption is a flex line, so a hint too long for the column drops whole
     instead of breaking mid-phrase after "clothing". */
  const caption = (
    <span className="mono-label">
      <span>{label}</span>
      {hint ? <span className="brief-hint">· {hint}</span> : null}
    </span>
  );

  if (group) {
    return (
      <div className={className} role="group" aria-label={label}>
        {caption}
        {children}
      </div>
    );
  }
  return (
    <label className={className}>
      {caption}
      {children}
    </label>
  );
}
