import { Card, CardContent } from "@/components/ui/card";
export function QuestionDisplay({ question }: { question: string }) {
  return <Card className="border-primary/50"><CardContent className="pt-6"><p className="text-lg font-medium">{question}</p></CardContent></Card>;
}
