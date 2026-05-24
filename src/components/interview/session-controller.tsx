"use client";

import { useState } from "react";
import { useInterviewStore } from "@/lib/store/interview-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Pause, Play, Square, AlertTriangle } from "lucide-react";

interface SessionControllerProps {
  interviewId: string;
}

export function SessionController({ interviewId: _interviewId }: SessionControllerProps) {
  const router = useRouter();
  const { session, setPhase, reset } = useInterviewStore();
  const [showEndDialog, setShowEndDialog] = useState(false);

  if (!session) return null;

  const isFinished = session.phase === "finished";
  const isPaused = session.phase === "ready";

  const handleTogglePause = () => {
    if (isPaused) {
      setPhase("questioning");
    } else if (session.phase === "questioning") {
      setPhase("ready");
    }
  };

  const handleEndInterview = () => {
    setShowEndDialog(false);
    reset();
    router.push("/interview/new");
  };

  return (
    <>
      {/* Pause/End controls */}
      <div
        className={cn(
          "flex items-center justify-between pt-4 border-t border-border/40"
        )}
      >
        <div className="flex items-center gap-2">
          {/* Pause / Resume */}
          {!isFinished && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTogglePause}
              className={cn(
                "transition-all duration-200",
                isPaused && "text-accent hover:text-accent"
              )}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-1.5" />
                  继续面试
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-1.5" />
                  暂停
                </>
              )}
            </Button>
          )}
        </div>

        {/* End interview */}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowEndDialog(true)}
          className="rounded-xl transition-all duration-200"
        >
          <Square className="h-4 w-4 mr-1.5" />
          结束面试
        </Button>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              确认结束面试
            </DialogTitle>
            <DialogDescription>
              结束面试后，当前进度将会丢失。您确定要结束本次面试吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEndDialog(false)}
              className="rounded-xl"
            >
              继续面试
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndInterview}
              className="rounded-xl"
            >
              确认结束
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
