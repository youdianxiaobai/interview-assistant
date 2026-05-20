"use client";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { chat } from "@/lib/ai/client";
import { buildResumeAnalysisPrompt } from "@/lib/ai/prompts/resume-analyzer";
import { saveAnalysis } from "@/lib/supabase/queries/resumes";
import { createQuestion } from "@/lib/supabase/queries/questions";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Resume, ResumeAnalysis } from "@/types";
import toast from "react-hot-toast";

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const currentUserId = useUserStore((s) => s.currentUserId);
  const apiKey = useSettingsStore((s) => s.anthropicApiKey);
  const qc = useQueryClient();
  const [resume, setResume] = useState<Resume | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { supabase.from("resumes").select("*").eq("id", id).single().then(({ data }) => setResume(data)); }, [id]);

  const runAnalysis = async () => {
    if (!resume || !apiKey) return;
    setLoading(true);
    try {
      const prompt = buildResumeAnalysisPrompt(resume.target_position || "通用", JSON.stringify(resume.content));
      const resp = await chat(apiKey, "你是资深HR，请严格按JSON格式输出。", prompt);
      const j = JSON.parse(resp);
      const a = await saveAnalysis({ resume_id: id, user_id: currentUserId!, position_target: resume.target_position, match_score: j.match_score, strength_points: j.strength_points, risk_points: j.risk_points, predicted_questions: j.predicted_questions });
      setAnalysis(a);
    } catch { toast.error("分析失败，请重试"); }
    finally { setLoading(false); }
  };

  const addToQuestions = async (q: string) => {
    if (!currentUserId) return;
    await createQuestion({ user_id: currentUserId, position: resume?.target_position || "", type: "tech", difficulty: "medium", source: "resume", content: q, reference_answer: "", tags: ["简历追问"] });
    qc.invalidateQueries({ queryKey: ["questions"] });
    toast.success("已加入题库");
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">简历分析</h2><Button onClick={runAnalysis} disabled={loading}>{loading ? "分析中..." : "开始分析"}</Button></div>
        {analysis && (
          <div className="space-y-4">
            <Card><CardHeader><CardTitle>匹配度：{analysis.match_score}/100</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardTitle>优势</CardTitle></CardHeader><CardContent><ul className="list-disc pl-4">{analysis.strength_points.map((s, i) => <li key={i} className="text-sm">{s}</li>)}</ul></CardContent></Card>
            <Card><CardHeader><CardTitle>风险点</CardTitle></CardHeader><CardContent><ul className="list-disc pl-4">{analysis.risk_points.map((s, i) => <li key={i} className="text-sm">{s}</li>)}</ul></CardContent></Card>
            <Card><CardHeader><CardTitle>可能追问</CardTitle></CardHeader><CardContent><div className="space-y-2">{analysis.predicted_questions.map((q, i) => <div key={i} className="flex items-center justify-between p-2 bg-muted rounded"><span className="text-sm">{q}</span><Button variant="outline" size="sm" onClick={() => addToQuestions(q)}>加入题库</Button></div>)}</div></CardContent></Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
