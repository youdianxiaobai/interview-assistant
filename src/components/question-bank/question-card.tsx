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

const difficultyConfig: Record<string, { label: string; className: string }> = {
  easy: { label: "简单", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  medium: { label: "中等", className: "bg-amber-100 text-amber-700 border-amber-200" },
  hard: { label: "困难", className: "bg-red-100 text-red-700 border-red-200" },
};

const sourceLabels: Record<string, string> = {
  preset: "预设",
  user: "用户",
  ai: "AI",
  resume: "简历",
};

export function QuestionCard({ question }: { question: Question }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const difficulty = difficultyConfig[question.difficulty] ?? difficultyConfig.medium;

  return (
    <Card className="rounded-2xl shadow-sm border border-border/40 bg-card card-hover animate-fade-in-scale">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="rounded-lg font-medium text-xs">
                {question.position}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-lg font-medium text-xs",
                  question.type === "tech"
                    ? "border-primary/30 text-primary"
                    : "border-accent/30 text-accent"
                )}
              >
                {question.type === "tech" ? "技术面" : "行为面"}
              </Badge>
              <Badge className={cn("rounded-lg font-medium text-xs border", difficulty.className)}>
                {difficulty.label}
              </Badge>
              <Badge variant="secondary" className="rounded-lg font-medium text-xs">
                {sourceLabels[question.source] ?? question.source}
              </Badge>
            </div>

            {/* Question content */}
            <p className="font-sans text-sm leading-relaxed text-foreground/85">
              {question.content}
            </p>

            {/* Expandable reference answer */}
            {expanded && question.reference_answer && (
              <div className="mt-2 p-4 bg-muted/60 rounded-xl border border-border/30">
                <p className="font-medium mb-2 text-xs text-muted-foreground tracking-wide uppercase">
                  参考答案
                </p>
                <div className="prose prose-sm max-w-none prose-headings:font-display prose-p:font-sans">
                  <ReactMarkdown>{question.reference_answer}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Expand toggle at bottom */}
            {question.reference_answer && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    收起答案
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    查看答案
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right-side actions */}
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-9 w-9"
              onClick={async () => {
                await toggleFavorite(question.id, !question.is_favorite);
                queryClient.invalidateQueries({ queryKey: ["questions"] });
              }}
            >
              <Star
                className={cn(
                  "w-4 h-4 transition-colors",
                  question.is_favorite
                    ? "fill-accent text-accent"
                    : "text-muted-foreground/50"
                )}
              />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
