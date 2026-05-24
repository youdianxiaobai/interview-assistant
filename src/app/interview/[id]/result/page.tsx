"use client";

import { useState, useEffect, startTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

import { useInterviewStore } from "@/lib/store/interview-store";
import { useUserStore } from "@/lib/store/user-store";
import { shareReview } from "@/lib/supabase/queries/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/utils";
import type { AIFeedback } from "@/types";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  Target,
  Zap,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Share2,
  Lightbulb,
} from "lucide-react";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MODE_LABEL: Record<string, string> = {
  practice: "练习模式",
  coach: "教练模式",
  mock: "模拟模式",
  challenge: "挑战模式",
};

function scoreBadgeVariant(score: number) {
  if (score >= 7) return "default";
  if (score >= 5) return "secondary";
  return "destructive";
}

function priorityBadgeVariant(priority: string) {
  if (priority === "high") return "destructive";
  if (priority === "medium") return "default";
  return "secondary";
}

function priorityLabel(priority: string) {
  if (priority === "high") return "优先";
  if (priority === "medium") return "建议";
  return "可选";
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ResultSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>

      <Skeleton className="h-48 rounded-2xl" />

      <div className="space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyResult({ onBack }: { onBack: () => void }) {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground mb-2">
          没有面试数据
        </h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          当前没有可展示的面试报告。请从面试历史中选择一条记录，或开始一场新的面试。
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="rounded-xl">
            返回首页
          </Button>
          <Button onClick={() => window.location.href = "/interview/new"} className="rounded-xl">
            开始新面试
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const session = useInterviewStore((s) => s.session);
  const finalReport = useInterviewStore((s) => s.finalReport);
  const profiles = useUserStore((s) => s.profiles);
  const router = useRouter();
  const reset = useInterviewStore((s) => s.reset);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Give Zustand store a moment to hydrate from parent / previous page
    const t = setTimeout(() => setHydrated(true), 100);
    return () => clearTimeout(t);
  }, []);

  // ---- Loading ----
  if (!hydrated) {
    return (
      <AppShell>
        <ResultSkeleton />
      </AppShell>
    );
  }

  // ---- Empty ----
  if (!session) {
    return <EmptyResult onBack={() => router.push("/")} />;
  }

  // ---- Derived data ----
  const answeredQs = session.questions.filter((q) => q.feedback);
  const allScores = answeredQs.map((q) => q.feedback!.score);
  const avgScore =
    allScores.length > 0
      ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
      : 0;

  const radarData = answeredQs
    .flatMap((q) => q.feedback!.dimensions)
    .reduce(
      (acc: { name: string; score: number; count: number }[], d) => {
        const existing = acc.find((x) => x.name === d.name);
        if (existing) {
          existing.score += d.score;
          existing.count += 1;
        } else {
          acc.push({ name: d.name, score: d.score, count: 1 });
        }
        return acc;
      },
      [],
    )
    .map((d) => ({
      dimension: d.name,
      value: Math.round((d.score / d.count) * 10) / 10,
    }));

  const scoreDistribution = [
    { range: "9-10分", count: allScores.filter((s) => s >= 9).length },
    { range: "7-8分", count: allScores.filter((s) => s >= 7 && s < 9).length },
    { range: "5-6分", count: allScores.filter((s) => s >= 5 && s < 7).length },
    { range: "5分以下", count: allScores.filter((s) => s < 5).length },
  ];

  // ---- Actions ----
  const handleShare = async () => {
    await shareReview(id, session.config.userId);
    toast.success("已分享复盘");
  };

  const handleBack = () => {
    reset();
    router.push("/");
  };

  const handleRetry = () => {
    reset();
    startTransition(() => router.push("/interview/new"));
  };

  // ---- Render ----
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* ================================================================= */}
        {/* Header                                                           */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              面试报告
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {session.config.position} · {MODE_LABEL[session.config.mode] || session.config.mode}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare} className="rounded-xl">
              <Share2 className="w-4 h-4 mr-1.5" />
              分享复盘
            </Button>
            <Button onClick={handleRetry} className="rounded-xl">
              <RotateCcw className="w-4 h-4 mr-1.5" />
              再来一场
            </Button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* Score overview cards                                             */}
        {/* ================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Overall score */}
          <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-md col-span-2 sm:col-span-1">
            <p className="text-primary-foreground/60 text-xs font-medium mb-1">
              综合评分
            </p>
            <p className="text-4xl font-display font-bold">
              {avgScore}
              <span className="text-lg text-primary-foreground/50 font-sans font-normal">
                /10
              </span>
            </p>
          </div>

          {/* Question count */}
          <Card className="border border-border/40 shadow-sm rounded-2xl bg-card">
            <CardContent className="p-5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">题目数</p>
              <p className="text-2xl font-display font-bold text-foreground">
                {session.questions.length}
              </p>
            </CardContent>
          </Card>

          {/* Answered count */}
          <Card className="border border-border/40 shadow-sm rounded-2xl bg-card">
            <CardContent className="p-5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">已回答</p>
              <p className="text-2xl font-display font-bold text-foreground">
                {answeredQs.length}
              </p>
            </CardContent>
          </Card>

          {/* Duration */}
          <Card className="border border-border/40 shadow-sm rounded-2xl bg-card">
            <CardContent className="p-5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">用时</p>
              <p className="text-2xl font-display font-bold text-foreground">
                {formatDuration(session.elapsedSeconds)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ================================================================= */}
        {/* AI Comprehensive Report                                          */}
        {/* ================================================================= */}
        {finalReport && (
          <Card className="border border-border/40 shadow-sm rounded-2xl bg-card overflow-hidden">
            {/* Report header */}
            <div className="bg-primary px-6 py-5 text-primary-foreground">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                <CardTitle className="text-primary-foreground text-lg font-display">
                  AI 综合评估报告
                </CardTitle>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Overall score + summary */}
              <div className="text-center py-3">
                <p className="text-5xl font-display font-extrabold text-primary">
                  {finalReport.overallScore}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  综合能力指数（百分制）
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-xl p-4">
                {finalReport.summary}
              </p>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/30">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm mb-2">
                    优势
                  </p>
                  <ul className="space-y-1.5">
                    {finalReport.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs text-emerald-600 dark:text-emerald-400 flex gap-1.5"
                      >
                        <span className="text-emerald-400 font-bold">+</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/30">
                  <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm mb-2">
                    待改进
                  </p>
                  <ul className="space-y-1.5">
                    {finalReport.weaknesses.map((w, i) => (
                      <li
                        key={i}
                        className="text-xs text-amber-600 dark:text-amber-400 flex gap-1.5"
                      >
                        <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />{" "}
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Plan */}
              <div>
                <p className="font-semibold text-sm text-foreground mb-3 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-primary" />
                  改进计划
                </p>
                <div className="space-y-2">
                  {finalReport.actionPlan.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40"
                    >
                      <Badge
                        variant={priorityBadgeVariant(a.priority)}
                        className="flex-shrink-0 mt-0.5 rounded-lg"
                      >
                        {priorityLabel(a.priority)}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.area}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Position match + next steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/30">
                  <p className="font-semibold text-blue-700 dark:text-blue-400 text-sm mb-1">
                    岗位匹配度
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                    {finalReport.positionMatch}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/30">
                  <p className="font-semibold text-purple-700 dark:text-purple-400 text-sm mb-1">
                    下一步建议
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 leading-relaxed">
                    {finalReport.nextSteps}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================================================================= */}
        {/* Radar chart                                                      */}
        {/* ================================================================= */}
        {radarData.length > 0 && (
          <Card className="border border-border/40 shadow-sm rounded-2xl bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-display">能力维度雷达图</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="currentColor" className="text-border/60" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fontSize: 12, fill: "currentColor" }}
                    className="text-muted-foreground"
                  />
                  <PolarRadiusAxis
                    domain={[0, 10]}
                    tick={{ fontSize: 10, fill: "currentColor" }}
                    className="text-muted-foreground"
                  />
                  <Radar
                    dataKey="value"
                    stroke="hsl(40, 60%, 52%)"
                    fill="hsl(40, 60%, 52%)"
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* ================================================================= */}
        {/* Score distribution                                               */}
        {/* ================================================================= */}
        {allScores.length > 0 && (
          <Card className="border border-border/40 shadow-sm rounded-2xl bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-display">得分分布</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={scoreDistribution}>
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 12, fill: "currentColor" }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    allowDecimals={false}
                    className="text-muted-foreground"
                  />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="hsl(40, 60%, 52%)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* ================================================================= */}
        {/* Per-question detail                                              */}
        {/* ================================================================= */}
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-foreground">
            逐题详情
          </h3>
          {session.questions.map((q, i) => (
            <Card
              key={i}
              className="border border-border/40 shadow-sm rounded-2xl bg-card overflow-hidden"
            >
              <CardContent className="p-5 space-y-4">
                {/* Question header */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{q.text}</p>
                  </div>
                  {q.feedback && (
                    <Badge
                      variant={scoreBadgeVariant(q.feedback.score)}
                      className="rounded-lg flex-shrink-0"
                    >
                      {q.feedback.score}/10
                    </Badge>
                  )}
                </div>

                {/* User answer */}
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    你的回答
                  </p>
                  <p className="text-sm text-foreground">
                    {q.userAnswer || (
                      <span className="text-muted-foreground/50 italic">（未回答）</span>
                    )}
                  </p>
                </div>

                {/* Feedback */}
                {q.feedback && (
                  <div className="space-y-3">
                    {/* Dimension scores */}
                    {q.feedback.dimensions.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {q.feedback.dimensions.map((d, j) => (
                          <span
                            key={j}
                            className="text-xs px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-medium"
                          >
                            {d.name}: {d.score}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Comment */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {q.feedback.comment}
                    </p>

                    {/* Reference answer */}
                    {q.feedback.reference_answer && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/30">
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">
                          参考答案
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          {q.feedback.reference_answer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ================================================================= */}
        {/* Bottom actions                                                   */}
        {/* ================================================================= */}
        <div className="flex items-center justify-center gap-3 pt-4 pb-8">
          <Button variant="outline" onClick={handleBack} className="rounded-xl">
            返回首页
          </Button>
          <Button onClick={handleRetry} className="rounded-xl">
            <RotateCcw className="w-4 h-4 mr-1.5" />
            再来一场
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
