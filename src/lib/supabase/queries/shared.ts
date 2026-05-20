import { supabase } from "@/lib/supabase/client";
import type { SharedQuestion, Question } from "@/types";

export async function fetchShared(): Promise<(SharedQuestion & { question: Question })[]> {
  const { data } = await supabase.from("shared_questions").select("*, question:questions(*)").order("shared_at", { ascending: false });
  return (data ?? []) as any;
}

export async function shareQuestion(qid: string, uid: string) {
  await supabase.from("shared_questions").insert({ question_id: qid, from_user_id: uid });
}

export async function unshareQuestion(id: string) {
  await supabase.from("shared_questions").delete().eq("id", id);
}

export async function createChallenge(uid: string, qids: string[]): Promise<string> {
  const { data } = await supabase.from("challenge_sessions").insert({ challenger_id: uid, questions: qids }).select("id").single();
  return data!.id;
}
