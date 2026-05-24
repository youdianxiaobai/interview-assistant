"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { fetchQuestions } from "@/lib/supabase/queries/questions";
import { QuestionList } from "@/components/question-bank/question-list";
import { QuestionForm } from "@/components/question-bank/question-form";
import { BatchGenerateDialog } from "@/components/question-bank/batch-generate-dialog";
import { CardListSkeleton } from "@/components/skeletons";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookX, Library, Share2, BookOpen } from "lucide-react";
import Link from "next/link";

export default function QuestionBankPage() {
  const { currentUserId } = useUserStore();

  const { data: questions, isLoading } = useQuery({
    queryKey: ["questions", currentUserId],
    queryFn: () => fetchQuestions(currentUserId!),
    enabled: !!currentUserId,
  });

  const techQuestions = (questions ?? []).filter((q) => q.type === "tech");
  const behavioralQuestions = (questions ?? []).filter((q) => q.type === "behavioral");

  // Full-page loading — show AppShell with skeleton
  if (isLoading) {
    return (
      <AppShell>
        <div className="page-container animate-fade-in">
          <div className="section-header">
            <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
              题库
            </h1>
          </div>
          <CardListSkeleton count={5} />
        </div>
      </AppShell>
    );
  }

  // Empty state — still show header with add button
  if (!questions || questions.length === 0) {
    return (
      <AppShell>
        <div className="page-container animate-fade-in">
          <div className="section-header">
            <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
              题库
            </h1>
            <div className="flex items-center gap-2">
              <Link href="/question-bank/wrong">
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                  <BookX className="w-4 h-4" />
                  错题集
                </Button>
              </Link>
              <Link href="/question-bank/knowledge">
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                  <Library className="w-4 h-4" />
                  知识点库
                </Button>
              </Link>
              <Link href="/question-bank/shared">
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                  <Share2 className="w-4 h-4" />
                  共享题库
                </Button>
              </Link>
              <QuestionForm />
              <BatchGenerateDialog />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <div className="w-20 h-20 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
              <BookOpen className="w-9 h-9 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-medium text-foreground/60">还没有题目</p>
            <p className="text-sm text-muted-foreground/60 mt-1.5 max-w-xs text-center">
              点击「添加题目」手动录入，或「批量生成」让 AI 帮你出题
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-container animate-fade-in">
        {/* Header */}
        <div className="section-header">
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
            题库
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/question-bank/wrong">
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                <BookX className="w-4 h-4" />
                错题集
              </Button>
            </Link>
            <Link href="/question-bank/knowledge">
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Library className="w-4 h-4" />
                知识点库
              </Button>
            </Link>
            <Link href="/question-bank/shared">
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Share2 className="w-4 h-4" />
                共享题库
              </Button>
            </Link>
            <QuestionForm />
            <BatchGenerateDialog />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList className="rounded-xl">
            <TabsTrigger value="all" className="rounded-lg">
              全部
              <span className="ml-1.5 text-xs text-muted-foreground">
                {questions.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="tech" className="rounded-lg">
              技术面
              <span className="ml-1.5 text-xs text-muted-foreground">
                {techQuestions.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="behavioral" className="rounded-lg">
              行为面
              <span className="ml-1.5 text-xs text-muted-foreground">
                {behavioralQuestions.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <QuestionList questions={questions} isLoading={false} />
          </TabsContent>
          <TabsContent value="tech" className="mt-4">
            <QuestionList questions={techQuestions} isLoading={false} />
          </TabsContent>
          <TabsContent value="behavioral" className="mt-4">
            <QuestionList questions={behavioralQuestions} isLoading={false} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
