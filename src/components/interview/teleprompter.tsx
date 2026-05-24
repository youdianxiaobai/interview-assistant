"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInterviewStore } from "@/lib/store/interview-store";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Extract key points from a question string by splitting on common
 * Chinese sentence delimiters and filtering out short/empty segments.
 */
function extractKeyPoints(text: string): string[] {
  if (!text?.trim()) return [];

  return text
    .split(/[，。！？；、\n,;!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

export function Teleprompter() {
  const [show, setShow] = useState(false);
  const session = useInterviewStore((s) => s.session);

  const currentQuestion = session?.questions[session.currentQuestionIndex];

  const keyPoints = useMemo(
    () => (currentQuestion ? extractKeyPoints(currentQuestion.text) : []),
    [currentQuestion]
  );

  // Don't render if there's no active session
  if (!session || session.phase === "finished") return null;

  return (
    <div className="relative">
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShow(!show)}
        className={cn(
          "text-muted-foreground hover:text-foreground transition-all duration-200",
          show && "text-foreground bg-muted/50"
        )}
      >
        {show ? (
          <EyeOff className="h-4 w-4 mr-1.5" />
        ) : (
          <Eye className="h-4 w-4 mr-1.5" />
        )}
        {show ? "隐藏提词" : "提词器"}
        {show ? (
          <ChevronUp className="h-3 w-3 ml-1" />
        ) : (
          <ChevronDown className="h-3 w-3 ml-1" />
        )}
      </Button>

      {/* Key points card */}
      {show && keyPoints.length > 0 && (
        <Card
          className={cn(
            "mt-2 animate-in fade-in slide-in-from-top-2 duration-200",
            "border-border/40 shadow-sm"
          )}
        >
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              本题要点提示
            </p>
            <div className="flex flex-wrap gap-2">
              {keyPoints.map((point, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className={cn(
                    "text-xs font-normal py-1 px-2.5",
                    "bg-accent/10 text-foreground border-accent/20",
                    "transition-all duration-200"
                  )}
                >
                  {point}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
