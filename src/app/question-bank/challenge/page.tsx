"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { fetchWrongQuestions } from "@/lib/supabase/queries/wrong-questions";
import { createChallenge } from "@/lib/supabase/queries/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ChallengePage() {
  const { currentUserId, profiles } = useUserStore();
  const router = useRouter();
  const opponent = profiles.find((p) => p.id !== currentUserId);

  const { data: opponentWrongs } = useQuery({
    queryKey: ["wrong-questions", opponent?.id],
    queryFn: () => fetchWrongQuestions(opponent!.id),
    enabled: !!opponent,
  });

  const handleStartChallenge = async () => {
    if (!currentUserId || !opponentWrongs?.length) return;
    const qids = opponentWrongs.slice(0, 5).map((wq) => wq.question?.id!).filter(Boolean);
    const challengeId = await createChallenge(currentUserId, qids);
    toast.success("挑战已创建");
    router.push(`/interview/new?mode=challenge&challengeId=${challengeId}`);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">互相挑战</h2>
        {!opponent ? (
          <p className="text-muted-foreground">需要先创建另一个用户</p>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p>用 <strong>{opponent.name}</strong> 的错题生成挑战试卷</p>
              <p className="text-sm text-muted-foreground">当前错题数：{opponentWrongs?.length ?? 0}</p>
              <Button onClick={handleStartChallenge} disabled={!opponentWrongs?.length}>开始挑战</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
