"use client";
import { useState, useCallback, startTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type {
  InterviewMode,
  InterviewType,
  FeedbackMode,
  InteractionMode,
  InterviewLanguage,
} from "@/types";
import {
  Mic,
  Target,
  GraduationCap,
  Swords,
  Sparkles,
  Key,
  Zap,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const modeOptions: {
  value: InterviewMode;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "practice", label: "练习模式", desc: "自由暂停，反复重答", icon: Target },
  { value: "coach", label: "教练模式", desc: "AI 一步步引导你学会回答", icon: GraduationCap },
  { value: "mock", label: "模拟模式", desc: "真实压力，限时不中断", icon: Mic },
  { value: "challenge", label: "挑战模式", desc: "用对方错题互考 PK", icon: Swords },
];

/* ── API Key Setup View ── */
function ApiKeySetup() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!key.trim()) return;
    useSettingsStore.getState().setDeepseekApiKey(key.trim());
    setSaved(true);
    toast.success("API Key 已保存");
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <Card className="shadow-xl border-border/40 animate-fade-in-scale">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Key className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>设置 API Key</CardTitle>
          <CardDescription>使用前需要配置 DeepSeek API Key</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {saved ? (
            <div className="text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Zap className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium">API Key 已就绪</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSaved(false); setKey(""); }}
                className="rounded-xl"
              >
                重新设置
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">DeepSeek API Key</Label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="h-11 rounded-xl font-mono text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
              </div>
              <Button onClick={handleSave} className="w-full h-11 rounded-xl" disabled={!key.trim()}>
                保存并继续
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Key 仅保存在你的浏览器中，不会上传到任何服务器
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Main Setup Form ── */
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
  const [isStarting, setIsStarting] = useState(false);

  if (!apiKey) return <ApiKeySetup />;

  const handleStart = async () => {
    if (!currentUserId || isStarting) return;
    setIsStarting(true);
    try {
      const [presetQs, weakTagData] = await Promise.all([
        fetchQuestionsByPosition(currentUserId, position),
        focusWeak ? getWeakTags(currentUserId) : Promise.resolve([]),
      ]);

      let resumeSummary = "";
      if (useResume) {
        const { data: r } = await supabase
          .from("resumes")
          .select("content")
          .eq("user_id", currentUserId)
          .eq("is_current", true)
          .limit(1);
        if (r?.[0]) resumeSummary = JSON.stringify(r[0].content).slice(0, 2000);
      }

      const weakTags = weakTagData.map((t) => t.tag).filter(Boolean);
      const system = buildInterviewerPrompt({
        position,
        type,
        language,
        useResume,
        focusWeak,
        resumeSummary,
        weakTags,
        knowledgeCards: "",
      });

      const resp = await chat(
        apiKey,
        system,
        `请一次性生成${questionCount}道面试题。严格输出JSON: {"questions":["题1","题2",...]}`,
        model,
        baseUrl
      );

      let qTexts: string[];
      try {
        const j = JSON.parse(resp);
        qTexts = j.questions || j;
      } catch {
        qTexts = resp
          .split("\n")
          .filter((l: string) => l.trim() && l.length > 10)
          .slice(0, questionCount);
      }

      if (presetQs.length > 0) {
        const presetSlice = presetQs
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(3, questionCount))
          .map((q) => q.content);
        qTexts = [...presetSlice, ...qTexts.slice(0, questionCount - presetSlice.length)];
      }

      const interview = await createInterview({
        user_id: currentUserId,
        mode,
        position,
        type,
        language,
      });

      initSession(
        {
          userId: currentUserId,
          position,
          type,
          mode,
          interactionMode,
          feedbackMode,
          language,
          useResume,
          focusWeakPoints: focusWeak,
          questionCount: qTexts.length,
        },
        qTexts
      );

      startTransition(() => {
        router.push(`/interview/${interview.id}`);
      });
      toast.success("面试开始！");
    } catch (err) {
      console.error("Failed to start interview:", err);
      toast.error("启动面试失败，请检查 API Key 和网络连接");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <Card className="shadow-xl border-border/40 animate-fade-in-scale">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">配置模拟面试</CardTitle>
          <CardDescription>选择岗位、模式和偏好，AI 为你定制面试体验</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-4">
          {/* Position */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">目标岗位</Label>
            <Input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="h-11 rounded-xl"
              placeholder="如：跨境海运操作、跨境电商运营"
            />
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">面试模式</Label>
            <div className="grid grid-cols-2 gap-2">
              {modeOptions.map(({ value, label, desc, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                    mode === value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/60 hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      mode === value ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Type & Feedback */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">面试类型</Label>
              <Select value={type} onValueChange={(v) => setType(v as InterviewType)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech">技术 / 专业面</SelectItem>
                  <SelectItem value="behavioral">行为面</SelectItem>
                  <SelectItem value="comprehensive">综合面试</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">反馈模式</Label>
              <Select value={feedbackMode} onValueChange={(v) => setFeedbackMode(v as FeedbackMode)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">逐题实时反馈</SelectItem>
                  <SelectItem value="summary">考完统一评估</SelectItem>
                  <SelectItem value="combined">两者结合</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Interaction & Language */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">交互方式</Label>
              <Select value={interactionMode} onValueChange={(v) => setInteractionMode(v as InteractionMode)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-voice">文字 + 语音</SelectItem>
                  <SelectItem value="voice">纯语音对话</SelectItem>
                  <SelectItem value="text">纯文字</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">面试语言</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as InterviewLanguage)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Question Count */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">题目数量</Label>
              <span className="text-sm font-semibold text-primary tabular-nums">
                {questionCount} 题
              </span>
            </div>
            <Slider
              value={[questionCount]}
              onValueChange={([v]) => setQuestionCount(v)}
              min={1}
              max={15}
              step={1}
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-8">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Switch checked={useResume} onCheckedChange={setUseResume} />
              <span className="text-sm">基于简历提问</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Switch checked={focusWeak} onCheckedChange={setFocusWeak} />
              <span className="text-sm">聚焦薄弱点</span>
            </label>
          </div>

          {/* Start Button */}
          <Button
            className="w-full h-12 rounded-xl text-base font-medium"
            size="lg"
            onClick={handleStart}
            disabled={isStarting}
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                生成面试题目...
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                开始面试
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
