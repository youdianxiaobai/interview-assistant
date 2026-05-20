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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";

export default function WrongPage() {
  const { currentUserId } = useUserStore();
  const qc = useQueryClient();

  const { data: wqs } = useQuery({
    queryKey: ["wrong-questions", currentUserId],
    queryFn: () => fetchWrongQuestions(currentUserId!),
    enabled: !!currentUserId,
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [appr, setAppr] = useState("");

  const save = async (id: string) => {
    await updateWrongQuestion(id, {
      review_notes: notes,
      wrong_reason: reason,
      correct_approach: appr,
    });
    qc.invalidateQueries({ queryKey: ["wrong-questions"] });
    setEditId(null);
    toast.success("已保存");
  };

  const master = async (id: string) => {
    await updateWrongQuestion(id, { is_mastered: true });
    qc.invalidateQueries({ queryKey: ["wrong-questions"] });
    toast.success("已掌握");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">错题集</h2>
        <WrongStats userId={currentUserId!} />
        {wqs?.length === 0 && (
          <p className="text-muted-foreground text-center py-8">还没有错题</p>
        )}
        <div className="space-y-4">
          {wqs?.map((wq) => (
            <Card key={wq.id}>
              <CardContent className="pt-6 space-y-3">
                <p className="font-medium">{wq.question?.content}</p>
                <div className="flex gap-2">
                  <Badge variant="outline">重试 {wq.retry_count} 次</Badge>
                  <Badge variant="outline">
                    {new Date(wq.last_wrong_at).toLocaleDateString()}
                  </Badge>
                </div>
                {editId === wq.id ? (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="答错原因"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <Textarea
                      placeholder="正确思路"
                      value={appr}
                      onChange={(e) => setAppr(e.target.value)}
                    />
                    <Textarea
                      placeholder="复盘笔记"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => save(wq.id)}>保存</Button>
                      <Button variant="outline" onClick={() => setEditId(null)}>
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditId(wq.id);
                        setNotes(wq.review_notes);
                        setReason(wq.wrong_reason);
                        setAppr(wq.correct_approach);
                      }}
                    >
                      {wq.review_notes ? "编辑复盘" : "写复盘"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => master(wq.id)}
                    >
                      标为已掌握
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
