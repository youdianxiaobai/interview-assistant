"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InterviewMode } from "@/types";
import { MessageCircle, Lightbulb, Target, Swords } from "lucide-react";

const modeLabels: Record<InterviewMode, string> = {
  practice: "练习",
  coach: "教练",
  mock: "模拟",
  challenge: "挑战",
};

const modeIcons: Record<InterviewMode, React.ComponentType<{ className?: string }>> = {
  practice: Target,
  coach: Lightbulb,
  mock: MessageCircle,
  challenge: Swords,
};

interface QuestionDisplayProps {
  question: string;
  questionNumber: number;
  totalQuestions: number;
  mode: InterviewMode;
}

export function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  mode,
}: QuestionDisplayProps) {
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    setAnimateKey((k) => k + 1);
  }, [question]);

  const ModeIcon = modeIcons[mode];

  return (
    <Card
      key={animateKey}
      className={cn(
        "border-border/40 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300"
      )}
    >
      <CardContent className="pt-6">
        {/* Header row: question number + mode badge */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">
            第 {questionNumber}/{totalQuestions} 题
          </span>
          <Badge
            variant="secondary"
            className="flex items-center gap-1.5 text-xs font-medium"
          >
            <ModeIcon className="h-3.5 w-3.5" />
            {modeLabels[mode]}
          </Badge>
        </div>

        {/* Question text */}
        <p className="text-lg font-medium text-foreground leading-relaxed">
          {question}
        </p>
      </CardContent>
    </Card>
  );
}
