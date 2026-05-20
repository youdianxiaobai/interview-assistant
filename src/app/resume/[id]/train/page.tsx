"use client";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { chat } from "@/lib/ai/client";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import type { Resume } from "@/types";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

export default function TrainPage() {
  const { id } = useParams<{ id: string }>();
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const model = useSettingsStore((s) => s.deepseekModel);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const [resume, setResume] = useState<Resume | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { supabase.from("resumes").select("*").eq("id", id).single().then(({ data }) => setResume(data)); }, [id]);

  const generateQuestion = async () => {
    if (!resume || !apiKey) return;
    setLoading(true);
    const resp = await chat(apiKey, "你是面试官。根据候选人简历，随机问一个具体细节问题来验证真实性。直接提问，不要解释。", `简历：${JSON.stringify(resume.content)}。提出一个具体的追问。`, model, baseUrl);
    setQuestion(resp); setAnswer(""); setFeedback(""); setLoading(false);
  };

  const checkAnswer = async () => {
    if (!apiKey || !answer.trim()) return;
    setLoading(true);
    const resp = await chat(apiKey, "你是面试教练。评价这个回答是否流畅、自信、与简历一致。给出具体建议。", `简历内容：${JSON.stringify(resume?.content)}。问题：${question}。回答：${answer}。评价：`, model, baseUrl);
    setFeedback(resp); setLoading(false);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">简历熟悉训练</h2><Button onClick={generateQuestion} disabled={loading}>{question ? "换一题" : "开始训练"}</Button></div>
        {question && (
          <Card className="border-primary/50"><CardContent className="pt-6"><p className="text-lg font-medium">{question}</p></CardContent></Card>
        )}
        {question && (
          <div className="space-y-3">
            <textarea className="w-full border rounded-md p-3 resize-none" rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="输入你的回答..." />
            <Button onClick={checkAnswer} disabled={!answer.trim() || loading}>提交回答</Button>
          </div>
        )}
        {feedback && (
          <Card className="border-green-200"><CardHeader><CardTitle>反馈</CardTitle></CardHeader><CardContent><div className="prose prose-sm max-w-none"><ReactMarkdown>{feedback}</ReactMarkdown></div></CardContent></Card>
        )}
      </div>
    </AppShell>
  );
}
