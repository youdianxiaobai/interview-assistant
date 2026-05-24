import { supabase } from "@/lib/supabase/client";
import type { Resume, ResumeContent } from "@/types";

export async function fetchResumes(userId: string): Promise<Resume[]> {
  const { data } = await supabase.from("resumes").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
  return data ?? [];
}

export async function createResume(r: { user_id: string; version_name: string; target_position: string; content: ResumeContent }): Promise<Resume> {
  const { data } = await supabase.from("resumes").insert(r).select().single();
  return data!;
}

export async function updateResume(id: string, u: { version_name?: string; target_position?: string; content?: ResumeContent; is_current?: boolean }) {
  await supabase.from("resumes").update({ ...u, updated_at: new Date().toISOString() }).eq("id", id);
}

export async function setCurrentResume(userId: string, resumeId: string) {
  await supabase.from("resumes").update({ is_current: false }).eq("user_id", userId).neq("id", resumeId);
  await supabase.from("resumes").update({ is_current: true }).eq("id", resumeId);
}

export async function fetchLatestAnalysis(resumeId: string) {
  const { data } = await supabase
    .from("resume_analyses")
    .select("*")
    .eq("resume_id", resumeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function saveAnalysis(a: { resume_id: string; user_id: string; position_target: string; match_score: number; strength_points: string[]; risk_points: string[]; predicted_questions: string[] }) {
  // Upsert: delete old analysis for this resume, then insert new one
  await supabase.from("resume_analyses").delete().eq("resume_id", a.resume_id);
  const { data } = await supabase.from("resume_analyses").insert(a).select().single();
  return data!;
}
