"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { fetchQuestions } from "@/lib/supabase/queries/questions";
import { QuestionList } from "@/components/question-bank/question-list";
import { QuestionForm } from "@/components/question-bank/question-form";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function QuestionBankPage() {
  const { currentUserId } = useUserStore();
  const { data: questions, isLoading } = useQuery({
    queryKey: ["questions", currentUserId],
    queryFn: () => fetchQuestions(currentUserId!),
    enabled: !!currentUserId,
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">题库</h2>
          <div className="flex gap-2">
            <Link href="/question-bank/wrong">
              <Button variant="outline">错题集</Button>
            </Link>
            <Link href="/question-bank/knowledge">
              <Button variant="outline">知识点库</Button>
            </Link>
            <Link href="/question-bank/shared">
              <Button variant="outline">共享题库</Button>
            </Link>
            <QuestionForm />
          </div>
        </div>
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="tech">技术面</TabsTrigger>
            <TabsTrigger value="behavioral">行为面</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <QuestionList
              questions={questions ?? []}
              isLoading={isLoading}
            />
          </TabsContent>
          <TabsContent value="tech">
            <QuestionList
              questions={
                (questions ?? []).filter((q) => q.type === "tech")
              }
              isLoading={isLoading}
            />
          </TabsContent>
          <TabsContent value="behavioral">
            <QuestionList
              questions={
                (questions ?? []).filter((q) => q.type === "behavioral")
              }
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
