"use client";

import type { Question } from "@/types";
import { QuestionCard } from "./question-card";
import { CardListSkeleton } from "@/components/skeletons";
import { BookOpen } from "lucide-react";

export function QuestionList({
  questions,
  isLoading,
}: {
  questions: Question[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <CardListSkeleton count={5} />;
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
          <BookOpen className="w-7 h-7 text-muted-foreground/50" />
        </div>
        <p className="text-base font-medium text-foreground/60">还没有题目</p>
        <p className="text-sm text-muted-foreground/60 mt-1">点击「添加题目」开始录入面试题</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {questions.map((q) => (
        <QuestionCard key={q.id} question={q} />
      ))}
    </div>
  );
}
