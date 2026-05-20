"use client";

import type { Question } from "@/types";
import { QuestionCard } from "./question-card";
import { Skeleton } from "@/components/ui/skeleton";

export function QuestionList({
  questions,
  isLoading,
}: {
  questions: Question[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        还没有题目
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <QuestionCard key={q.id} question={q} />
      ))}
    </div>
  );
}
