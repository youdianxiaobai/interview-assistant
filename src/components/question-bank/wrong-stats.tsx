"use client";

import { useQuery } from "@tanstack/react-query";
import { getWeakTags } from "@/lib/supabase/queries/wrong-questions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function WrongStats({ userId }: { userId: string }) {
  const { data: stats } = useQuery({
    queryKey: ["weak-tags", userId],
    queryFn: () => getWeakTags(userId),
    enabled: !!userId,
  });

  if (!stats?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">薄弱点 TOP5</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap">
          {stats.slice(0, 5).map((s) => (
            <Badge key={s.tag} variant="destructive">
              {s.tag} ({s.count}次)
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
