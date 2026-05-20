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
import { Mic, Library, FileText, TrendingUp, Clock, BookOpen, ArrowRight, Target } from "lucide-react";
import { formatDuration } from "@/lib/utils";

export default function DashboardPage() {
  const { currentUserId, profiles } = useUserStore(); const router = useRouter();
  const currentUser = profiles.find((p) => p.id === currentUserId);

  const { data: history } = useQuery({ queryKey: ["interview-history", currentUserId], queryFn: () => fetchHistory(currentUserId!), enabled: !!currentUserId });
  const { data: questions } = useQuery({ queryKey: ["questions", currentUserId], queryFn: () => fetchQuestions(currentUserId!), enabled: !!currentUserId });
  const { data: weakTags } = useQuery({ queryKey: ["weak-tags", currentUserId], queryFn: () => getWeakTags(currentUserId!), enabled: !!currentUserId });

  const totalPractice = history?.length ?? 0;
  const totalQuestions = questions?.length ?? 0;
  const totalTime = history?.reduce((acc, iv) => acc + (iv.duration || 0), 0) ?? 0;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Welcome */}
        <div className="relative overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground">
          <div className="relative z-10">
            <p className="text-primary-foreground/70 text-sm mb-1">
              {new Date().getHours() < 12 ? "早上好" : new Date().getHours() < 18 ? "下午好" : "晚上好"}
            </p>
            <h2 className="text-2xl font-bold mb-1">{currentUser?.name || "求职者"}</h2>
            <p className="text-primary-foreground/70 text-sm mb-4">
              {totalPractice > 0
                ? `已坚持练习 ${totalPractice} 场面试，继续保持！`
                : "准备好开始你的第一场模拟面试了吗？"}
            </p>
            <Button size="sm" variant="secondary" onClick={() => router.push("/interview/new")}>
              开始面试 <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30">
            <Target className="w-24 h-24" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, label: "练习次数", value: totalPractice, unit: "场" },
            { icon: BookOpen, label: "题库规模", value: totalQuestions, unit: "题" },
            { icon: Clock, label: "累计时长", value: formatDuration(totalTime), unit: "" },
          ].map(({ icon: Icon, label, value, unit }) => (
            <Card key={label} className="border-0 shadow-sm bg-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
                <p className="text-3xl font-bold">
                  {value}<span className="text-lg text-muted-foreground font-normal ml-0.5">{unit}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weak points */}
        {weakTags && weakTags.length > 0 && (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-3">薄弱点 TOP5</h3>
              <div className="flex gap-2 flex-wrap">
                {weakTags.slice(0, 5).map((s) => (
                  <Badge key={s.tag} variant="destructive" className="px-3 py-1">
                    {s.tag} ({s.count}次)
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick actions */}
        <div>
          <h3 className="text-sm font-semibold mb-3">快捷入口</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Mic, title: "模拟面试", desc: "四种模式 · 语音互动", href: "/interview/new" },
              { icon: Library, title: "题库管理", desc: "AI 生成 · 拍照录入", href: "/question-bank" },
              { icon: FileText, title: "简历管理", desc: "AI 分析 · 熟悉训练", href: "/resume" },
            ].map(({ icon: Icon, title, desc, href }) => (
              <Card
                key={href}
                className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-0 shadow-sm bg-white"
                onClick={() => router.push(href)}
              >
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-semibold text-sm mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent practice */}
        {history && history.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">最近练习</h3>
            {history.slice(0, 5).map((iv) => (
              <Card
                key={iv.id}
                className="cursor-pointer hover:shadow-sm transition-all border-0 shadow-sm bg-white"
                onClick={() => router.push(`/interview/${iv.id}/result`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-medium">{iv.position}</Badge>
                    <Badge variant="secondary">{iv.mode === "practice" ? "练习" : iv.mode === "coach" ? "教练" : iv.mode === "mock" ? "模拟" : "挑战"}</Badge>
                    <span className="text-sm text-muted-foreground">{new Date(iv.created_at).toLocaleDateString("zh-CN")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(iv.duration)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
