"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchShared, unshareQuestion } from "@/lib/supabase/queries/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/lib/store/user-store";
import toast from "react-hot-toast";

export default function SharedPage() {
  const { currentUserId } = useUserStore();
  const qc = useQueryClient();
  const { data: shared } = useQuery({ queryKey: ["shared-questions"], queryFn: fetchShared });

  const handleUnshare = async (id: string) => {
    await unshareQuestion(id);
    qc.invalidateQueries({ queryKey: ["shared-questions"] });
    toast.success("已取消共享");
  };

  if (shared?.length === 0) {
    return <AppShell><div className="space-y-6"><h2 className="text-2xl font-bold">共享题库池</h2><p className="text-muted-foreground text-center py-8">共享池还没有题目</p></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">共享题库池</h2>
        <div className="space-y-3">
          {shared?.map((sq) => (
            <Card key={sq.id}>
              <CardContent className="pt-6">
                <p className="font-medium">{sq.question?.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{sq.question?.position}</Badge>
                  <Badge variant="secondary">来自：{sq.from_user_id === currentUserId ? "我" : "对方"}</Badge>
                </div>
                {sq.from_user_id === currentUserId && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => handleUnshare(sq.id)}>取消共享</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
