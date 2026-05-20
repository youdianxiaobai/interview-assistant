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

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>();
  const session = useInterviewStore((s) => s.session);
  const { submitAnswer, goNext } = useInterview();

  if (!session) {
    return <AppShell><div className="flex items-center justify-center h-full"><p>面试未初始化，请返回配置页</p></div></AppShell>;
  }

  const q = session.questions[session.currentQuestionIndex];
  const progress = ((session.currentQuestionIndex) / session.questions.length) * 100;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Progress value={progress} className="flex-1" />
          <span className="text-sm text-muted-foreground">{session.currentQuestionIndex + 1}/{session.questions.length}</span>
          <Badge variant="outline">
            {session.config.mode === "practice" ? "练习" : session.config.mode === "coach" ? "教练" : session.config.mode === "mock" ? "模拟" : "挑战"}
          </Badge>
        </div>

        <Teleprompter />
        <QuestionDisplay question={q.text} />

        {(session.phase === "questioning" || session.phase === "waiting_answer" || session.phase === "followup") && (
          <AnswerInput
            interactionMode={session.config.interactionMode}
            language={session.config.language}
            onSubmit={(answer, audioUrl) => submitAnswer(id, answer, audioUrl)}
            onNext={() => goNext(id)}
          />
        )}

        {session.phase === "coach_guidance" && q.feedback && (
          <CoachGuide guidance={q.feedback.comment} onRetry={() => { useInterviewStore.getState().setPhase("questioning"); }} />
        )}

        {session.phase === "feedback" && q.feedback && (
          <FeedbackPanel feedback={q.feedback} onNext={() => goNext(id)} />
        )}

        <SessionController interviewId={id} />
      </div>
    </AppShell>
  );
}
