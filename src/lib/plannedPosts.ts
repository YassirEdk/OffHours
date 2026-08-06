import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

/* Planned posts — dates the user has scheduled for each of the five ideas
   in a pack. Persisted to Supabase user_metadata.plannedPosts so it survives
   sign-outs and browser reloads.

   Actual auto-publishing to Instagram is NOT wired here — that needs the
   `instagram_content_publish` scope (App Review) plus a cron job that runs
   at each scheduled time. This just stores the plan; users can copy the
   caption + image to Instagram manually until the auto-publish half ships. */

export type PlannedPost = {
  /** Idea kind — proof, opinion, build, series, receipt. */
  kind: string;
  /** The hook — helps the user remember which post this is. */
  hook: string;
  /** ISO datetime string, e.g. "2026-08-10T18:00:00.000Z". */
  scheduledAt: string;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const savePlannedPosts = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { userId: string; posts: PlannedPost[] })
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: current, error: getErr } = await admin.auth.admin.getUserById(data.userId);
    if (getErr) throw new Error(`Supabase getUser failed: ${getErr.message}`);
    const nextMeta = {
      ...(current.user?.user_metadata ?? {}),
      plannedPosts: data.posts,
      plannedPostsSavedAt: Date.now(),
    };
    const { error: updErr } = await admin.auth.admin.updateUserById(data.userId, {
      user_metadata: nextMeta,
    });
    if (updErr) throw new Error(`Supabase updateUser failed: ${updErr.message}`);
    return { ok: true };
  });
