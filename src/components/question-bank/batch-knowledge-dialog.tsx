"use client";
/**
 * 知识点批量生成对话框 + 翻转卡片模式
 * 路径: src/components/question-bank/batch-knowledge-dialog.tsx
 */
import { useState } from "react";
import { useUserStore } from "@/lib/store/user-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { supabase } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, Loader2, Check, RotateCw, Save, FlipHorizontal, Download } from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";

interface GenCard {
  title: string;
  content: string;
  category: string;
  tags: string[];
  key_points: string[];
  saved: boolean;
  flipped: boolean;
}

export function BatchKnowledgeDialog() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState("");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<GenCard[]>([]);
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
    setCards([]);

    try {
      const system = `你是${position}岗位的培训专家。请生成${count}张知识点卡片。
每张卡片包含：标题、详细解释（Markdown格式）、所属分类、标签、3个关键要点。
输出JSON: {"cards":[{"title":"...","content":"...","category":"...","tags":["..."],"key_points":["...","...","..."]}]}
分类参考：贸易术语、SOP流程、核心概念、业务流程、行业规范、岗位技能
内容要求：专业准确，每张卡片150-300字，适合背诵记忆。`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const resp = await fetch(`${baseUrl || "https://api.deepseek.com"}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: model || "deepseek-v4-flash",
          max_tokens: count * 400,
          messages: [
            { role: "system", content: system },
            { role: "user", content: `请为${position}岗位生成${count}张知识点卡片。` },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) throw new Error(`API 错误: ${resp.status}`);
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || "";
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
      const parsed = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text);
      const genCards: GenCard[] = (parsed.cards || []).map((c: Record<string, unknown>) => ({
        title: String(c.title || ""),
        content: String(c.content || ""),
        category: String(c.category || ""),
        tags: Array.isArray(c.tags) ? c.tags.map(String) : [],
        key_points: Array.isArray(c.key_points) ? c.key_points.map(String) : [],
        saved: false,
        flipped: false,
      }));

      if (genCards.length === 0) throw new Error("AI 未返回有效卡片");
      setCards(genCards);
      toast.success(`生成了 ${genCards.length} 张卡片`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知错误";
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  const handleSaveOne = async (card: GenCard, index: number) => {
    if (!currentUserId) return;
    const next = new Date();
    next.setDate(next.getDate() + 1);
    try {
      await supabase.from("knowledge_cards").insert({
        user_id: currentUserId,
        title: card.title,
        content: card.content,
        category: card.category,
        tags: card.tags,
        next_review_at: next.toISOString(),
      });
      setCards((prev) => prev.map((c, i) => i === index ? { ...c, saved: true } : c));
      toast.success("已保存");
    } catch { toast.error("保存失败"); }
  };

  const handleSaveAll = async () => {
    if (!currentUserId) return;
    const next = new Date();
    next.setDate(next.getDate() + 1);
    let saved = 0;
    for (const card of cards) {
      if (card.saved) continue;
      try {
        await supabase.from("knowledge_cards").insert({
          user_id: currentUserId,
          title: card.title,
          content: card.content,
          category: card.category,
          tags: card.tags,
          next_review_at: next.toISOString(),
        });
        saved++;
      } catch { /* skip */ }
    }
    qc.invalidateQueries({ queryKey: ["knowledge-cards"] });
    toast.success(`已保存 ${saved} 张`);
    setCards((prev) => prev.map((c) => ({ ...c, saved: true })));
    if (saved === cards.length) setOpen(false);
  };

  const handleExportMarkdown = () => {
    const md = cards.map((c) =>
      `## ${c.title}\n> 分类: ${c.category}\n> 标签: ${c.tags.join(", ")}\n\n${c.content}\n\n关键要点:\n${c.key_points.map((kp) => `- ${kp}`).join("\n")}\n\n---`
    ).join("\n\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `knowledge-cards-${position || "export"}.md`;
    a.click();
    toast.success("已导出 Markdown");
  };

  const toggleFlip = (index: number) => {
    setCards((prev) => prev.map((c, i) => i === index ? { ...c, flipped: !c.flipped } : c));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : setOpen(false)}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl gap-1.5 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 hover:border-violet-300">
          <Sparkles className="w-4 h-4 text-violet-500" />
          批量生成
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            批量生成知识点卡片
          </DialogTitle>
          <DialogDescription>AI 按岗位生成知识点卡，支持翻转背诵和导出</DialogDescription>
        </DialogHeader>

        {cards.length === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>岗位/主题</Label>
              <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="如：跨境海运操作、FOB术语..." className="rounded-xl" />
            </div>
            <div>
              <Label>数量</Label>
              <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 张</SelectItem>
                  <SelectItem value="5">5 张</SelectItem>
                  <SelectItem value="10">10 张</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={!position.trim() || loading || !apiKey} className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-md">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />生成中...</> : <><Sparkles className="w-4 h-4 mr-2" />生成 {count} 张卡片</>}
            </Button>
            {error && <p className="text-xs text-rose-500 bg-rose-50 rounded-xl p-2">{error}</p>}
          </div>
        )}

        {loading && (
          <div className="space-y-3 py-4">
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        )}

        {cards.length > 0 && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-stone-500">已生成 {cards.length} 张 · 已保存 {cards.filter((c) => c.saved).length} 张</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={handleExportMarkdown}>
                  <Download className="w-3 h-3 mr-1" />导出 MD
                </Button>
                <Button size="sm" className="rounded-lg text-xs bg-gradient-to-r from-violet-500 to-purple-500" onClick={handleSaveAll}>
                  <Save className="w-3 h-3 mr-1" />全部保存
                </Button>
              </div>
            </div>

            {cards.map((card, i) => (
              <div key={i} className={`p-4 rounded-2xl border transition-all cursor-pointer ${card.saved ? "bg-emerald-50 border-emerald-200" : "bg-white border-stone-200 hover:border-violet-200"}`} onClick={() => toggleFlip(i)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center ${card.saved ? "bg-emerald-500 text-white" : "bg-violet-100 text-violet-600"}`}>
                      {card.saved ? <Check className="w-3 h-3" /> : i + 1}
                    </span>
                    <h4 className="font-semibold text-sm">{card.title}</h4>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <Badge variant="secondary" className="text-[10px] rounded-md">{card.category}</Badge>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-lg" onClick={(e) => { e.stopPropagation(); toggleFlip(i); }}>
                      <FlipHorizontal className="w-3 h-3" />
                    </Button>
                    {!card.saved && (
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-lg text-emerald-500" onClick={(e) => { e.stopPropagation(); handleSaveOne(card, i); }}>
                        <Save className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Flip mode: show front (title+key_points) or back (full content) */}
                {card.flipped ? (
                  <div className="text-sm prose prose-sm max-w-none mt-2 p-3 rounded-xl bg-violet-50">
                    <ReactMarkdown>{card.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="flex gap-1 flex-wrap">
                      {card.tags.map((t, j) => (
                        <Badge key={j} variant="outline" className="text-[10px] rounded-md">{t}</Badge>
                      ))}
                    </div>
                    {card.key_points.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {card.key_points.map((kp, j) => (
                          <li key={j} className="text-xs text-stone-500 flex gap-1">
                            <span className="text-violet-400">•</span> {kp}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-stone-300 mt-2">点击翻转查看详细内容</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
