"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { fetchWrongQuestions } from "@/lib/supabase/queries/wrong-questions";
import { createChallenge } from "@/lib/supabase/queries/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Swords, UserX, ArrowRight } from "lucide-react";
import { startTransition } from "react";
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
    const qids = opponentWrongs
      .slice(0, 5)
      .map((wq) => wq.question?.id!)
      .filter(Boolean);
    const challengeId = await createChallenge(currentUserId, qids);
    toast.success("挑战已创建");
    startTransition(() => {
      router.push(`/interview/new?mode=challenge&challengeId=${challengeId}`);
    });
  };

  return (
    <AppShell>
      <div className="max-w-xl mx-auto space-y-6">
        <h2 className="text-2xl font-display font-bold tracking-tight">互相挑战</h2>

        {!opponent ? (
          <Card className="border-dashed border-2 border-border/40 bg-transparent rounded-2xl">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <UserX className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <div>
                <p className="font-medium text-sm">还没有其他用户</p>
                <p className="text-xs text-muted-foreground mt-1">
                  需要先创建另一个用户才能发起挑战
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-border/40 shadow-sm rounded-2xl">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Swords className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">挑战对手</p>
                  <p className="text-xs text-muted-foreground">
                    用 <strong>{opponent.name}</strong> 的错题生成挑战试卷
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-lg ml-auto">
                  {opponentWrongs?.length ?? 0} 道错题
                </Badge>
              </div>

              <Button
                onClick={handleStartChallenge}
                disabled={!opponentWrongs?.length}
                className="w-full h-11 rounded-xl"
              >
                <Swords className="w-4 h-4 mr-2" />
                开始挑战
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
