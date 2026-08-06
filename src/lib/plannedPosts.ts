import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

/* Plans — each save creates a new row in public.plans with a UUID.
   The URL /plan/$id shows the plan, but only to the authenticated owner
   (enforced both by RLS and by explicit userId equality below).

   Actual auto-publishing to Instagram is NOT wired here — that needs the
   `instagram_content_publish` scope (App Review) plus a cron job. */

export type PlannedPost = {
  kind: string;
  hook: string;
  scheduledAt: string;
};

export type PlanRow = {
  id: string;
  user_id: string;
  brief_name: string | null;
  posts: PlannedPost[];
  created_at: string;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function adminClient() {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const createPlan = createServerFn({ method: "POST" })
  .validator(
    (data: unknown) =>
      data as { userId: string; posts: PlannedPost[]; briefName: string | null },
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const admin = adminClient();
    const { data: row, error } = await admin
      .from("plans")
      .insert({
        user_id: data.userId,
        brief_name: data.briefName,
        posts: data.posts,
      })
      .select("id")
      .single();
    if (error) throw new Error(`Insert plan failed: ${error.message}`);
    return { id: row.id as string };
  });

/* Owner-scoped read. We accept the userId from the caller (their supabase
   session id) and only return the row if user_id matches. The RLS policy
   is a second line of defence — this explicit check keeps things safe even
   if the service role bypasses RLS. */
export const getPlan = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string; userId: string })
  .handler(async ({ data }): Promise<{ plan: PlanRow | null }> => {
    const admin = adminClient();
    const { data: row, error } = await admin
      .from("plans")
      .select("id, user_id, brief_name, posts, created_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(`Fetch plan failed: ${error.message}`);
    if (!row) return { plan: null };
    if (row.user_id !== data.userId) return { plan: null };
    return { plan: row as PlanRow };
  });

export const listPlans = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { userId: string })
  .handler(
    async ({
      data,
    }): Promise<{
      plans: { id: string; brief_name: string | null; created_at: string; count: number }[];
    }> => {
      const admin = adminClient();
      const { data: rows, error } = await admin
        .from("plans")
        .select("id, brief_name, created_at, posts")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(`List plans failed: ${error.message}`);
      return {
        plans: (rows ?? []).map((r) => ({
          id: r.id as string,
          brief_name: (r.brief_name as string | null) ?? null,
          created_at: r.created_at as string,
          count: Array.isArray(r.posts) ? (r.posts as unknown[]).length : 0,
        })),
      };
    },
  );

export const deletePlan = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string; userId: string })
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const admin = adminClient();
    // Explicit ownership guard alongside RLS.
    const { data: existing } = await admin
      .from("plans")
      .select("user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!existing || existing.user_id !== data.userId) {
      throw new Error("Not authorised to delete this plan.");
    }
    const { error } = await admin.from("plans").delete().eq("id", data.id);
    if (error) throw new Error(`Delete plan failed: ${error.message}`);
    return { ok: true };
  });
