"use client";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useInterviewStore } from "@/lib/store/interview-store";
import { useUserStore } from "@/lib/store/user-store";
import { shareReview } from "@/lib/supabase/queries/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const session = useInterviewStore((s) => s.session);
  const profiles = useUserStore((s) => s.profiles);
  const router = useRouter();
  const reset = useInterviewStore((s) => s.reset);

  if (!session) {
    return <AppShell><div className="flex items-center justify-center h-full"><p>没有面试数据</p></div></AppShell>;
  }

  const allScores = session.questions.filter((q) => q.feedback).map((q) => q.feedback!.score);
  const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length * 10) / 10 : 0;

  const radarData = session.questions
    .filter((q) => q.feedback)
    .flatMap((q) => q.feedback!.dimensions)
    .reduce((acc: any[], d) => {
      const existing = acc.find((x) => x.name === d.name);
      if (existing) { existing.score += d.score; existing.count += 1; }
      else acc.push({ name: d.name, score: d.score, count: 1 });
      return acc;
    }, [])
    .map((d) => ({ dimension: d.name, value: Math.round(d.score / d.count * 10) / 10 }));

  const handleShare = async () => {
    await shareReview(id, session.config.userId);
    toast.success("已分享复盘");
  };

  const handleBack = () => { reset(); router.push("/interview/new"); };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">面试报告</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare}>分享复盘</Button>
            <Button onClick={handleBack}>再来一次</Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">综合评分</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{avgScore}<span className="text-lg text-muted-foreground">/10</span></p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">题目数</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{session.questions.length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">用时</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{formatDuration(session.elapsedSeconds)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">模式</CardTitle></CardHeader>
            <CardContent><Badge className="text-lg">{session.config.mode}</Badge></CardContent></Card>
        </div>

        {radarData.length > 0 && (
          <Card><CardHeader><CardTitle>能力维度</CardTitle></CardHeader><CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid /><PolarAngleAxis dataKey="dimension" /><PolarRadiusAxis domain={[0, 10]} />
                <Radar dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent></Card>
        )}

        <div className="space-y-4">
          <h3 className="font-bold text-lg">逐题详情</h3>
          {session.questions.map((q, i) => (
            <Card key={i}><CardContent className="pt-6 space-y-3">
              <p className="font-medium">{i + 1}. {q.text}</p>
              <div className="p-3 bg-muted rounded-md"><p className="text-sm font-medium mb-1">你的回答</p><p className="text-sm">{q.userAnswer || "(未回答)"}</p></div>
              {q.feedback && (
                <div className="space-y-2">
                  <Badge className="text-sm">评分：{q.feedback.score}/10</Badge>
                  <p className="text-sm text-muted-foreground">{q.feedback.comment}</p>
                  <div className="p-3 bg-green-50 rounded-md"><p className="text-sm font-medium mb-1">参考答案</p><p className="text-sm">{q.feedback.reference_answer}</p></div>
                </div>
              )}
            </CardContent></Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
