"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { supabase } from "@/lib/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ArrowUpRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import toast from "react-hot-toast";

const MOODS = [
  { emoji: "😄", label: "很棒", value: 5 },
  { emoji: "😊", label: "不错", value: 4 },
  { emoji: "😐", label: "一般", value: 3 },
  { emoji: "😟", label: "不太好", value: 2 },
  { emoji: "😢", label: "很差", value: 1 },
];

async function fetchMoods(userId: string) {
  const { data } = await supabase
    .from("mood_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  return data ?? [];
}

export default function MoodPage() {
  const { currentUserId } = useUserStore();
  const qc = useQueryClient();
  const { data: moods } = useQuery({
    queryKey: ["moods", currentUserId],
    queryFn: () => fetchMoods(currentUserId!),
    enabled: !!currentUserId,
    staleTime: 30000,
  });
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const logMood = async (value: number) => {
    if (!currentUserId) return;
    setSaving(true);
    await supabase.from("mood_logs").insert({
      user_id: currentUserId,
      mood: String(value),
      note,
    });
    qc.invalidateQueries({ queryKey: ["moods"] });
    toast.success("心情已记录");
    setNote("");
    setSaving(false);
  };

  const chartData = (moods ?? [])
    .slice()
    .reverse()
    .map((m) => ({
      time: new Date(m.created_at).toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      }),
      mood: Number(m.mood),
    }));

  // Recent mood summary
  const recentAverage =
    moods && moods.length > 0
      ? Math.round(
          (moods.slice(0, 7).reduce((sum, m) => sum + Number(m.mood), 0) /
            Math.min(7, moods.length)) *
            10,
        ) / 10
      : null;

  const recentMoodEmoji =
    recentAverage !== null
      ? MOODS.find((m) => m.value === Math.round(recentAverage))?.emoji
      : null;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display">情绪追踪</h2>
            <p className="text-sm text-muted-foreground">
              记录心情，了解自己的情绪节奏
            </p>
          </div>
        </div>

        {/* Recent mood summary */}
        {recentAverage !== null && (
          <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                {recentMoodEmoji || "😐"}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">近 7 日心情均值</p>
                <p className="text-lg font-semibold">{recentAverage} / 5</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        )}

        {/* Mood selector */}
        <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm font-medium">现在感觉怎么样？</p>
            <div className="flex justify-between">
              {MOODS.map(({ emoji, label, value }) => (
                <button
                  key={value}
                  onClick={() => logMood(value)}
                  disabled={saving}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 hover:bg-muted/60 hover:scale-110 active:scale-95"
                >
                  <span className="text-4xl">{emoji}</span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </button>
              ))}
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="记录此刻的想法（可选）..."
              rows={2}
              className="resize-none rounded-xl"
            />
            <Button
              onClick={() => {
                // Quick save with neutral mood + note
                if (note.trim()) {
                  logMood(3);
                } else {
                  toast.error("请选择心情或输入备注");
                }
              }}
              disabled={!note.trim() || saving}
              variant="outline"
              className="w-full rounded-xl"
            >
              仅记录文字
            </Button>
          </CardContent>
        </Card>

        {/* Mood chart */}
        {chartData.length > 1 && (
          <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">心情趋势（近 30 次）</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis
                    domain={[0, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="hsl(224, 28%, 25%)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(40, 60%, 52%)" }}
                    activeDot={{ r: 6, fill: "hsl(40, 60%, 52%)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* History */}
        <div className="space-y-2">
          <h3 className="font-semibold">记录历史</h3>
          {(!moods || moods.length === 0) && (
            <p className="text-sm text-muted-foreground">点击表情记录第一条心情吧</p>
          )}
          {moods?.map((m) => (
            <Card
              key={m.id}
              className="rounded-xl shadow-sm border border-border/40 bg-card"
            >
              <CardContent className="p-4 flex items-center gap-4">
                <span className="text-2xl">
                  {MOODS[5 - Number(m.mood)]?.emoji || "😐"}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString("zh-CN", {
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {m.note && (
                    <p className="text-sm mt-1 text-foreground/80">{m.note}</p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs rounded-lg">
                  {MOODS[5 - Number(m.mood)]?.label}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}