"use client";

import { AppShell } from "@/components/layout/app-shell";
import { SetupForm } from "@/components/interview/setup-form";

export default function NewInterviewPage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground">
            新建面试
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            选择面试模式和岗位，AI 将为你定制专属面试题目
          </p>
        </div>
        <SetupForm />
      </div>
    </AppShell>
  );
}
