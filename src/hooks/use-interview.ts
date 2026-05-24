"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/user-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useInterviewStore } from "@/lib/store/interview-store";
import { createInterview, saveQA, updateInterview } from "@/lib/supabase/queries/interviews";
import { fetchQuestionsByPosition } from "@/lib/supabase/queries/questions";
import { chat, formatAIError } from "@/lib/ai/client";
import { buildInterviewerPrompt } from "@/lib/ai/prompts/interviewer";
import { buildCoachPrompt } from "@/lib/ai/prompts/coach";
import { buildFeedbackPrompt, buildFinalReportPrompt, buildSummaryFeedbackPrompt } from "@/lib/ai/prompts/feedback";
import { getWeakTags, addWrongQuestion } from "@/lib/supabase/queries/wrong-questions";
import { supabase } from "@/lib/supabase/client";
import type { InterviewConfig, AIFeedback } from "@/types";
import toast from "react-hot-toast";

export interface FinalReport {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  actionPlan: { area: string; action: string; priority: string }[];
  positionMatch: string;
  nextSteps: string;
}

export function useInterview() {
  const router = useRouter();
  const currentUserId = useUserStore((s) => s.currentUserId);
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const model = useSettingsStore((s) => s.deepseekModel);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const { session, initSession, setPhase, recordAnswer, setFeedback, setElapsed, nextQuestion, setFinalReport, reset } = useInterviewStore();

  const startInterview = useCallback(async (config: InterviewConfig) => {
    if (!currentUserId || !apiKey) { toast.error("请先选择用户并设置 API Key"); return; }
    let qTexts: string[] = [];
    const presetQs = config.mode !== "challenge" ? await fetchQuestionsByPosition(currentUserId, config.position) : [];
    if (presetQs.length >= config.questionCount) {
      qTexts = presetQs.sort(() => Math.random() - 0.5).slice(0, config.questionCount).map((q) => q.content);
    } else {
      const weakTags = config.focusWeakPoints ? (await getWeakTags(currentUserId)).map((t) => t.tag) : [];
      let resumeSummary = "";
      if (config.useResume) {
        const { data: resumes } = await supabase.from("resumes").select("content").eq("user_id", currentUserId).eq("is_current", true).limit(1);
        resumeSummary = resumes?.[0]?.content ? JSON.stringify(resumes[0].content).slice(0, 2000) : "";
      }
      const system = buildInterviewerPrompt({ position: config.position, type: config.type, language: config.language, useResume: config.useResume, focusWeak: config.focusWeakPoints, resumeSummary, weakTags, knowledgeCards: "" });
      let resp = "";
      try {
        resp = await chat(apiKey, system, `请一次性生成${config.questionCount}道面试题。输出JSON: {"questions":["题1","题2",...]}`, model, baseUrl);
        const j = JSON.parse(resp);
        qTexts = j.questions;
        if (presetQs.length > 0) qTexts = [...presetQs.slice(0, 3).map((q) => q.content), ...qTexts.slice(0, config.questionCount - 3)];
      } catch (err) { console.error("AI 题目生成解析失败:", formatAIError(err)); qTexts = resp.split("\n").filter((l: string) => l.trim() && l.length > 10).slice(0, config.questionCount); }
    }
    const interview = await createInterview({ user_id: currentUserId, mode: config.mode, position: config.position, type: config.type, language: config.language, score: {}, duration: 0 });
    initSession(interview.id, config, qTexts);
    router.push(`/interview/${interview.id}`);
    toast.success(config.mode === "coach" ? "教练模式 — AI 会一步步引导你" : config.mode === "mock" ? "模拟模式 — 当作真实面试来对待！" : "面试开始！");
  }, [currentUserId, apiKey, model, baseUrl, initSession, router]);

  const submitAnswer = useCallback(async (interviewId: string, answer: string, audioUrl?: string) => {
    if (!session || !apiKey) return;
    const q = session.questions[session.currentQuestionIndex];
    recordAnswer(answer, audioUrl);
    await saveQA({ interview_id: interviewId, question_text: q.text, user_answer_text: answer, user_answer_audio_url: audioUrl });

    // ── coach mode: always give guidance first ──
    if (session.config.mode === "coach") {
      setPhase("coach_guidance");
      try {
        const system = buildCoachPrompt(session.config.position, session.config.language);
        const guidance = await chat(apiKey, system, `候选人回答："${answer || "(不知道)"}"。请先肯定尝试，再引导他给出更好的答案。`, model, baseUrl);
        setFeedback({ score: 0, dimensions: [], comment: guidance, reference_answer: "", predicted_followups: [] });
      } catch (err) { console.error("教练引导失败:", formatAIError(err)); setPhase("questioning"); }
      return;
    }

    // ── realtime / combined: generate per-question feedback ──
    if (session.config.feedbackMode === "realtime" || session.config.feedbackMode === "combined") {
      setPhase("feedback");
      try {
        const system = buildFeedbackPrompt(session.config.position, q.text, answer);
        const resp = await chat(apiKey, "你是资深面试官，请严格按JSON格式输出。", system, model, baseUrl);
        const fb: AIFeedback = JSON.parse(resp);
        setFeedback(fb);
        if (fb.score < 5) await addWrongQuestion({ user_id: currentUserId!, question_id: "" });
      } catch (err) {
        console.error("AI 反馈解析失败:", formatAIError(err));
        setFeedback({ score: 6, dimensions: [], comment: "反馈生成失败，请重试", reference_answer: "", predicted_followups: [] });
      }
      return;
    }

    // ── summary mode: no per-question feedback, move to next question ──
    nextQuestion();
  }, [session, apiKey, model, baseUrl, currentUserId, recordAnswer, setFeedback, setPhase, nextQuestion]);

  const generateFinalReport = useCallback(async (): Promise<FinalReport | null> => {
    if (!session || !apiKey) return null;
    const answered = session.questions.filter((q) => q.userAnswer.trim());
    if (answered.length === 0) return null;

    const qaList = session.questions.map((q) => ({
      text: q.text,
      answer: q.userAnswer,
      score: q.feedback?.score,
      comment: q.feedback?.comment,
    }));

    try {
      const system = buildFinalReportPrompt(session.config.position, session.config.mode, qaList);
      const resp = await chat(apiKey, "你是资深职业面试教练，请严格按JSON格式输出。", system, model, baseUrl);
      return JSON.parse(resp) as FinalReport;
    } catch (err) {
      console.error("最终报告生成失败:", formatAIError(err));
      return null;
    }
  }, [session, apiKey, model, baseUrl]);

  const generateSummaryFeedbacks = useCallback(async (): Promise<AIFeedback[]> => {
    if (!session || !apiKey) return [];
    const answered = session.questions.map((q) => ({ text: q.text, answer: q.userAnswer }));
    try {
      const system = buildSummaryFeedbackPrompt(session.config.position, answered);
      const resp = await chat(apiKey, "你是资深面试官，请严格按JSON格式输出。", system, model, baseUrl);
      const parsed = JSON.parse(resp);
      return (parsed.evaluations || []).map((e: Record<string, unknown>) => ({
        score: e.score as number,
        dimensions: e.dimensions as AIFeedback["dimensions"],
        comment: e.comment as string,
        reference_answer: e.reference_answer as string,
        predicted_followups: e.predicted_followups as string[],
      }));
    } catch (err) {
      console.error("统一评估失败:", formatAIError(err));
      return [];
    }
  }, [session, apiKey, model, baseUrl]);

  const goNext = useCallback(async (interviewId: string) => {
    if (!session) return;
    const isLast = session.currentQuestionIndex + 1 >= session.questions.length;
    const hasMoreQuestions = !isLast;

    if (hasMoreQuestions) {
      // ── mock mode: enforce time limit warning ──
      nextQuestion();
      setPhase("questioning");
      if (session.config.mode === "mock") {
        toast("下一题！保持真实面试的节奏感", { icon: "⏱" });
      }
    } else {
      // ── last question: end interview and generate report ──
      const elapsed = Math.floor((Date.now() - (session.startTime ?? Date.now())) / 1000);
      useInterviewStore.getState().setElapsed(elapsed);
      setPhase("finished");
      await updateInterview(interviewId, { duration: elapsed });

      // For summary/combined mode, generate feedback for unanswered questions
      if (session.config.feedbackMode === "summary") {
        toast.loading("正在生成综合评估...");
        const fbs = await generateSummaryFeedbacks();
        fbs.forEach((fb, i) => {
          if (i < session.questions.length) {
            useInterviewStore.getState().setFeedbackByIndex(i, fb);
          }
        });
        toast.dismiss();
      }

      // Generate final report
      toast.loading("正在生成综合报告...");
      const report = await generateFinalReport();
      if (report) setFinalReport(report);
      toast.dismiss();

      router.push(`/interview/${interviewId}/result`);
    }
  }, [session, nextQuestion, setPhase, router, generateFinalReport, generateSummaryFeedbacks, setFinalReport]);

  return { session, startInterview, submitAnswer, goNext, setPhase, reset };
}
