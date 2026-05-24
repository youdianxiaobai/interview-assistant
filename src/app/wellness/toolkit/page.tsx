"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUserStore } from "@/lib/store/user-store";
import { supabase } from "@/lib/supabase/client";
import { chat, formatAIError } from "@/lib/ai/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Wind,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  Star,
  Trophy,
  Plus,
  Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

// ── 深呼吸练习 ──
function BreathingExercise() {
  const [phase, setPhase] = useState<"idle" | "inhale" | "hold" | "exhale">("idle");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) {
      setPhase("idle");
      setSeconds(0);
      return;
    }
    const phaseTime = seconds % 14;
    if (phaseTime < 4) setPhase("inhale");
    else if (phaseTime < 8) setPhase("hold");
    else setPhase("exhale");
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    if (seconds >= 70) {
      setRunning(false);
      setSeconds(0);
      setPhase("idle");
    }
    return () => clearInterval(timer);
  }, [running, seconds]);

  const size = 160;
  const scale =
    phase === "inhale" ? 1.2 : phase === "hold" ? 1.2 : phase === "exhale" ? 0.85 : 1;
  const phaseLabel = {
    idle: "开始",
    inhale: "吸气 4 秒",
    hold: "屏息 4 秒",
    exhale: "呼气 6 秒",
  };
  const phaseBg = {
    idle: "bg-primary/5",
    inhale: "bg-primary/15",
    hold: "bg-primary/25",
    exhale: "bg-primary/10",
  };

  return (
    <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
      <CardContent className="p-8 flex flex-col items-center space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <Wind className="w-4 h-4 text-accent" />
          </div>
          <h3 className="font-semibold">深呼吸练习</h3>
        </div>
        <div
          className={`${phaseBg[phase]} rounded-full flex items-center justify-center transition-all duration-1000 shadow-sm`}
          style={{ width: size * scale, height: size * scale }}
        >
          <span className="text-5xl">
            {phase === "inhale" ? "🫁" : phase === "exhale" ? "🌊" : "🧘"}
          </span>
        </div>
        <Badge
          variant="outline"
          className="text-base px-4 py-1.5 rounded-lg border-2 border-primary/20 text-primary"
        >
          {phaseLabel[phase]}
        </Badge>
        <p className="text-sm text-muted-foreground text-center">
          4-4-6 呼吸法：吸气 4 秒 → 屏息 4 秒 → 呼气 6 秒，共 5 轮
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setRunning(!running);
              if (phase === "idle") setSeconds(0);
            }}
            variant={running ? "outline" : "default"}
            className={
              running
                ? "rounded-xl"
                : "rounded-xl bg-primary hover:bg-primary/90 shadow-sm"
            }
          >
            {running ? (
              <>
                <Pause className="w-4 h-4 mr-2" />暂停
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />开始
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            className="rounded-xl"
            onClick={() => {
              setRunning(false);
              setSeconds(0);
              setPhase("idle");
            }}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重置
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── 积极心理暗示卡 ──
const DEFAULT_AFFIRMATIONS = [
  { title: "我已经很努力了", body: "每次面试都是一次练习，我在不断进步。" },
  { title: "被拒不是否定我", body: "不匹配不代表我不好，只是还没有找到对的地方。" },
  { title: "我可以紧张", body: "紧张说明我在乎，这很正常。深呼吸，我可以的。" },
  { title: "我的经历有价值", body: "每一个项目、每一次实习都塑造了现在的我。" },
];

function AffirmationCards() {
  const [cards, setCards] = useState(DEFAULT_AFFIRMATIONS);
  const [index, setIndex] = useState(0);
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const model = useSettingsStore((s) => s.deepseekModel);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      const resp = await chat(
        apiKey,
        "你是积极心理学专家。生成5条适合求职者的积极心理暗示。输出JSON: [{\"title\":\"...\",\"body\":\"...\"}]",
        "",
        model,
        baseUrl,
      );
      const j = JSON.parse(resp);
      if (Array.isArray(j)) {
        setCards(j);
        setIndex(0);
      }
    } catch (err) {
      console.error("AI 心理暗示卡生成失败:", formatAIError(err));
      toast.error("AI 生成失败，请检查 API 设置");
    }
    setLoading(false);
  };

  const current = cards[index % cards.length];

  return (
    <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <h3 className="font-semibold">积极心理暗示卡</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={generate}
            disabled={loading || !apiKey}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            AI 换一批
          </Button>
        </div>

        {/* Current card */}
        <div
          className="p-6 rounded-2xl bg-accent/5 border border-accent/15 text-center cursor-pointer card-hover"
          onClick={() => setIndex((i) => i + 1)}
        >
          <p className="font-semibold text-lg mb-2">{current.title}</p>
          <p className="text-sm text-muted-foreground">{current.body}</p>
          <p className="text-xs text-muted-foreground mt-3">
            点击切换 ({index + 1}/{cards.length})
          </p>
        </div>

        {/* Mini grid of all cards */}
        <div className="grid grid-cols-2 gap-2">
          {cards.slice(0, 4).map((c, i) => (
            <div
              key={i}
              onClick={() => setIndex(i)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                i === index % cards.length
                  ? "bg-accent/10 border-accent/30"
                  : "bg-muted/30 border-border/20 hover:bg-muted/50"
              }`}
            >
              <p className="font-medium text-xs mb-0.5 truncate">{c.title}</p>
              <p className="text-xs text-muted-foreground truncate">{c.body}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── 高光时刻 ──
async function fetchAchievements(userId: string) {
  const { data } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

function HighlightMoments() {
  const { currentUserId } = useUserStore();
  const qc = useQueryClient();
  const { data: achievements } = useQuery({
    queryKey: ["achievements", currentUserId],
    queryFn: () => fetchAchievements(currentUserId!),
    enabled: !!currentUserId,
    staleTime: 30000,
  });
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const addAchievement = async () => {
    if (!text.trim() || !currentUserId) return;
    setSaving(true);
    const { error } = await supabase.from("achievements").insert({
      user_id: currentUserId,
      content: text.trim(),
    });
    if (error) {
      toast.error("保存失败");
    } else {
      toast.success("高光时刻已记录");
      setText("");
      qc.invalidateQueries({ queryKey: ["achievements", currentUserId] });
    }
    setSaving(false);
  };

  const deleteAchievement = async (id: string) => {
    await supabase.from("achievements").delete().eq("id", id);
    toast.success("已删除");
    qc.invalidateQueries({ queryKey: ["achievements", currentUserId] });
  };

  return (
    <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-accent" />
          </div>
          <h3 className="font-semibold">高光时刻</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          记录那些让你骄傲的瞬间 — 无论大小，成功拿到面试机会、完成一次不错的回答、甚至只是勇敢投递了简历。
        </p>

        {/* Add */}
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="写下最近的成就或进步..."
            className="rounded-xl"
            onKeyDown={(e) => {
              if (e.key === "Enter") addAchievement();
            }}
          />
          <Button
            size="icon"
            className="rounded-xl bg-accent hover:bg-accent/90 shadow-sm flex-shrink-0"
            onClick={addAchievement}
            disabled={!text.trim() || saving}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* List */}
        {achievements && achievements.length > 0 && (
          <div className="space-y-2">
            {achievements.map((a: any) => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/20 group"
              >
                <Star className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{a.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(a.created_at).toLocaleDateString("zh-CN", {
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => deleteAchievement(a.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {(!achievements || achievements.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">
            还没有记录，写下你的第一个高光时刻吧
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── 页面 ──
export default function ToolkitPage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Wind className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display">减压工具箱</h2>
            <p className="text-sm text-muted-foreground">
              面试压力管理工具，帮你保持最佳状态
            </p>
          </div>
        </div>
        <BreathingExercise />
        <AffirmationCards />
        <HighlightMoments />
      </div>
    </AppShell>
  );
}
