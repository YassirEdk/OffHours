import { createFileRoute } from "@tanstack/react-router";
import { PackResults } from "@/components/PackResults";

/* /pack — the generated results page. Same view as `/`; the difference is the
   URL: PackContext reads `?brief=` on mount, so navigating here with an
   encoded brief boots straight into the generated pack. */
export const Route = createFileRoute("/pack")({
  head: () => ({
    meta: [
      { title: "Your pack — five posts, fifteen captions" },
      {
        name: "description",
        content:
          "Five post ideas and fifteen captions generated from your brief. Hooks, CTAs and hashtags written out.",
      },
      /* Not indexable — the URL carries the brief, which may name a real
         business the user hasn't chosen to publish. */
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PackResults,
});
