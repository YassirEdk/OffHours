import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { ContentPack } from "@/lib/pack";

/* Saved packs — a full snapshot of a generated pack (captions + generated
   images) that the user has explicitly saved. URL: /pack/saved/$id,
   owner-only. Distinct from plans (which store a publishing schedule). */

export type SavedPack = {
  id: string;
  user_id: string;
  brief_name: string | null;
  pack: ContentPack;
  images: Record<string, string>;
  created_at: string;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function adminClient() {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const savePack = createServerFn({ method: "POST" })
  .validator(
    (data: unknown) =>
      data as {
        userId: string;
        briefName: string | null;
        pack: ContentPack;
        images: Record<string, string>;
      },
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const admin = adminClient();
    const { data: row, error } = await admin
      .from("saved_packs")
      .insert({
        user_id: data.userId,
        brief_name: data.briefName,
        pack: data.pack,
        images: data.images,
      })
      .select("id")
      .single();
    if (error) throw new Error(`Insert pack failed: ${error.message}`);
    return { id: row.id as string };
  });

/* Owner-scoped read. Returns null if the pack doesn't exist or belongs to
   a different user. */
export const getSavedPack = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string; userId: string })
  .handler(async ({ data }): Promise<{ pack: SavedPack | null }> => {
    const admin = adminClient();
    const { data: row, error } = await admin
      .from("saved_packs")
      .select("id, user_id, brief_name, pack, images, created_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(`Fetch pack failed: ${error.message}`);
    if (!row || row.user_id !== data.userId) return { pack: null };
    return { pack: row as SavedPack };
  });

/* Slim listing for the History tab — omits the heavy jsonb columns and
   just counts how many images were saved. */
export const listSavedPacks = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { userId: string })
  .handler(
    async ({
      data,
    }): Promise<{
      packs: {
        id: string;
        brief_name: string | null;
        created_at: string;
        imageCount: number;
      }[];
    }> => {
      const admin = adminClient();
      const { data: rows, error } = await admin
        .from("saved_packs")
        .select("id, brief_name, created_at, images")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(`List packs failed: ${error.message}`);
      return {
        packs: (rows ?? []).map((r) => ({
          id: r.id as string,
          brief_name: (r.brief_name as string | null) ?? null,
          created_at: r.created_at as string,
          imageCount:
            r.images && typeof r.images === "object"
              ? Object.keys(r.images as Record<string, unknown>).length
              : 0,
        })),
      };
    },
  );

export const deleteSavedPack = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string; userId: string })
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const admin = adminClient();
    const { data: existing } = await admin
      .from("saved_packs")
      .select("user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!existing || existing.user_id !== data.userId) {
      throw new Error("Not authorised to delete this pack.");
    }
    const { error } = await admin.from("saved_packs").delete().eq("id", data.id);
    if (error) throw new Error(`Delete pack failed: ${error.message}`);
    return { ok: true };
  });
