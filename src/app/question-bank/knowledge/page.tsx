"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

  const { data: cards } = useQuery({
    queryKey: ["knowledge-cards", currentUserId],
    queryFn: () => fetchCards(currentUserId!),
    enabled: !!currentUserId,
  });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [cat, setCat] = useState("");

  const create = async () => {
    if (!currentUserId || !title.trim()) return;
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
    toast.success("已创建");
    setOpen(false);
    setTitle("");
    setContent("");
  };

  const review = async (card: KnowledgeCard) => {
    const ef = Math.max(1.3, card.easiness_factor + 0.1);
    const days = Math.round(card.review_count === 0 ? 1 : card.review_count * ef);
    const next = new Date();
    next.setDate(next.getDate() + days);
    await supabase
      .from("knowledge_cards")
      .update({
        easiness_factor: ef,
        next_review_at: next.toISOString(),
        review_count: card.review_count + 1,
      })
      .eq("id", card.id);
    qc.invalidateQueries({ queryKey: ["knowledge-cards"] });
    toast.success(`已复习，下次：${next.toLocaleDateString()}`);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">知识点库</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>新建卡片</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新建知识卡片</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="标题（如：FOB 术语解释）"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Input
                  placeholder="分类（如：贸易术语）"
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                />
                <Textarea
                  placeholder="内容（支持 Markdown）"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                />
                <Button onClick={create} className="w-full">
                  保存
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-3">
          {cards?.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{c.title}</h3>
                      {c.category && (
                        <Badge variant="secondary">{c.category}</Badge>
                      )}
                      <Badge variant="outline">复习 {c.review_count} 次</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                      <ReactMarkdown>{c.content}</ReactMarkdown>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => review(c)}>
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
