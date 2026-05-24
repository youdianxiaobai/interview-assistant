"use client";
import { useState } from "react";
import { useUserStore } from "@/lib/store/user-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { createQuestion } from "@/lib/supabase/queries/questions";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, Check, RotateCw, Save, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface GeneratedQuestion {
  content: string;
  reference_answer: string;
  tags: string[];
  difficulty: string;
  saved: boolean;
  error?: string;
}

export function BatchGenerateDialog() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState("");
  const [type, setType] = useState<"tech" | "behavioral">("tech");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState("");

  const currentUserId = useUserStore((s) => s.currentUserId);
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const model = useSettingsStore((s) => s.deepseekModel);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const qc = useQueryClient();

  const handleGenerate = async () => {
    if (!position.trim() || !apiKey) return;
    setLoading(true);
    setError("");
    setQuestions([]);

    try {
      const resp = await fetch("/api/questions/batch-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, position, type, difficulty, count, model, baseUrl }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "生成失败");

      const qs: GeneratedQuestion[] = (data.questions || []).map(
        (q: Record<string, unknown>) => ({
          content: String(q.content || ""),
          reference_answer: String(q.reference_answer || ""),
          tags: Array.isArray(q.tags) ? q.tags.map(String) : [],
          difficulty: String(q.difficulty || difficulty),
          saved: false,
        })
      );

      if (qs.length === 0) throw new Error("AI 未返回有效题目");
      setQuestions(qs);
      toast.success(`生成了 ${qs.length} 道题`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知错误";
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  const handleRetryOne = async (index: number) => {
    if (!apiKey) return;
    toast.loading("重新生成第 " + (index + 1) + " 题...");
    try {
      const resp = await fetch("/api/questions/batch-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, position, type, difficulty, count: 1, model, baseUrl }),
      });
      const data = await resp.json();
      if (data.questions?.[0]) {
        setQuestions((prev) => {
          const next = [...prev];
          next[index] = { ...data.questions[0], difficulty, saved: false };
          return next;
        });
        toast.dismiss();
        toast.success("已重新生成");
      }
    } catch {
      toast.dismiss();
      toast.error("重试失败");
    }
  };

  const handleSaveOne = async (q: GeneratedQuestion, index: number) => {
    if (!currentUserId) return;
    try {
      await createQuestion({
        user_id: currentUserId,
        position,
        type,
        difficulty: q.difficulty as "easy" | "medium" | "hard",
        source: "ai",
        content: q.content,
        reference_answer: q.reference_answer,
        tags: [...q.tags, position],
      });
      setQuestions((prev) =>
        prev.map((x, i) => (i === index ? { ...x, saved: true } : x))
      );
      toast.success("已保存");
    } catch {
      toast.error("保存失败");
    }
  };

  const handleSaveAll = async () => {
    if (!currentUserId) return;
    let saved = 0;
    for (let i = 0; i < questions.length; i++) {
      if (questions[i].saved) continue;
      try {
        await createQuestion({
          user_id: currentUserId,
          position,
          type,
          difficulty: questions[i].difficulty as "easy" | "medium" | "hard",
          source: "ai",
          content: questions[i].content,
          reference_answer: questions[i].reference_answer,
          tags: [...questions[i].tags, position],
        });
        saved++;
        setQuestions((prev) => prev.map((x, j) => (j === i ? { ...x, saved: true } : x)));
      } catch { /* skip */ }
    }
    qc.invalidateQueries({ queryKey: ["questions"] });
    toast.success(`已保存 ${saved} 道题`);
    if (saved === questions.filter((q) => !q.saved).length + questions.filter((q) => q.saved).length)
      setOpen(false);
  };

  const handleClose = () => {
    if (questions.length > 0 && questions.some((q) => !q.saved)) {
      const unsaved = questions.filter((q) => !q.saved).length;
      if (!confirm(`还有 ${unsaved} 道题未保存，确定关闭吗？`)) return;
    }
    setOpen(false);
    setQuestions([]);
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl gap-1.5">
          <Sparkles className="w-4 h-4 text-accent" />
          批量生成
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            批量生成面试题
          </DialogTitle>
          <DialogDescription>AI 一次生成多道题，逐题查看后可选择保存</DialogDescription>
        </DialogHeader>

        {questions.length === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>目标岗位</Label>
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="如：跨境电商运营"
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>题型</Label>
                <Select value={type} onValueChange={(v) => setType(v as "tech" | "behavioral")}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">专业面</SelectItem>
                    <SelectItem value="behavioral">行为面</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>难度</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as "easy" | "medium" | "hard")}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">简单</SelectItem>
                    <SelectItem value="medium">中等</SelectItem>
                    <SelectItem value="hard">困难</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>数量</Label>
                <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 道</SelectItem>
                    <SelectItem value="5">5 道</SelectItem>
                    <SelectItem value="10">10 道</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!position.trim() || loading || !apiKey}
              className="w-full rounded-xl"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />生成中...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />开始生成 {count} 道题</>
              )}
            </Button>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="space-y-3 py-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border/40 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        )}

        {questions.length > 0 && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                已生成 {questions.length} 道 · 已保存 {questions.filter((q) => q.saved).length} 道
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg text-xs"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  <RotateCw className="w-3 h-3 mr-1" />重新生成
                </Button>
                <Button size="sm" className="rounded-lg text-xs" onClick={handleSaveAll}>
                  <Save className="w-3 h-3 mr-1" />全部保存
                </Button>
              </div>
            </div>

            {questions.map((q, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border transition-all ${
                  q.saved
                    ? "bg-emerald-50/50 border-emerald-200"
                    : "bg-card border-border/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      q.saved
                        ? "bg-emerald-500 text-white"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {q.saved ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-1">{q.content}</p>
                    {q.reference_answer && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
                        {q.reference_answer}
                      </p>
                    )}
                    <div className="flex gap-1.5 flex-wrap">
                      {q.tags.map((t, j) => (
                        <Badge key={j} variant="secondary" className="text-[10px] rounded-md">
                          {t}
                        </Badge>
                      ))}
                      <Badge
                        className={`text-[10px] rounded-md ${
                          q.difficulty === "hard"
                            ? "bg-destructive/10 text-destructive"
                            : q.difficulty === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {q.difficulty === "hard" ? "困难" : q.difficulty === "medium" ? "中等" : "简单"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {!q.saved && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-xs h-7"
                          onClick={() => handleSaveOne(q, i)}
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-lg text-xs h-7"
                          onClick={() => handleRetryOne(i)}
                        >
                          <RotateCw className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!apiKey && (
          <p className="text-xs text-destructive/80 text-center">
            请先在设置页面配置 DeepSeek API Key
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
