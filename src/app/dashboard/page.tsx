"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { useQuery } from "@tanstack/react-query";
import { fetchHistory } from "@/lib/supabase/queries/interviews";
import { fetchQuestions } from "@/lib/supabase/queries/questions";
import { getWeakTags } from "@/lib/supabase/queries/wrong-questions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Mic,
  Library,
  FileText,
  TrendingUp,
  Clock,
  BookOpen,
  ArrowRight,
  Heart,
  Target,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/skeletons";
import { startTransition } from "react";

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  unit?: string;
}

function StatCard({ icon: Icon, label, value, unit }: StatCardProps) {
  return (
    <Card className="border border-border/40 shadow-sm rounded-2xl overflow-hidden group card-hover bg-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground font-medium">{label}</span>
        </div>
        <p className="text-3xl font-display font-bold text-foreground tracking-tight">
          {value}
          {unit && (
            <span className="text-base text-muted-foreground font-sans font-normal ml-0.5">
              {unit}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { currentUserId, profiles } = useUserStore();
  const router = useRouter();
  const currentUser = profiles.find((p) => p.id === currentUserId);

  const { data: history, isLoading: hLoading } = useQuery({
    queryKey: ["interview-history", currentUserId],
    queryFn: () => fetchHistory(currentUserId!),
    enabled: !!currentUserId,
    staleTime: 30_000,
  });

  const { data: questions, isLoading: qLoading } = useQuery({
    queryKey: ["questions", currentUserId],
    queryFn: () => fetchQuestions(currentUserId!),
    enabled: !!currentUserId,
    staleTime: 30_000,
  });

  const { data: weakTags, isLoading: wLoading } = useQuery({
    queryKey: ["weak-tags", currentUserId],
    queryFn: () => getWeakTags(currentUserId!),
    enabled: !!currentUserId,
    staleTime: 30_000,
  });

  if (hLoading || qLoading || wLoading) {
    return (
      <AppShell>
        <DashboardSkeleton />
      </AppShell>
    );
  }

  const totalPractice = history?.length ?? 0;
  const totalQuestions = questions?.length ?? 0;
  const totalTime = history?.reduce((acc, iv) => acc + (iv.duration || 0), 0) ?? 0;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";

  const navigate = (href: string) => {
    startTransition(() => router.push(href));
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground shadow-xl">
          <div className="relative z-10">
            <p className="text-primary-foreground/70 text-sm font-medium mb-1">{greeting}</p>
            <h2 className="font-display text-2xl font-bold mb-1.5">
              {currentUser?.name || "求职者"}
            </h2>
            <p className="text-primary-foreground/70 text-sm mb-6 max-w-md">
              {totalPractice > 0
                ? `已坚持完成 ${totalPractice} 场模拟面试，继续加油！`
                : "万事俱备，开始你的第一场模拟面试吧。"}
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/15 hover:bg-white/25 text-white border-white/20 rounded-xl"
                onClick={() => navigate("/interview/new")}
              >
                <Mic className="w-4 h-4 mr-1.5" />
                开始面试
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white border-white/10 rounded-xl"
                onClick={() => navigate("/wellness")}
              >
                <Heart className="w-4 h-4 mr-1.5" />
                心理支持
              </Button>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/5 to-transparent" />
          <Target className="absolute -right-6 -top-6 w-36 h-36 text-white/[0.06]" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-5">
          <StatCard icon={TrendingUp} label="练习次数" value={totalPractice} unit="场" />
          <StatCard icon={BookOpen} label="题库规模" value={totalQuestions} unit="题" />
          <StatCard icon={Clock} label="累计时长" value={formatDuration(totalTime)} />
        </div>

        {/* Weak Points */}
        {weakTags && weakTags.length > 0 && (
          <Card className="border border-border/40 shadow-sm rounded-2xl bg-card">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-3 text-foreground">薄弱趋势 TOP5</h3>
              <div className="flex gap-2 flex-wrap">
                {weakTags.slice(0, 5).map((s) => (
                  <Badge
                    key={s.tag}
                    variant="destructive"
                    className="px-3 py-1.5 rounded-lg font-medium"
                  >
                    {s.tag}
                    <span className="ml-1 text-destructive/70">({s.count})</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold mb-4 text-foreground">快捷入口</h3>
          <div className="grid grid-cols-3 gap-5">
            {[
              {
                icon: Mic,
                title: "模拟面试",
                desc: "四种模式 · 语音互动 · 实时反馈",
                href: "/interview/new",
              },
              {
                icon: Library,
                title: "题库管理",
                desc: "AI 生成 · 拍照录入 · 错题复习",
                href: "/question-bank",
              },
              {
                icon: FileText,
                title: "简历管理",
                desc: "AI 分析 · STAR 优化 · 熟悉训练",
                href: "/resume",
              },
            ].map(({ icon: Icon, title, desc, href }) => (
              <Card
                key={href}
                className="cursor-pointer card-hover border border-border/40 shadow-sm rounded-2xl bg-card group"
                onClick={() => navigate(href)}
              >
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                    {title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Practice */}
        {history && history.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">最近练习</h3>
            {history.slice(0, 5).map((iv) => (
              <Card
                key={iv.id}
                className="cursor-pointer card-hover border border-border/40 shadow-sm rounded-2xl bg-card group"
                onClick={() => navigate(`/interview/${iv.id}/result`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="outline" className="font-medium rounded-lg border-border/60">
                      {iv.position}
                    </Badge>
                    <Badge variant="secondary" className="rounded-lg font-normal">
                      {iv.mode === "practice"
                        ? "练习模式"
                        : iv.mode === "coach"
                          ? "教练模式"
                          : iv.mode === "mock"
                            ? "模拟模式"
                            : "挑战模式"}
                    </Badge>
                    <span className="text-sm text-muted-foreground hidden sm:inline">
                      {new Date(iv.created_at).toLocaleDateString("zh-CN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(iv.duration)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {(!history || history.length === 0) && (
          <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border/60">
            <Mic className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm mb-4">还没有面试记录</p>
            <Button onClick={() => navigate("/interview/new")} className="rounded-xl">
              开始第一场模拟面试
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
