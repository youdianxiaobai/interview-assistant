"use client";

import { useQuery } from "@tanstack/react-query";
import { getWeakTags } from "@/lib/supabase/queries/wrong-questions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown } from "lucide-react";

export function WrongStats({ userId }: { userId: string }) {
  const { data: stats } = useQuery({
    queryKey: ["weak-tags", userId],
    queryFn: () => getWeakTags(userId),
    enabled: !!userId,
  });

  if (!stats?.length) return null;

  return (
    <Card className="rounded-2xl shadow-sm border border-border/40 bg-card animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-muted-foreground" />
          薄弱知识点 TOP{Math.min(stats.length, 5)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap">
          {stats.slice(0, 5).map((s) => (
            <Badge
              key={s.tag}
              variant="secondary"
              className="rounded-lg font-medium text-sm px-3 py-1"
            >
              {s.tag}
              <span className="ml-1.5 text-xs text-muted-foreground">
                {s.count}次
              </span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
