"use client";

import { useState } from "react";
import type { Question } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFavorite } from "@/lib/supabase/queries/questions";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

const difficultyLabels: Record<string, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

export function QuestionCard({ question }: { question: Question }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{question.position}</Badge>
              <Badge variant="outline">
                {question.type === "tech" ? "技术面" : "行为面"}
              </Badge>
              <Badge className={difficultyColors[question.difficulty]}>
                {difficultyLabels[question.difficulty]}
              </Badge>
              <Badge variant="secondary">{question.source}</Badge>
            </div>
            <p className="font-medium">{question.content}</p>
            {expanded && question.reference_answer && (
              <div className="mt-3 p-3 bg-muted rounded-md text-sm prose prose-sm max-w-none">
                <p className="font-medium mb-1 text-xs text-muted-foreground">
                  参考答案：
                </p>
                <ReactMarkdown>{question.reference_answer}</ReactMarkdown>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await toggleFavorite(question.id, !question.is_favorite);
                queryClient.invalidateQueries({ queryKey: ["questions"] });
              }}
            >
              <Star
                className={cn(
                  "w-4 h-4",
                  question.is_favorite && "fill-yellow-400 text-yellow-400"
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
