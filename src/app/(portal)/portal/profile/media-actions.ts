"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

type Kind = "resume" | "audio";
const BUCKET: Record<Kind, string> = { resume: "resumes", audio: "audio" };
const COLUMN: Record<Kind, "resume_path" | "audio_path"> = { resume: "resume_path", audio: "audio_path" };

// After the browser uploads a file into the user's own private folder, point the profile at it
// and remove the file it replaces.
export async function setMedia(kind: Kind, path: string | null): Promise<{ ok: boolean; message?: string }> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, message: "Your session ended. Please log in again." };
  if (!(kind in BUCKET)) return { ok: false, message: "Unknown file type." };
  if (path !== null && !(path.startsWith(`${user.id}/`) && !path.includes(".."))) return { ok: false, message: "That file is not yours." };

  const { data: current } = await sb.from("seeker_profiles").select("resume_path, audio_path").eq("user_id", user.id).single();
  const old = current?.[COLUMN[kind]] as string | null | undefined;

  const { error } = await sb.from("seeker_profiles").update({ [COLUMN[kind]]: path, updated_at: new Date().toISOString() }).eq("user_id", user.id);
  if (error) return { ok: false, message: "We could not save this. Please try again." };
  if (old && old !== path) await sb.storage.from(BUCKET[kind]).remove([old]);
  revalidatePath("/portal/profile");
  return { ok: true };
}
