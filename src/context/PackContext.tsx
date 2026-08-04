import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Brief, ContentPack } from "@/lib/pack";
import { generatePack } from "@/lib/generate";
import { OFFHOURS_PACK } from "@/lib/offhours";
import { paramToBrief } from "@/lib/briefUrl";
import { generatePackAi } from "@/lib/generateAi";

/* Holds the brief and the pack it produces.

   Two generators:
   - The deterministic one (lib/generate) — used as an immediate placeholder
     and as the fallback if the AI call fails.
   - Grok (lib/generateAi) — the real content, fetched async. While it runs,
     `status === "generating"` so the UI can show a loading state instead of
     the placeholder text.

   The Offhours example is used when no brief is set. Calling setBrief moves
   the app into "generated" mode; reset() goes back to the example. */

type Status = "idle" | "generating" | "ready" | "error";

type PackContextValue = {
  brief: Brief;
  pack: ContentPack;
  /** True while showing the hand-written example rather than generated output. */
  isExample: boolean;
  /** UI-visible generation state — for spinners and error banners on /pack. */
  status: Status;
  /** Populated when status === "error"; cleared on the next setBrief. */
  error: string | null;
  setBrief: (brief: Brief) => void;
  /** Edit part of the brief and regenerate — for a form that updates per field. */
  updateBrief: (patch: Partial<Brief>) => void;
  reset: () => void;
};

const PackContext = createContext<PackContextValue | null>(null);

export function PackProvider({
  children,
  initialPack = OFFHOURS_PACK,
}: {
  children: ReactNode;
  /** Override for tests, or to boot straight into a generated pack. */
  initialPack?: ContentPack;
}) {
  const [brief, setBriefState] = useState<Brief | null>(null);
  const [aiPack, setAiPack] = useState<ContentPack | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  /* Every setBrief run gets a token; late responses check theirs against the
     current one and drop their result if the brief has moved on. Prevents a
     slow earlier call from clobbering a faster later one. */
  const runToken = useRef(0);

  const generate = useCallback(async (nextBrief: Brief) => {
    const token = ++runToken.current;
    setStatus("generating");
    setError(null);
    setAiPack(null);
    try {
      const pack = await generatePackAi({ data: nextBrief });
      if (runToken.current !== token) return;
      setAiPack(pack);
      setStatus("ready");
    } catch (err) {
      if (runToken.current !== token) return;
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, []);

  const setBrief = useCallback(
    (nextBrief: Brief) => {
      setBriefState(nextBrief);
      void generate(nextBrief);
    },
    [generate],
  );

  const updateBrief = useCallback(
    (patch: Partial<Brief>) => {
      setBriefState((current) => {
        const merged = { ...(current ?? initialPack.brief), ...patch };
        void generate(merged);
        return merged;
      });
    },
    [initialPack, generate],
  );

  const reset = useCallback(() => {
    runToken.current++;
    setBriefState(null);
    setAiPack(null);
    setStatus("idle");
    setError(null);
  }, []);

  /* If the tab was opened with ?brief=..., decode and generate.
     Applied in an effect so SSR and the first client render agree on the
     example pack; the swap happens on hydration. */
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("brief");
    if (!param) return;
    const parsed = paramToBrief(param);
    if (parsed) {
      setBriefState(parsed);
      void generate(parsed);
    }
  }, [generate]);

  const value = useMemo<PackContextValue>(() => {
    const effectiveBrief = brief ?? initialPack.brief;
    /* Pick the pack: the AI result when ready, the deterministic fallback
       while it's still generating (so the page has real text to render), the
       hand-written example when there's no brief at all. */
    let effectivePack: ContentPack;
    if (aiPack && status === "ready") effectivePack = aiPack;
    else if (brief) effectivePack = generatePack(brief);
    else effectivePack = initialPack;

    return {
      brief: effectiveBrief,
      pack: effectivePack,
      isExample: brief === null,
      status,
      error,
      setBrief,
      updateBrief,
      reset,
    };
  }, [brief, aiPack, status, error, initialPack, setBrief, updateBrief, reset]);

  return <PackContext.Provider value={value}>{children}</PackContext.Provider>;
}

export function usePack(): ContentPack {
  return usePackContext().pack;
}

export function useBrief(): Brief {
  return usePackContext().brief;
}

export function usePackContext(): PackContextValue {
  const ctx = useContext(PackContext);
  if (!ctx) throw new Error("usePack must be used inside <PackProvider>");
  return ctx;
}
