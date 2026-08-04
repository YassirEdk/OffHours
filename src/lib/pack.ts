/* The app's data model.

   A ContentPack is the whole deliverable the page renders: the brief that was
   answered, and five post ideas, each with three captions and its own hashtag
   set. Everything the page shows as *content* comes from here — the design
   (sections, type, the ink film, the designed deck) stays in the route.

   The split matters: swapping the generator, or one day swapping it for a model
   call, changes nothing downstream as long as it returns this shape. */

export type Platform = "instagram" | "tiktok" | "facebook" | "linkedin" | "youtube";

export type Goal = "saves" | "engagement" | "awareness" | "sales" | "followers";

/** What a post is asking the viewer to do. These four are the only asks that
    move reach on Instagram and TikTok, which is why the CTA of every caption
    resolves to one of them. */
export type Ask = "save" | "share" | "comment" | "follow";

export type Caption = {
  /** Line one of the caption, and the first two seconds of a video. Held apart
      from the body because it does its own job and has to work with everything
      below it collapsed behind "more". */
  hook: string;
  body: string;
  cta: string;
  ask: Ask;
  /** Set when the three variants are meant as three distinct posts rather than
      three ways of writing the same one — the standing series works that way,
      one carousel, one story set, one grid drop. */
  variant?: { label: string; title: string; format: string };
};

/** The five archetypes a working small-business feed rotates through. Named so
    the generator, the page and anyone reading a pack all use one vocabulary. */
export type IdeaKind = "proof" | "opinion" | "build" | "series" | "receipt";

export type Idea = {
  kind: IdeaKind;
  /** Short internal name — "The four-hour invoice". */
  title: string;
  /** One line on why this post works, shown as section copy. */
  premise: string;
  /** Production note: "Reel + TikTok · 22 sec · screen recording". */
  format: string;
  /** Exactly three, so the page can offer A / B / C. */
  captions: [Caption, Caption, Caption];
  /** 10–15, no duplicates within the set. */
  hashtags: string[];
};

export type Brief = {
  /** Trading name, used for the wordmark and the sign-off. */
  name: string;
  /** What the business is — "AI automation", "bakery", "gym". */
  business: string;
  /** What it does for people, in one verb phrase. Feeds body copy. */
  promise: string;
  audience: string;
  platforms: Platform[];
  goal: Goal;
  /** Two or three words: "fast", "plain", "anti-hype". */
  tone: string[];
  /** Seeds the hashtag sets. "automation", "sourdough", "strength training". */
  niche: string;
  /** The raw material a generator cannot invent. A pack without real numbers
      produces the exact "Unlock the Power of AI" post the page argues against,
      so these are part of the brief rather than something to make up. */
  proof: {
    /** The manual task being replaced: "sending one invoice". */
    task: string;
    /** How long it takes today: "4 hours 11 minutes". */
    before: string;
    /** What it costs, in money: "£2,400 a month". */
    cost: string;
    /** Who does it: "one office manager". */
    who: string;
    /** The client, unnamed but specific: "14-person plumbing firm". */
    client: string;
    /** How long the fix took: "9 days". */
    took: string;
  };
};

export type ContentPack = {
  brief: Brief;
  /** Five, in the order the page presents them. */
  ideas: Idea[];
  /** The posting rhythm — three a week beats seven. */
  cadence: { day: string; idea: string }[];
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

export const GOAL_LABEL: Record<Goal, string> = {
  saves: "Saves, shares, followers",
  engagement: "Comments and replies",
  awareness: "Reach and brand recall",
  sales: "Enquiries and bookings",
  followers: "Follower growth",
};

export function ideaByKind(pack: ContentPack, kind: IdeaKind): Idea {
  const found = pack.ideas.find((i) => i.kind === kind);
  if (!found) throw new Error(`pack is missing its "${kind}" idea`);
  return found;
}
