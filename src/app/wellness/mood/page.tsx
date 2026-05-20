"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { supabase } from "@/lib/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import toast from "react-hot-toast";

const MOODS = [
  { emoji: "😄", label: "很棒", value: 5 },
  { emoji: "😊", label: "不错", value: 4 },
  { emoji: "😐", label: "一般", value: 3 },
  { emoji: "😟", label: "不太好", value: 2 },
  { emoji: "😢", label: "很差", value: 1 },
];

async function fetchMoods(userId: string) {
  const { data } = await supabase.from("mood_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30);
  return data ?? [];
}

export default function MoodPage() {
  const { currentUserId } = useUserStore(); const qc = useQueryClient();
  const { data: moods } = useQuery({ queryKey: ["moods", currentUserId], queryFn: () => fetchMoods(currentUserId!), enabled: !!currentUserId });
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const logMood = async (value: number) => {
    if (!currentUserId) return;
    setSaving(true);
    await supabase.from("mood_logs").insert({ user_id: currentUserId, mood: String(value), note });
    qc.invalidateQueries({ queryKey: ["moods"] });
    toast.success("心情已记录");
    setNote("");
    setSaving(false);
  };

  const chartData = (moods ?? []).slice().reverse().map((m) => ({
    time: new Date(m.created_at).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
    mood: Number(m.mood),
  }));

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">情绪追踪</h2>

        {/* Mood input */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm font-medium">现在感觉怎么样？</p>
            <div className="flex justify-between">
              {MOODS.map(({ emoji, label, value }) => (
                <button
                  key={value}
                  onClick={() => logMood(value)}
                  disabled={saving}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
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
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Mood chart */}
        {chartData.length > 1 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">心情趋势（近 30 次）</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="mood" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* History */}
        <div className="space-y-2">
          <h3 className="font-semibold">记录历史</h3>
          {moods?.length === 0 && <p className="text-sm text-muted-foreground">点击表情记录第一条心情吧</p>}
          {moods?.map((m) => (
            <Card key={m.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <span className="text-2xl">{MOODS[5 - Number(m.mood)]?.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {m.note && <p className="text-sm mt-1">{m.note}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
