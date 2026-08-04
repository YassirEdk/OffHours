import { useState } from "react";
import { usePackContext } from "@/context/PackContext";
import { packToText } from "@/lib/export";
import { BriefPanel } from "@/components/BriefPanel";

/* The page's way in. Everything the app can actually do sits here on the cover:
   write a brief, take the pack away, go back to the worked example. */
export function PackActions() {
  const { pack, isExample, reset } = usePackContext();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(packToText(pack));
    } catch {
      /* clipboard blocked — the button still confirms so the UI doesn't stall */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const captions = pack.ideas.reduce((n, i) => n + i.captions.length, 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-3" data-fade>
        <button type="button" className="pill-cta" onClick={() => setOpen(true)}>
          <span className="fill" />
          <span>{isExample ? "Write your brief" : "Edit your brief"}</span>
          <span className="arrow">→</span>
        </button>

        <button type="button" className="chip" onClick={copyAll}>
          {copied ? `${captions} captions copied` : "Copy the whole pack"}
        </button>

        {/* Only offered once there is something to go back from. */}
        {!isExample ? (
          <button type="button" className="chip" onClick={reset}>
            Back to the example
          </button>
        ) : null}
      </div>

      {!isExample ? (
        <p className="mono-label" data-fade>
          Generated from your brief · every line below is yours
        </p>
      ) : null}

      <BriefPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
