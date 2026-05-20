"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/user-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useInterviewStore } from "@/lib/store/interview-store";
import { createInterview, saveQA, updateInterview } from "@/lib/supabase/queries/interviews";
import { fetchQuestionsByPosition } from "@/lib/supabase/queries/questions";
import { chat } from "@/lib/ai/client";
import { buildInterviewerPrompt } from "@/lib/ai/prompts/interviewer";
import { buildCoachPrompt } from "@/lib/ai/prompts/coach";
import { buildFeedbackPrompt } from "@/lib/ai/prompts/feedback";
import { getWeakTags, addWrongQuestion } from "@/lib/supabase/queries/wrong-questions";
import { supabase } from "@/lib/supabase/client";
import type { InterviewConfig, AIFeedback } from "@/types";
import toast from "react-hot-toast";

export function useInterview() {
  const router = useRouter();
  const currentUserId = useUserStore((s) => s.currentUserId);
  const apiKey = useSettingsStore((s) => s.anthropicApiKey);
  const { session, initSession, setPhase, recordAnswer, setFeedback, nextQuestion, reset } = useInterviewStore();

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
        resp = await chat(apiKey, system, `请一次性生成${config.questionCount}道面试题。输出JSON: {"questions":["题1","题2",...]}`);
        const j = JSON.parse(resp);
        qTexts = j.questions;
        if (presetQs.length > 0) qTexts = [...presetQs.slice(0, 3).map((q) => q.content), ...qTexts.slice(0, config.questionCount - 3)];
      } catch { qTexts = resp.split("\n").filter((l: string) => l.trim() && l.length > 10).slice(0, config.questionCount); }
    }
    const interview = await createInterview({ user_id: currentUserId, mode: config.mode, position: config.position, type: config.type, language: config.language, score: {}, duration: 0 });
    initSession(config, qTexts);
    router.push(`/interview/${interview.id}`);
    toast.success("面试开始！");
  }, [currentUserId, apiKey, initSession, router]);

  const submitAnswer = useCallback(async (interviewId: string, answer: string, audioUrl?: string) => {
    if (!session || !apiKey) return;
    const q = session.questions[session.currentQuestionIndex];
    recordAnswer(answer, audioUrl);
    await saveQA({ interview_id: interviewId, question_text: q.text, user_answer_text: answer, user_answer_audio_url: audioUrl });

    if (session.config.mode === "coach" && (!answer.trim() || answer.length < 20)) {
      setPhase("coach_guidance");
      const system = buildCoachPrompt(session.config.position, session.config.language);
      const guidance = await chat(apiKey, system, `候选人回答："${answer || "(不知道)"}"。请引导他给出更好的答案。`);
      setFeedback({ score: 0, dimensions: [], comment: guidance, reference_answer: "", predicted_followups: [] });
      return;
    }

    if (session.config.feedbackMode === "realtime" || session.config.feedbackMode === "combined") {
      setPhase("feedback");
      const system = buildFeedbackPrompt(session.config.position, q.text, answer);
      const resp = await chat(apiKey, "你是资深面试官，请严格按JSON格式输出。", system);
      try {
        const fb: AIFeedback = JSON.parse(resp);
        setFeedback(fb);
        if (fb.score < 5) await addWrongQuestion({ user_id: currentUserId!, question_id: "" });
      } catch { setFeedback({ score: 6, dimensions: [], comment: resp, reference_answer: "", predicted_followups: [] }); }
    } else {
      setPhase("questioning");
    }
  }, [session, apiKey, currentUserId, recordAnswer, setFeedback, setPhase]);

  const goNext = useCallback(async (interviewId: string) => {
    if (!session) return;
    if (session.currentQuestionIndex + 1 >= session.questions.length) {
      await updateInterview(interviewId, { duration: Math.floor((Date.now() - (session.startTime ?? Date.now())) / 1000) });
      setPhase("finished");
      router.push(`/interview/${interviewId}/result`);
    } else {
      nextQuestion();
      setPhase("questioning");
    }
  }, [session, nextQuestion, setPhase, router]);

  return { session, startInterview, submitAnswer, goNext, setPhase, reset };
}
