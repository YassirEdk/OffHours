import { createFileRoute } from "@tanstack/react-router";
import { ContentPack } from "@/components/ContentPack";

/* `/` — the hand-written Offhours example. The generated results live at
   `/pack?brief=...`; both routes render the same ContentPack, which reads its
   pack from PackContext (URL param → generated pack, or the default example). */
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
