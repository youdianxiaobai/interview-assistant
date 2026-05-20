"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { fetchHistory } from "@/lib/supabase/queries/interviews";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDuration } from "@/lib/utils";
import { useRouter } from "next/navigation";

const MODE_LABEL: Record<string, string> = { practice: "练习", coach: "教练", mock: "模拟", challenge: "挑战" };

export default function HistoryPage() {
  const { currentUserId } = useUserStore(); const router = useRouter();
  const { data: history } = useQuery({ queryKey: ["interview-history", currentUserId], queryFn: () => fetchHistory(currentUserId!), enabled: !!currentUserId });

  return (
    <AppShell>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">面试历史</h2>
        {history?.length === 0 && <p className="text-muted-foreground text-center py-8">还没有面试记录</p>}
        <div className="space-y-3">
          {history?.map((iv) => (
            <Card key={iv.id} className="cursor-pointer hover:border-primary" onClick={() => router.push(`/interview/${iv.id}/result`)}>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2"><h3 className="font-medium">{iv.position}</h3><Badge variant="outline">{MODE_LABEL[iv.mode]}</Badge><Badge variant="secondary">{iv.type}</Badge></div>
                  <p className="text-sm text-muted-foreground mt-1">{formatDate(iv.created_at)} · {formatDuration(iv.duration)}</p>
                </div>
                <Button variant="ghost" size="sm">查看报告</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
