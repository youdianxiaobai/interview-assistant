"use client";
import { create } from "zustand";
import type { InterviewConfig, InterviewSession, InterviewPhase, AIFeedback } from "@/types";
import type { FinalReport } from "@/hooks/use-interview";

interface InterviewState {
  session: InterviewSession | null;
  finalReport: FinalReport | null;
  initSession: (config: InterviewConfig, questions: string[]) => void;
  setPhase: (phase: InterviewPhase) => void;
  recordAnswer: (answer: string, audioUrl?: string) => void;
  setFeedback: (feedback: AIFeedback) => void;
  setFeedbackByIndex: (index: number, feedback: AIFeedback) => void;
  setFinalReport: (report: FinalReport) => void;
  setElapsed: (seconds: number) => void;
  nextQuestion: () => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewState>()((set, get) => ({
  session: null,
  finalReport: null,

  initSession: (config, qTexts) =>
    set({
      session: {
        config,
        phase: "questioning" as InterviewPhase,
        currentQuestionIndex: 0,
        questions: qTexts.map((t) => ({
          text: t,
          userAnswer: "",
          feedback: null,
        })),
        startTime: Date.now(),
        elapsedSeconds: 0,
      },
      finalReport: null,
    }),

  setPhase: (phase) =>
    set((s) => (s.session ? { session: { ...s.session, phase } } : {})),

  recordAnswer: (answer, audioUrl) =>
    set((s) => {
      if (!s.session) return {};
      const qs = [...s.session.questions];
      qs[s.session.currentQuestionIndex] = {
        ...qs[s.session.currentQuestionIndex],
        userAnswer: answer,
        userAnswerAudioUrl: audioUrl,
      };
      return { session: { ...s.session, questions: qs } };
    }),

  setFeedback: (feedback) =>
    set((s) => {
      if (!s.session) return {};
      const qs = [...s.session.questions];
      qs[s.session.currentQuestionIndex] = {
        ...qs[s.session.currentQuestionIndex],
        feedback,
      };
      return { session: { ...s.session, questions: qs } };
    }),

  setFeedbackByIndex: (index, feedback) =>
    set((s) => {
      if (!s.session) return {};
      const qs = [...s.session.questions];
      if (index < qs.length) {
        qs[index] = { ...qs[index], feedback };
      }
      return { session: { ...s.session, questions: qs } };
    }),

  setFinalReport: (report) => set({ finalReport: report }),

  setElapsed: (seconds) =>
    set((s) => {
      if (!s.session) return {};
      return { session: { ...s.session, elapsedSeconds: seconds } };
    }),

  nextQuestion: () =>
    set((s) => {
      if (!s.session) return {};
      const next = s.session.currentQuestionIndex + 1;
      return next >= s.session.questions.length
        ? {
            session: {
              ...s.session,
              phase: "finished" as InterviewPhase,
              currentQuestionIndex: next,
              elapsedSeconds: Math.floor(
                (Date.now() - (s.session.startTime ?? Date.now())) / 1000
              ),
            },
          }
        : { session: { ...s.session, currentQuestionIndex: next } };
    }),

  reset: () => set({ session: null, finalReport: null }),
}));
