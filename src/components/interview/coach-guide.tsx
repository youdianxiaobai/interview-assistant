"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Lightbulb, RefreshCw, HeartHandshake, SkipForward } from "lucide-react";

interface CoachGuideProps {
  guidance: string;
  onRetry: () => void;
  onSkip: () => void;
}

export function CoachGuide({ guidance, onRetry, onSkip }: CoachGuideProps) {
  return (
    <Card className="border-border/40 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
      <CardContent className="pt-6 space-y-5">
        {/* Encouraging header */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
            <Lightbulb className="h-5 w-5 text-accent" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground font-display">
              别着急，慢慢来
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              面试教练为你准备了一些思路提示，看看下面的建议再试一次吧
            </p>
          </div>
        </div>

        {/* Guidance text */}
        <div className="p-4 rounded-xl bg-muted/60 border border-border/30">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {guidance}
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            onClick={onRetry}
            className="w-full rounded-xl font-medium shadow-sm transition-all duration-200"
            size="lg"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重新回答
          </Button>
          <Button
            onClick={onSkip}
            variant="ghost"
            className="w-full rounded-xl font-medium text-muted-foreground hover:text-foreground transition-all duration-200"
            size="sm"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            跳过，进入下一题
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2">
          <HeartHandshake className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            准备好了就重新开始，或者跳过此题
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
