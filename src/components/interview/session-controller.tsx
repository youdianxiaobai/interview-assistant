"use client";
import { useInterviewStore } from "@/lib/store/interview-store";
import { Button } from "@/components/ui/button";
import { Pause, Play, Square } from "lucide-react";
import { useRouter } from "next/navigation";

export function SessionController({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const { session, setPhase, reset } = useInterviewStore();
  if (!session) return null;
  return (
    <div className="flex justify-between items-center pt-4 border-t">
      <div className="flex gap-2">
        {session.phase !== "finished" && (
          <Button variant="ghost" size="sm" onClick={() => setPhase(session.phase === "ready" ? "questioning" : "ready")}>
            {session.phase === "ready" ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}暂停
          </Button>
        )}
      </div>
      <Button variant="destructive" size="sm" onClick={() => { reset(); router.push("/interview/new"); }}>
        <Square className="w-4 h-4 mr-1" />结束面试
      </Button>
    </div>
  );
}
