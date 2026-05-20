import { supabase } from "@/lib/supabase/client";
import type { WrongQuestion, Question } from "@/types";

export async function fetchWrongQuestions(
  userId: string
): Promise<(WrongQuestion & { question: Question })[]> {
  const { data } = await supabase
    .from("wrong_questions")
    .select("*, question:questions(*)")
    .eq("user_id", userId)
    .eq("is_mastered", false)
    .order("last_wrong_at", { ascending: false });
  return (data ?? []) as any;
}

export async function updateWrongQuestion(
  id: string,
  u: {
    review_notes?: string;
    wrong_reason?: string;
    correct_approach?: string;
    is_mastered?: boolean;
    retry_count?: number;
  }
) {
  await supabase.from("wrong_questions").update(u).eq("id", id);
}

export async function addWrongQuestion(q: {
  user_id: string;
  question_id: string;
}) {
  await supabase.from("wrong_questions").insert(q);
}

export async function getWeakTags(
  userId: string
): Promise<{ tag: string; count: number }[]> {
  const { data } = await supabase
    .from("wrong_questions")
    .select("question:questions(tags)")
    .eq("user_id", userId);
  const m: Record<string, number> = {};
  (data as any)?.forEach((w: any) =>
    w.question?.tags?.forEach((t: string) => {
      m[t] = (m[t] || 0) + 1;
    })
  );
  return Object.entries(m)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
