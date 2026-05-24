"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { AIFeedback } from "@/types";
import { cn } from "@/lib/utils";
import {
  Star,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface FeedbackPanelProps {
  feedback: AIFeedback;
  onNext: () => void;
}

function scoreColor(score: number): string {
  if (score >= 8) return "text-success";
  if (score >= 6) return "text-warning";
  return "text-destructive";
}

function scoreBgColor(score: number): string {
  if (score >= 8) return "bg-success/10";
  if (score >= 6) return "bg-warning/10";
  return "bg-destructive/10";
}

export function FeedbackPanel({ feedback, onNext }: FeedbackPanelProps) {
  const [showReference, setShowReference] = useState(false);
  const overallScore = feedback.score;

  return (
    <Card className="border-border/40 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-accent" />
          <span className="font-display text-xl">答题反馈</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall score - prominent display */}
        <div className="flex items-center justify-center py-5">
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-full w-36 h-36 shadow-lg",
              scoreBgColor(overallScore),
              "border-4",
              overallScore >= 8 ? "border-emerald-300 dark:border-emerald-600" :
              overallScore >= 6 ? "border-amber-300 dark:border-amber-600" :
              "border-red-300 dark:border-red-600"
            )}
          >
            <span
              className={cn(
                "text-5xl font-bold font-display leading-none",
                scoreColor(overallScore)
              )}
            >
              {overallScore}
            </span>
            <span className="text-sm text-muted-foreground mt-1 font-medium">/ 10 分</span>
            <Star
              className={cn("h-5 w-5 mt-1", scoreColor(overallScore))}
              fill="currentColor"
            />
          </div>
        </div>
        {/* Quick score label */}
        <div className="text-center -mt-2">
          <Badge variant={overallScore >= 8 ? "default" : overallScore >= 6 ? "secondary" : "destructive"} className="rounded-lg text-sm px-4 py-1">
            {overallScore >= 8 ? "优秀" : overallScore >= 6 ? "良好" : "需改进"}
          </Badge>
        </div>

        {/* Dimension breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">评分维度</h4>
          {feedback.dimensions.map((dim) => (
            <div key={dim.name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {dim.name}
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    scoreColor(dim.score)
                  )}
                >
                  {dim.score}/10
                </span>
              </div>
              <Progress
                value={dim.score * 10}
                className="h-2"
              />
              {dim.comment && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {dim.comment}
                </p>
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Overall comment */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">综合评价</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {feedback.comment}
          </p>
        </div>

        <Separator />

        {/* Reference answer — expandable */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowReference(!showReference)}
            className="flex items-center justify-between w-full text-left group"
          >
            <h4 className="text-sm font-semibold text-foreground">
              参考答案
            </h4>
            <span
              className={cn(
                "text-muted-foreground transition-transform duration-200",
                "group-hover:text-foreground"
              )}
            >
              {showReference ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </span>
          </button>
          {showReference && (
            <div className="p-4 rounded-xl bg-muted/60 border border-border/30 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {feedback.reference_answer}
              </p>
            </div>
          )}
        </div>

        {/* Predicted follow-ups */}
        {feedback.predicted_followups.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                可能的追问
              </h4>
              <div className="flex flex-wrap gap-2">
                {feedback.predicted_followups.map((followup, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={cn(
                      "text-xs font-normal py-1 px-3",
                      "border-border/60 bg-card hover:bg-muted/30",
                      "transition-all duration-200"
                    )}
                  >
                    {followup}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Next button */}
        <Button
          onClick={onNext}
          className="w-full rounded-xl font-medium shadow-sm transition-all duration-200"
          size="lg"
        >
          下一题
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
