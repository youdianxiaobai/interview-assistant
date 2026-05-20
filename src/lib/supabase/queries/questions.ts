import { supabase } from "@/lib/supabase/client";
import type { Question, QuestionType, QuestionDifficulty } from "@/types";

export async function fetchQuestions(userId: string): Promise<Question[]> {
  const { data } = await supabase
    .from("questions")
    .select("*")
    .eq("user_id", userId)
    .eq("enabled", true)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function fetchQuestionsByPosition(
  userId: string,
  position: string
): Promise<Question[]> {
  const { data } = await supabase
    .from("questions")
    .select("*")
    .eq("user_id", userId)
    .eq("position", position)
    .eq("enabled", true);
  return data ?? [];
}

export async function createQuestion(q: {
  user_id: string;
  position: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  source: string;
  content: string;
  reference_answer: string;
  tags: string[];
}): Promise<Question> {
  const { data } = await supabase.from("questions").insert(q).select().single();
  return data!;
}

export async function updateQuestion(
  id: string,
  u: Partial<Question>
): Promise<void> {
  await supabase.from("questions").update(u).eq("id", id);
}

export async function deleteQuestion(id: string): Promise<void> {
  await supabase.from("questions").delete().eq("id", id);
}

export async function toggleFavorite(
  id: string,
  v: boolean
): Promise<void> {
  await supabase.from("questions").update({ is_favorite: v }).eq("id", id);
}
