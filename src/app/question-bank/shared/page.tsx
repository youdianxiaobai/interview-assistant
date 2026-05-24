"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchShared, unshareQuestion } from "@/lib/supabase/queries/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/lib/store/user-store";
import { Share2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function SharedPage() {
  const { currentUserId } = useUserStore();
  const qc = useQueryClient();
  const { data: shared, isLoading } = useQuery({
    queryKey: ["shared-questions"],
    queryFn: fetchShared,
  });

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-display font-bold tracking-tight">共享题库池</h2>

        {!isLoading && shared?.length === 0 && (
          <div className="text-center py-16">
            <Share2 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">共享池还没有题目</p>
            <p className="text-xs text-muted-foreground mt-1">
              在题库中选择题目共享给对方
            </p>
          </div>
        )}

        <div className="space-y-3">
          {shared?.map((sq) => (
            <Card key={sq.id} className="border border-border/40 shadow-sm rounded-xl">
              <CardContent className="p-4 space-y-3">
                <p className="font-medium text-sm">{sq.question?.content}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-lg">
                    {sq.question?.position}
                  </Badge>
                  <Badge variant="secondary" className="rounded-lg">
                    {sq.from_user_id === currentUserId ? "我共享的" : "对方共享"}
                  </Badge>
                </div>
                {sq.from_user_id === currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={async () => {
                      await unshareQuestion(sq.id);
                      qc.invalidateQueries({ queryKey: ["shared-questions"] });
                      toast.success("已取消共享");
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    取消共享
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
