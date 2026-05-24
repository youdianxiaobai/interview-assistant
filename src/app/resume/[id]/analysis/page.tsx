"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { chat } from "@/lib/ai/client";
import { buildResumeAnalysisPrompt } from "@/lib/ai/prompts/resume-analyzer";
import { saveAnalysis, fetchLatestAnalysis } from "@/lib/supabase/queries/resumes";
import { createQuestion } from "@/lib/supabase/queries/questions";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Resume, ResumeAnalysis } from "@/types";
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  RefreshCw,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const currentUserId = useUserStore((s) => s.currentUserId);
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const model = useSettingsStore((s) => s.deepseekModel);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const qc = useQueryClient();

  const [resume, setResume] = useState<Resume | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("resumes").select("*").eq("id", id).single(),
      fetchLatestAnalysis(id),
    ]).then(([{ data }, savedAnalysis]) => {
      setResume(data);
      if (savedAnalysis) setAnalysis(savedAnalysis);
      setPageLoading(false);
    });
  }, [id]);

  const runAnalysis = async () => {
    if (!resume || !apiKey) return;
    setAnalyzing(true);
    try {
      const prompt = buildResumeAnalysisPrompt(
        resume.target_position || "通用",
        JSON.stringify(resume.content)
      );
      const resp = await chat(
        apiKey,
        "你是资深HR，请严格按JSON格式输出。",
        prompt,
        model,
        baseUrl
      );
      const j = JSON.parse(resp);
      const a = await saveAnalysis({
        resume_id: id,
        user_id: currentUserId!,
        position_target: resume.target_position,
        match_score: j.match_score,
        strength_points: j.strength_points,
        risk_points: j.risk_points,
        predicted_questions: j.predicted_questions,
      });
      setAnalysis(a);
      toast.success("分析完成");
    } catch (err) {
      console.error("AI 简历分析失败:", err);
      toast.error(`分析失败: ${String(err).slice(0, 80)}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const addToQuestions = async (q: string) => {
    if (!currentUserId) return;
    await createQuestion({
      user_id: currentUserId,
      position: resume?.target_position || "",
      type: "tech",
      difficulty: "medium",
      source: "resume",
      content: q,
      reference_answer: "",
      tags: ["简历追问"],
    });
    qc.invalidateQueries({ queryKey: ["questions"] });
    toast.success("已加入题库");
  };

  if (pageLoading) {
    return (
      <AppShell>
        <div className="page-container animate-fade-in">
          <Skeleton className="h-8 w-48 mb-6 rounded-lg" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (!resume) {
    return (
      <AppShell>
        <div className="page-container animate-fade-in">
          <p className="text-center py-12 text-muted-foreground">
            简历未找到
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-container animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => router.push("/resume")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                简历分析
              </h2>
              {resume && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {resume.version_name}
                  {resume.target_position
                    ? ` - ${resume.target_position}`
                    : ""}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={runAnalysis}
            disabled={analyzing || !apiKey}
            className="rounded-xl"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${analyzing ? "animate-spin" : ""}`}
            />
            {analyzing ? "分析中..." : analysis ? "重新分析" : "开始分析"}
          </Button>
        </div>

        {/* No analysis yet - prompt */}
        {!analysis && !analyzing && (
          <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <TrendingUp className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground text-base mb-2">
                尚无分析结果
              </p>
              <p className="text-muted-foreground text-sm">
                点击上方「开始分析」按钮，让 AI 评估你的简历
              </p>
            </CardContent>
          </Card>
        )}

        {/* Analyzing skeleton */}
        {analyzing && (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        )}

        {/* Analysis results */}
        {analysis && (
          <div className="space-y-4">
            {/* Match score */}
            <Card className="rounded-xl shadow-sm border border-border/40 bg-card overflow-hidden">
              <div className="bg-primary p-8 text-center text-primary-foreground">
                <p className="text-primary-foreground/70 text-sm mb-2">
                  综合匹配度
                </p>
                <p className="text-6xl font-display font-bold tabular-nums">
                  {analysis.match_score}
                  <span className="text-2xl text-primary-foreground/50">
                    /100
                  </span>
                </p>
              </div>
            </Card>

            {/* Strengths */}
            <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[hsl(140,18%,45%)]" />
                  <CardTitle className="text-lg font-display">优势</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.strength_points.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[hsl(140,18%,45%)] mt-0.5 flex-shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Risks */}
            <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <CardTitle className="text-lg font-display">
                    风险点
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.risk_points.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Predicted questions */}
            <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg font-display">
                    可能追问
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.predicted_questions.map((q, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50 border border-border/20"
                    >
                      <span className="text-sm flex-1">{q}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg flex-shrink-0"
                        onClick={() => addToQuestions(q)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        加入题库
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
