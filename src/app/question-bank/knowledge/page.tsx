"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { BatchKnowledgeDialog } from "@/components/question-bank/batch-knowledge-dialog";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import {
  Library,
  Plus,
  RefreshCw,
  BookOpen,
  Save,
} from "lucide-react";
import type { KnowledgeCard } from "@/types";

async function fetchCards(userId: string): Promise<KnowledgeCard[]> {
  const { data } = await supabase
    .from("knowledge_cards")
    .select("*")
    .eq("user_id", userId)
    .order("next_review_at", { ascending: true });
  return data ?? [];
}

export default function KnowledgePage() {
  const { currentUserId } = useUserStore();
  const qc = useQueryClient();

  const { data: cards, isLoading } = useQuery({
    queryKey: ["knowledge-cards", currentUserId],
    queryFn: () => fetchCards(currentUserId!),
    enabled: !!currentUserId,
  });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [cat, setCat] = useState("");

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCat("");
  };

  const create = async () => {
    if (!currentUserId || !title.trim()) return;
    try {
      const next = new Date();
      next.setDate(next.getDate() + 1);
      await supabase.from("knowledge_cards").insert({
        user_id: currentUserId,
        title,
        content,
        category: cat,
        next_review_at: next.toISOString(),
      });
      qc.invalidateQueries({ queryKey: ["knowledge-cards"] });
      toast.success("知识卡片已创建");
      setOpen(false);
      resetForm();
    } catch {
      toast.error("创建失败，请重试");
    }
  };

  const review = async (card: KnowledgeCard) => {
    try {
      const ef = Math.max(1.3, (card.easiness_factor ?? 2.5) + 0.1);
      const days = Math.round(
        card.review_count === 0 ? 1 : card.review_count * ef
      );
      const next = new Date();
      next.setDate(next.getDate() + days);
      await supabase
        .from("knowledge_cards")
        .update({
          easiness_factor: ef,
          next_review_at: next.toISOString(),
          review_count: (card.review_count ?? 0) + 1,
        })
        .eq("id", card.id);
      qc.invalidateQueries({ queryKey: ["knowledge-cards"] });
      toast.success(`已复习，下次：${next.toLocaleDateString("zh-CN")}`);
    } catch {
      toast.error("操作失败");
    }
  };

  return (
    <AppShell>
      <div className="page-container animate-fade-in">
        {/* Header */}
        <div className="section-header">
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
            知识点库
          </h1>
          <div className="flex items-center gap-2">
            <BatchKnowledgeDialog />
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-1.5 shadow-sm">
                  <Plus className="w-4 h-4" />
                  新建卡片
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">新建知识卡片</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      标题
                    </label>
                    <Input
                      placeholder="如：FOB 术语解释"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      分类
                    </label>
                    <Input
                      placeholder="如：贸易术语"
                      value={cat}
                      onChange={(e) => setCat(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      内容
                    </label>
                    <Textarea
                      placeholder="支持 Markdown 格式..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={6}
                      className="rounded-xl resize-none"
                    />
                  </div>
                  <Button
                    onClick={create}
                    disabled={!title.trim()}
                    className="w-full rounded-xl gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    保存卡片
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && cards?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <p className="text-base font-medium text-foreground/60">还没有知识卡片</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              创建卡片来记录面试知识点，支持间隔复习
            </p>
          </div>
        )}

        {/* Knowledge cards */}
        <div className="space-y-3">
          {cards?.map((card) => (
            <Card
              key={card.id}
              className="rounded-2xl shadow-sm border border-border/40 bg-card card-hover animate-fade-in-scale"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Title + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-semibold text-foreground text-base">
                        {card.title}
                      </h3>
                      {card.category && (
                        <Badge variant="secondary" className="rounded-lg font-medium text-xs">
                          {card.category}
                        </Badge>
                      )}
                      <Badge variant="outline" className="rounded-lg font-medium text-xs">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        复习 {card.review_count ?? 0} 次
                      </Badge>
                    </div>

                    {/* Content markdown */}
                    {card.content && (
                      <div className="prose prose-sm max-w-none prose-headings:font-display prose-p:font-sans text-muted-foreground">
                        <ReactMarkdown>{card.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Review button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => review(card)}
                    className="rounded-xl gap-1.5 flex-shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    已复习
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
