"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { fetchHistory } from "@/lib/supabase/queries/interviews";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDuration } from "@/lib/utils";
import { CardListSkeleton } from "@/components/skeletons";
import type { Interview } from "@/types";
import {
  Clock,
  Calendar,
  ChevronRight,
  ScrollText,
  ArrowRight,
} from "lucide-react";

const MODE_LABEL: Record<string, string> = {
  practice: "练习模式",
  coach: "教练模式",
  mock: "模拟模式",
  challenge: "挑战模式",
};

export default function HistoryPage() {
  const { currentUserId } = useUserStore();
  const router = useRouter();

  const { data: history, isLoading } = useQuery<Interview[]>({
    queryKey: ["interview-history", currentUserId],
    queryFn: () => fetchHistory(currentUserId!),
    enabled: !!currentUserId,
    staleTime: 30_000,
  });

  const navigate = (href: string) => {
    startTransition(() => router.push(href));
  };

  const isEmpty = !isLoading && (!history || history.length === 0);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            面试历史
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            查看过往面试记录与报告
          </p>
        </div>

        {/* Loading skeleton */}
        {isLoading && <CardListSkeleton count={6} />}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <ScrollText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              还没有面试记录
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              完成第一场模拟面试后，你的历史记录会出现在这里
            </p>
            <Button
              onClick={() => navigate("/interview/new")}
              className="rounded-xl"
            >
              开始第一场面试
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}

        {/* History list */}
        {history && history.length > 0 && (
          <div className="space-y-3">
            {history.map((iv) => (
              <Card
                key={iv.id}
                className="cursor-pointer card-hover border border-border/40 shadow-sm rounded-xl bg-card group"
                onClick={() => navigate(`/interview/${iv.id}/result`)}
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Mode icon */}
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ScrollText className="w-5 h-5 text-primary" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm text-foreground">
                          {iv.position}
                        </h3>
                        <Badge
                          variant="outline"
                          className="rounded-lg border-border/60 text-xs font-normal"
                        >
                          {MODE_LABEL[iv.mode] || iv.mode}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="rounded-lg text-xs font-normal"
                        >
                          {iv.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(iv.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(iv.duration || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="hidden sm:inline text-sm text-muted-foreground">
                      查看报告
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
