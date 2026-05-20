"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useSettingsStore } from "@/lib/store/settings-store";
import { chat } from "@/lib/ai/client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wind, Brain, Sparkles, Shield, Play, Pause, RotateCcw, RefreshCw } from "lucide-react";

// Breathing exercise component
function BreathingExercise() {
  const [phase, setPhase] = useState<"idle" | "inhale" | "hold" | "exhale">("idle");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) { setPhase("idle"); setSeconds(0); return; }
    const seq = ["inhale", "hold", "exhale"] as const;
    const durations = { inhale: 4, hold: 4, exhale: 6 };
    const currentPhase = seq[Math.floor(seconds / 4) % 3]; // simplified
    const phaseTime = seconds % 14;
    if (phaseTime < 4) setPhase("inhale");
    else if (phaseTime < 8) setPhase("hold");
    else setPhase("exhale");

    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    if (seconds >= 70) { setRunning(false); setSeconds(0); setPhase("idle"); }
    return () => clearInterval(timer);
  }, [running, seconds]);

  const size = 160;
  const scale = phase === "inhale" ? 1.2 : phase === "hold" ? 1.2 : phase === "exhale" ? 0.85 : 1;
  const phaseLabel = { idle: "开始", inhale: "吸气 4 秒", hold: "屏息 4 秒", exhale: "呼气 6 秒" };
  const phaseColor = { idle: "bg-sky-100", inhale: "bg-sky-200", hold: "bg-sky-300", exhale: "bg-sky-100" };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-8 flex flex-col items-center space-y-6">
        <div className="flex items-center gap-2"><Wind className="w-5 h-5 text-sky-500" /><h3 className="font-semibold">深呼吸练习</h3></div>
        <div
          className={`${phaseColor[phase]} rounded-full flex items-center justify-center transition-all duration-1000`}
          style={{ width: size * scale, height: size * scale }}
        >
          <span className="text-5xl">{phase === "inhale" ? "🫁" : phase === "exhale" ? "🌊" : "🧘"}</span>
        </div>
        <Badge variant="outline" className="text-base px-4 py-1.5">{phaseLabel[phase]}</Badge>
        <p className="text-sm text-muted-foreground text-center">4-4-6 呼吸法：吸气 4 秒 → 屏息 4 秒 → 呼气 6 秒，共 5 轮</p>
        <div className="flex gap-3">
          <Button onClick={() => { setRunning(!running); if (phase === "idle") setSeconds(0); }} variant={running ? "outline" : "default"}>
            {running ? <><Pause className="w-4 h-4 mr-2" />暂停</> : <><Play className="w-4 h-4 mr-2" />开始</>}
          </Button>
          <Button variant="ghost" onClick={() => { setRunning(false); setSeconds(0); setPhase("idle"); }}>
            <RotateCcw className="w-4 h-4 mr-2" />重置
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Affirmation cards
const DEFAULT_AFFIRMATIONS = [
  { title: "我已经很努力了", body: "每次面试都是一次练习，我在不断进步。" },
  { title: "被拒不是否定我", body: "不匹配不代表我不好，只是还没有找到对的地方。" },
  { title: "我可以紧张", body: "紧张说明我在乎，这很正常。深呼吸，我可以的。" },
  { title: "我的经历有价值", body: "每一个项目、每一次实习都塑造了现在的我。" },
];

function AffirmationCards() {
  const [cards, setCards] = useState(DEFAULT_AFFIRMATIONS);
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const model = useSettingsStore((s) => s.deepseekModel);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      const resp = await chat(apiKey, "你是积极心理学专家。生成5条适合求职者的积极心理暗示。输出JSON: [{\"title\":\"...\",\"body\":\"...\"}]", "", model, baseUrl);
      const j = JSON.parse(resp);
      if (Array.isArray(j)) setCards(j);
    } catch {}
    setLoading(false);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" /><h3 className="font-semibold">积极心理暗示卡</h3></div>
          <Button variant="outline" size="sm" onClick={generate} disabled={loading || !apiKey}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />AI 换一批
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c, i) => (
            <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-100">
              <p className="font-semibold text-sm mb-1">{c.title}</p>
              <p className="text-xs text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Anxiety reframing
function AnxietyReframe() {
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const model = useSettingsStore((s) => s.deepseekModel);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const [negative, setNegative] = useState("");
  const [reframe, setReframe] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReframe = async () => {
    if (!negative.trim() || !apiKey) return;
    setLoading(true);
    try {
      const resp = await chat(apiKey, "你是认知行为疗法专家。帮对方识别负面想法中的认知扭曲，用理性思考重新框架。直接输出：1. 识别扭曲类型 2. 理性回应 3. 替代想法。控制在150字内。", `我的负面想法：${negative}`, model, baseUrl);
      setReframe(resp);
    } catch {}
    setLoading(false);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-purple-500" /><h3 className="font-semibold">焦虑认知重构</h3></div>
        <p className="text-sm text-muted-foreground">写下你脑中反复出现的负面想法，AI 帮你识别认知扭曲并重新思考。</p>
        <textarea
          value={negative}
          onChange={(e) => setNegative(e.target.value)}
          placeholder="比如：我觉得自己肯定找不到好工作..."
          className="w-full border rounded-xl p-3 text-sm resize-none"
          rows={3}
        />
        <Button onClick={handleReframe} disabled={!negative.trim() || loading || !apiKey} className="w-full">
          {loading ? "思考中..." : "重新框架"}
        </Button>
        {reframe && (
          <div className="p-4 rounded-xl bg-purple-50 text-sm leading-relaxed">
            <ReactMarkdown>{reframe}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import ReactMarkdown from "react-markdown";

export default function ToolkitPage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">减压工具箱</h2>
        <BreathingExercise />
        <AffirmationCards />
        <AnxietyReframe />
        {/* Recovery protocol */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-green-500" /><h3 className="font-semibold">被拒恢复三步走</h3></div>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-xl bg-red-50">
                <p className="font-medium text-red-700 mb-1">立即期 · 当天</p>
                <p className="text-red-600/70">允许自己难过，想哭就哭。暂时别看招聘信息，做件让你开心的小事。</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50">
                <p className="font-medium text-amber-700 mb-1">冷静期 · 1-3 天后</p>
                <p className="text-amber-600/70">客观回顾失败原因，沉淀错题，重新校准方向。</p>
              </div>
              <div className="p-3 rounded-xl bg-green-50">
                <p className="font-medium text-green-700 mb-1">重启期 · 3-7 天后</p>
                <p className="text-green-600/70">用新的认知重新出发，把经历变成经验。</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
