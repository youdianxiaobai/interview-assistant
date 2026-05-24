"use client";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useInterviewStore } from "@/lib/store/interview-store";
import { useInterview } from "@/hooks/use-interview";
import { QuestionDisplay } from "@/components/interview/question-display";
import { AnswerInput } from "@/components/interview/answer-input";
import { FeedbackPanel } from "@/components/interview/feedback-panel";
import { CoachGuide } from "@/components/interview/coach-guide";
import { Teleprompter } from "@/components/interview/teleprompter";
import { SessionController } from "@/components/interview/session-controller";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const modeLabel: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  practice: { label: "练习模式", variant: "secondary" },
  coach: { label: "教练模式", variant: "default" },
  mock: { label: "模拟模式", variant: "outline" },
  challenge: { label: "挑战模式", variant: "secondary" },
};

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const session = useInterviewStore((s) => s.session);
  const { submitAnswer, goNext } = useInterview();

  if (!session) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">面试未初始化</p>
            <Button variant="outline" onClick={() => router.push("/interview/new")} className="rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回配置页
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const q = session.questions[session.currentQuestionIndex];
  const progress =
    session.questions.length > 0
      ? (session.currentQuestionIndex / session.questions.length) * 100
      : 0;
  const m = modeLabel[session.config.mode] ?? modeLabel.practice;

  // Handle auto-finish (e.g. summary mode after last question)
  const finishedHandled = useRef(false);
  useEffect(() => {
    if (session.phase === "finished" && !finishedHandled.current) {
      finishedHandled.current = true;
      goNext(id);
    }
  }, [session.phase, id, goNext]);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress bar */}
        <div className="flex items-center gap-4">
          <Progress value={progress} className="flex-1 h-2 rounded-full" />
          <span className="text-sm text-muted-foreground tabular-nums font-medium min-w-[3ch]">
            {session.currentQuestionIndex + 1}/{session.questions.length}
          </span>
          <Badge variant={m.variant} className="rounded-lg font-medium">
            {m.label}
          </Badge>
        </div>

        {/* Teleprompter */}
        <Teleprompter />

        {/* Question */}
        <QuestionDisplay
          question={q.text}
          questionNumber={session.currentQuestionIndex + 1}
          totalQuestions={session.questions.length}
          mode={session.config.mode}
        />

        {/* Answer Area — shown during questioning / waiting / followup */}
        {(session.phase === "questioning" ||
          session.phase === "waiting_answer" ||
          session.phase === "followup") && (
          <AnswerInput
            interactionMode={session.config.interactionMode}
            language={session.config.language}
            onSubmit={(answer, audioUrl) => submitAnswer(id, answer, audioUrl)}
            onNext={() => goNext(id)}
          />
        )}

        {/* Coach Guidance */}
        {session.phase === "coach_guidance" && q.feedback && (
          <CoachGuide
            guidance={q.feedback.comment}
            onRetry={() => {
              useInterviewStore.getState().setPhase("questioning");
            }}
            onSkip={() => goNext(id)}
          />
        )}

        {/* AI Feedback */}
        {session.phase === "feedback" && q.feedback && (
          <FeedbackPanel feedback={q.feedback} onNext={() => goNext(id)} />
        )}

        {/* Session Controls */}
        <SessionController interviewId={id} />
      </div>
    </AppShell>
  );
}
