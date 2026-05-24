import { supabase } from "@/lib/supabase/client";
import type { Interview, InterviewQA } from "@/types";

export async function createInterview(i: { user_id: string; mode: string; position: string; type: string; language: string; score?: any; duration?: number; recording_url?: string }): Promise<Interview> {
  const { data } = await supabase.from("interviews").insert(i).select().single();
  return data!;
}

export async function saveQA(qa: { interview_id: string; question_id?: string | null; question_text: string; user_answer_text: string; user_answer_audio_url?: string; ai_feedback?: any; score_breakdown?: any; followup_depth?: number; is_weak?: boolean }): Promise<void> {
  await supabase.from("interview_qa").insert(qa);
}

export async function fetchInterview(id: string): Promise<Interview | null> {
  const { data } = await supabase.from("interviews").select("*").eq("id", id).single();
  return data;
}

export async function fetchHistory(userId: string): Promise<Interview[]> {
  const { data } = await supabase.from("interviews").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function fetchInterviewQAs(interviewId: string): Promise<InterviewQA[]> {
  const { data } = await supabase
    .from("interview_qa")
    .select("*")
    .eq("interview_id", interviewId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function updateInterview(id: string, u: Partial<Interview>) {
  await supabase.from("interviews").update(u).eq("id", id);
}
