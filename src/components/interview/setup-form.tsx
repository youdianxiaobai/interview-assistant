"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/user-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useInterviewStore } from "@/lib/store/interview-store";
import { fetchQuestionsByPosition } from "@/lib/supabase/queries/questions";
import { chat } from "@/lib/ai/client";
import { buildInterviewerPrompt } from "@/lib/ai/prompts/interviewer";
import { getWeakTags } from "@/lib/supabase/queries/wrong-questions";
import { createInterview } from "@/lib/supabase/queries/interviews";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InterviewMode, InterviewType, FeedbackMode, InteractionMode, InterviewLanguage } from "@/types";
import toast from "react-hot-toast";

export function SetupForm() {
  const router = useRouter();
  const currentUserId = useUserStore((s) => s.currentUserId);
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const model = useSettingsStore((s) => s.deepseekModel);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const initSession = useInterviewStore((s) => s.initSession);

  const [position, setPosition] = useState("跨境海运操作");
  const [mode, setMode] = useState<InterviewMode>("practice");
  const [type, setType] = useState<InterviewType>("comprehensive");
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>("combined");
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("text-voice");
  const [language, setLanguage] = useState<InterviewLanguage>("zh");
  const [useResume, setUseResume] = useState(false);
  const [focusWeak, setFocusWeak] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);

  if (!apiKey) {
    return (
      <Card className="max-w-lg mx-auto mt-12">
        <CardHeader><CardTitle>设置 API Key</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">使用前需要设置 DeepSeek API Key</p>
          <div className="space-y-2"><Label>DeepSeek API Key</Label><Input type="password" placeholder="sk-..." onChange={(e) => useSettingsStore.getState().setDeepseekApiKey(e.target.value)} /></div>
          <p className="text-xs text-muted-foreground">Key 仅保存在你的浏览器中，不会上传</p>
        </CardContent>
      </Card>
    );
  }

  const handleStart = async () => {
    if (!currentUserId) return;
    let [weakTags, resumeSummary, knowledgeCards] = [[""] as string[], "", ""];
    if (focusWeak) { const tags = await getWeakTags(currentUserId); weakTags = tags.map((t) => t.tag); }
    if (useResume) {
      const { data: r } = await supabase.from("resumes").select("content").eq("user_id", currentUserId).eq("is_current", true).limit(1);
      if (r?.[0]) resumeSummary = JSON.stringify(r[0].content).slice(0, 2000);
    }
    const presetQs = await fetchQuestionsByPosition(currentUserId, position);
    const system = buildInterviewerPrompt({ position, type, language, useResume, focusWeak, resumeSummary, weakTags: weakTags.filter(Boolean), knowledgeCards });
    const resp = await chat(apiKey, system, `请一次性生成${questionCount}道面试题。严格输出JSON: {"questions":["题1","题2",...]}`, model, baseUrl);
    let qTexts: string[];
    try { const j = JSON.parse(resp); qTexts = j.questions || j; } catch { qTexts = resp.split("\n").filter((l: string) => l.trim()); }
    if (presetQs.length > 0) { qTexts = [...presetQs.sort(() => Math.random() - 0.5).slice(0, Math.min(3, questionCount)).map((q) => q.content), ...qTexts.slice(0, questionCount - Math.min(3, questionCount))]; }
    const interview = await createInterview({ user_id: currentUserId, mode, position, type, language });
    initSession({ userId: currentUserId, position, type, mode, interactionMode, feedbackMode, language, useResume, focusWeakPoints: focusWeak, questionCount: qTexts.length }, qTexts);
    router.push(`/interview/${interview.id}`);
    toast.success("面试开始！");
  };

  return (
    <Card className="max-w-lg mx-auto mt-6">
      <CardHeader><CardTitle>模拟面试配置</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2"><Label>目标岗位</Label><Input value={position} onChange={(e) => setPosition(e.target.value)} /></div>
        <div>
          <Label>面试模式</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as InterviewMode)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="practice">练习模式（自由暂停，反复重答）</SelectItem>
              <SelectItem value="coach">教练模式（AI 引导你学会回答）</SelectItem>
              <SelectItem value="mock">模拟模式（真实压力，限时不中断）</SelectItem>
              <SelectItem value="challenge">挑战模式（用对方错题互考）</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>面试类型</Label>
            <Select value={type} onValueChange={(v) => setType(v as InterviewType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="tech">技术/专业面</SelectItem><SelectItem value="behavioral">行为面</SelectItem><SelectItem value="comprehensive">综合面试</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>反馈模式</Label>
            <Select value={feedbackMode} onValueChange={(v) => setFeedbackMode(v as FeedbackMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="realtime">逐题实时反馈</SelectItem><SelectItem value="summary">考完统一评估</SelectItem><SelectItem value="combined">两者结合</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>交互方式</Label>
            <Select value={interactionMode} onValueChange={(v) => setInteractionMode(v as InteractionMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="text-voice">文字 + 语音输入</SelectItem><SelectItem value="voice">纯语音对话</SelectItem><SelectItem value="text">纯文字</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>面试语言</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as InterviewLanguage)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="zh">中文</SelectItem><SelectItem value="en">English</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>题目数量：{questionCount}</Label><Slider value={[questionCount]} onValueChange={([v]) => setQuestionCount(v)} min={1} max={15} step={1} /></div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2"><Switch checked={useResume} onCheckedChange={setUseResume} /><Label>基于简历提问</Label></div>
          <div className="flex items-center gap-2"><Switch checked={focusWeak} onCheckedChange={setFocusWeak} /><Label>聚焦薄弱点</Label></div>
        </div>
        <Button className="w-full" size="lg" onClick={handleStart}>开始面试</Button>
      </CardContent>
    </Card>
  );
}
