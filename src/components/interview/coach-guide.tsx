"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

export function CoachGuide({ guidance, onRetry }: { guidance: string; onRetry: () => void }) {
  return (
    <Card className="border-blue-200">
      <CardContent className="pt-6 space-y-4">
        <div className="prose prose-sm max-w-none"><ReactMarkdown>{guidance}</ReactMarkdown></div>
        <Button onClick={onRetry}>我准备好了，重新回答</Button>
      </CardContent>
    </Card>
  );
}
