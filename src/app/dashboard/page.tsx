"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { useQuery } from "@tanstack/react-query";
import { fetchHistory } from "@/lib/supabase/queries/interviews";
import { fetchQuestions } from "@/lib/supabase/queries/questions";
import { getWeakTags } from "@/lib/supabase/queries/wrong-questions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Mic, Library, FileText, TrendingUp, Clock, BookOpen } from "lucide-react";
import { formatDuration } from "@/lib/utils";

export default function DashboardPage() {
  const { currentUserId } = useUserStore(); const router = useRouter();

  const { data: history } = useQuery({ queryKey: ["interview-history", currentUserId], queryFn: () => fetchHistory(currentUserId!), enabled: !!currentUserId });
  const { data: questions } = useQuery({ queryKey: ["questions", currentUserId], queryFn: () => fetchQuestions(currentUserId!), enabled: !!currentUserId });
  const { data: weakTags } = useQuery({ queryKey: ["weak-tags", currentUserId], queryFn: () => getWeakTags(currentUserId!), enabled: !!currentUserId });

  const totalPractice = history?.length ?? 0;
  const totalQuestions = questions?.length ?? 0;
  const totalTime = history?.reduce((acc, iv) => acc + (iv.duration || 0), 0) ?? 0;
  const avgScore = history?.filter((iv) => Object.keys(iv.score || {}).length > 0).length ?? 0;

  return (
    <AppShell>
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">仪表盘</h2>

        <div className="grid grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">总练习次数</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /><span className="text-3xl font-bold">{totalPractice}</span></div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">题库规模</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /><span className="text-3xl font-bold">{totalQuestions}</span></div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">累计练习</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /><span className="text-3xl font-bold">{formatDuration(totalTime)}</span></div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">有评分记录</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /><span className="text-3xl font-bold">{avgScore}</span></div></CardContent></Card>
        </div>

        {weakTags && weakTags.length > 0 && (
          <Card><CardHeader><CardTitle>薄弱点 TOP5</CardTitle></CardHeader><CardContent><div className="flex gap-2 flex-wrap">{weakTags.slice(0, 5).map((s) => <Badge key={s.tag} variant="destructive">{s.tag} ({s.count}次)</Badge>)}</div></CardContent></Card>
        )}

        <div className="grid grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push("/interview/new")}>
            <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
              <Mic className="w-8 h-8 text-primary" /><p className="font-medium">开始模拟面试</p><p className="text-sm text-muted-foreground">四种模式，语音互动</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push("/question-bank")}>
            <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
              <Library className="w-8 h-8 text-primary" /><p className="font-medium">管理题库</p><p className="text-sm text-muted-foreground">AI生成、OCR录入</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push("/resume")}>
            <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
              <FileText className="w-8 h-8 text-primary" /><p className="font-medium">简历管理</p><p className="text-sm text-muted-foreground">AI分析、熟悉训练</p>
            </CardContent>
          </Card>
        </div>

        {history && history.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-lg">最近练习</h3>
            {history.slice(0, 5).map((iv) => (
              <Card key={iv.id} className="cursor-pointer hover:border-primary" onClick={() => router.push(`/interview/${iv.id}/result`)}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{iv.position}</Badge>
                    <Badge variant="secondary">{iv.mode}</Badge>
                    <span className="text-sm text-muted-foreground">{new Date(iv.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatDuration(iv.duration)}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
