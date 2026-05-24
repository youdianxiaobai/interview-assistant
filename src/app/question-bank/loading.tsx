import { CardListSkeleton } from "@/components/skeletons";

export default function QuestionBankLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
      <CardListSkeleton count={5} />
    </div>
  );
}
