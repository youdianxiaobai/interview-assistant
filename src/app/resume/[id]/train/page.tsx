"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { chat } from "@/lib/ai/client";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef, useState } from "react";
import type { Resume } from "@/types";
import {
  ArrowLeft,
  MessageCircle,
  Send,
  ChevronRight,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

export default function TrainPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const model = useSettingsStore((s) => s.deepseekModel);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const [resume, setResume] = useState<Resume | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase
      .from("resumes")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setResume(data);
        setPageLoading(false);
      });
  }, [id]);

  const generateQuestion = async () => {
    if (!resume || !apiKey) return;
    setLoading(true);
    try {
      const resp = await chat(
        apiKey,
        "你是面试官。根据候选人简历，随机问一个具体细节问题来验证真实性。直接提问，不要解释。",
        `简历：${JSON.stringify(resume.content)}。提出一个具体的追问。`,
        model,
        baseUrl
      );
      setQuestion(resp);
      setAnswer("");
      setFeedback("");
      setTimeout(() => answerRef.current?.focus(), 100);
      toast.success("已生成新问题");
    } catch (err) {
      toast.error("生成问题失败");
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = async () => {
    if (!apiKey || !answer.trim()) return;
    setLoading(true);
    try {
      const resp = await chat(
        apiKey,
        "你是面试教练。评价这个回答是否流畅、自信、与简历一致。给出具体建议。",
        `简历内容：${JSON.stringify(resume?.content)}。问题：${question}。回答：${answer}。评价：`,
        model,
        baseUrl
      );
      setFeedback(resp);
    } catch (err) {
      toast.error("评价失败");
    } finally {
      setLoading(false);
    }
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
                简历熟悉训练
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {resume.version_name}
              </p>
            </div>
          </div>
          <Button
            onClick={generateQuestion}
            disabled={loading}
            className="rounded-xl"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            {question ? "换一题" : "开始训练"}
          </Button>
        </div>

        {/* No question yet */}
        {!question && (
          <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Lightbulb className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground text-base mb-2">
                准备好开始训练了吗？
              </p>
              <p className="text-muted-foreground text-sm">
                AI 将基于你的简历提出追问，帮助你熟悉简历内容
              </p>
            </CardContent>
          </Card>
        )}

        {/* Question */}
        {question && (
          <Card className="rounded-xl shadow-sm border border-primary/30 bg-card mb-4">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-lg font-display font-medium text-foreground">
                  {question}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Answer input */}
        {question && (
          <div className="space-y-4 mb-6">
            <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
              <CardContent className="pt-6">
                <textarea
                  ref={answerRef}
                  className="w-full border border-border/60 rounded-xl p-4 resize-none bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all"
                  rows={5}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="输入你的回答..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      checkAnswer();
                    }
                  }}
                />
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button
                onClick={checkAnswer}
                disabled={!answer.trim() || loading}
                className="rounded-xl"
              >
                <Send className="w-4 h-4 mr-2" />
                提交回答
              </Button>
              <Button
                variant="outline"
                onClick={generateQuestion}
                disabled={loading}
                className="rounded-xl"
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                下一题
              </Button>
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <Card className="rounded-xl shadow-sm border border-[hsl(140,18%,45%)]/30 bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[hsl(140,18%,45%)]" />
                反馈
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <ReactMarkdown>{feedback}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
