"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import {
  fetchWrongQuestions,
  updateWrongQuestion,
} from "@/lib/supabase/queries/wrong-questions";
import { WrongStats } from "@/components/question-bank/wrong-stats";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  BookX,
  RotateCcw,
  Calendar,
  Edit3Icon,
  CheckCircle2,
  X,
  Save,
} from "lucide-react";

export default function WrongPage() {
  const { currentUserId } = useUserStore();
  const qc = useQueryClient();

  const { data: wqs, isLoading } = useQuery({
    queryKey: ["wrong-questions", currentUserId],
    queryFn: () => fetchWrongQuestions(currentUserId!),
    enabled: !!currentUserId,
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [appr, setAppr] = useState("");

  const openEdit = (wqId: string, currentNotes: string, currentReason: string, currentAppr: string) => {
    setEditId(wqId);
    setNotes(currentNotes || "");
    setReason(currentReason || "");
    setAppr(currentAppr || "");
  };

  const closeEdit = () => {
    setEditId(null);
    setNotes("");
    setReason("");
    setAppr("");
  };

  const save = async (id: string) => {
    try {
      await updateWrongQuestion(id, {
        review_notes: notes,
        wrong_reason: reason,
        correct_approach: appr,
      });
      qc.invalidateQueries({ queryKey: ["wrong-questions"] });
      closeEdit();
      toast.success("复盘已保存");
    } catch {
      toast.error("保存失败");
    }
  };

  const master = async (id: string) => {
    try {
      await updateWrongQuestion(id, { is_mastered: true });
      qc.invalidateQueries({ queryKey: ["wrong-questions"] });
      toast.success("已标记为掌握");
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
            错题集
          </h1>
        </div>

        {/* Weak stats */}
        {currentUserId && <WrongStats userId={currentUserId} />}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && wqs?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <p className="text-base font-medium text-foreground/60">还没有错题</p>
            <p className="text-sm text-muted-foreground/60 mt-1">继续保持，面试顺利</p>
          </div>
        )}

        {/* Wrong question cards */}
        <div className="space-y-3">
          {wqs?.map((wq) => (
            <Card
              key={wq.id}
              className="rounded-2xl shadow-sm border border-border/40 bg-card animate-fade-in-scale"
            >
              <CardContent className="p-5 space-y-4">
                {/* Question text */}
                <p className="font-sans text-sm leading-relaxed text-foreground/85">
                  {wq.question?.content ?? "（题目已删除）"}
                </p>

                {/* Meta badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="rounded-lg font-medium text-xs">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    重试 {wq.retry_count} 次
                  </Badge>
                  <Badge variant="secondary" className="rounded-lg font-medium text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(wq.last_wrong_at).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Badge>
                  {wq.wrong_reason && (
                    <Badge variant="secondary" className="rounded-lg font-medium text-xs">
                      {wq.wrong_reason.slice(0, 20)}
                      {wq.wrong_reason.length > 20 && "..."}
                    </Badge>
                  )}
                </div>

                {/* Edit mode */}
                {editId === wq.id ? (
                  <div className="space-y-3 p-4 bg-muted/40 rounded-xl border border-border/30">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        答错原因
                      </label>
                      <Textarea
                        placeholder="这道题错在哪里？是概念不清还是思路偏差？"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={2}
                        className="rounded-xl resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        正确思路
                      </label>
                      <Textarea
                        placeholder="正确的解题思路和方法是什么？"
                        value={appr}
                        onChange={(e) => setAppr(e.target.value)}
                        rows={2}
                        className="rounded-xl resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        复盘笔记
                      </label>
                      <Textarea
                        placeholder="总结要点，下次遇到类似问题如何应对..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="rounded-xl resize-none"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => save(wq.id)} className="rounded-xl gap-1.5">
                        <Save className="w-3.5 h-3.5" />
                        保存复盘
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={closeEdit}
                        className="rounded-xl gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Display existing review notes */
                  <>
                    {wq.review_notes && (
                      <div className="p-3 bg-muted/40 rounded-xl border border-border/30">
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">
                          复盘笔记
                        </p>
                        <p className="text-sm text-foreground/75 leading-relaxed">
                          {wq.review_notes}
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-1.5"
                        onClick={() =>
                          openEdit(wq.id, wq.review_notes, wq.wrong_reason, wq.correct_approach)
                        }
                      >
                        <Edit3Icon className="w-3.5 h-3.5" />
                        {wq.review_notes ? "编辑复盘" : "写复盘"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                        onClick={() => master(wq.id)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        标为已掌握
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
