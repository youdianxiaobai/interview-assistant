"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AIFeedback } from "@/types";

export function FeedbackPanel({ feedback, onNext }: { feedback: AIFeedback; onNext: () => void }) {
  return (
    <Card className="border-green-200">
      <CardHeader><CardTitle className="flex items-center gap-2">答题反馈 <Badge className="text-lg">{feedback.score}/10</Badge></CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {feedback.dimensions.map((d) => (
          <div key={d.name} className="flex items-center justify-between">
            <span className="text-sm">{d.name}</span>
            <div className="flex items-center gap-2"><span className="text-sm font-medium">{d.score}/10</span><span className="text-xs text-muted-foreground">{d.comment}</span></div>
          </div>
        ))}
        <div className="p-3 bg-muted rounded-md"><p className="text-sm font-medium mb-1">总评</p><p className="text-sm">{feedback.comment}</p></div>
        <div className="p-3 bg-muted rounded-md"><p className="text-sm font-medium mb-1">参考答案</p><p className="text-sm">{feedback.reference_answer}</p></div>
        {feedback.predicted_followups.length > 0 && (
          <div><p className="text-sm font-medium mb-1">可能追问</p><ul className="list-disc pl-4 text-sm space-y-1">{feedback.predicted_followups.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
        )}
        <Button onClick={onNext} className="w-full">下一题</Button>
      </CardContent>
    </Card>
  );
}
