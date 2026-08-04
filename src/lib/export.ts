import type { ContentPack } from "@/lib/pack";
import { PLATFORM_LABEL } from "@/lib/pack";

/* Plain text, because the destination is the Instagram composer or a notes app,
   not another program. Each caption comes out in posting order — hook, body,
   CTA, tags — so a block can be pasted straight in without being reassembled. */
export function packToText(pack: ContentPack): string {
  const { brief } = pack;
  const lines: string[] = [
    `${brief.name} — ${brief.business}`,
    `${brief.audience} · ${brief.platforms.map((p) => PLATFORM_LABEL[p]).join(" + ")}`,
    `Tone: ${brief.tone.join(", ")}`,
    "",
    `${pack.ideas.length} ideas · ${pack.ideas.reduce((n, i) => n + i.captions.length, 0)} captions`,
    "",
  ];

  pack.ideas.forEach((idea, i) => {
    lines.push("=".repeat(60));
    lines.push(`${String(i + 1).padStart(2, "0")}. ${idea.title.toUpperCase()}`);
    lines.push(idea.format);
    lines.push("");
    idea.captions.forEach((cap, c) => {
      const letter = String.fromCharCode(65 + c);
      lines.push(`-- Caption ${letter}${cap.variant ? ` · ${cap.variant.format}` : ""} --`);
      lines.push(cap.hook);
      lines.push("");
      lines.push(cap.body);
      lines.push("");
      lines.push(cap.cta);
      lines.push("");
    });
    lines.push(idea.hashtags.join(" "));
    lines.push("");
  });

  lines.push("=".repeat(60));
  lines.push("THE WEEK");
  pack.cadence.forEach((c) => lines.push(`${c.day.padEnd(10)} ${c.idea}`));

  return lines.join("\n");
}
