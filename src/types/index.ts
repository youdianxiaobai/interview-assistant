// ============== 用户 ==============
export interface Profile {
  id: string; name: string; role: string;
  avatar_url: string | null; created_at: string;
}

export interface UserSettings {
  id: string; user_id: string; voice_speed: number;
  default_mode: InterviewMode; default_language: string;
  coach_personality: string;
}

// ============== 面试 ==============
export type InterviewMode = "practice" | "coach" | "mock" | "challenge";
export type InterviewType = "tech" | "behavioral" | "comprehensive";
export type FeedbackMode = "realtime" | "summary" | "combined";
export type InteractionMode = "voice" | "text-voice" | "text";
export type InterviewLanguage = "zh" | "en";
export type InterviewPhase =
  | "config" | "ready" | "questioning" | "waiting_answer"
  | "feedback" | "coach_guidance" | "followup" | "finished";

export interface InterviewConfig {
  userId: string; position: string; type: InterviewType;
  mode: InterviewMode; interactionMode: InteractionMode;
  feedbackMode: FeedbackMode; language: InterviewLanguage;
  useResume: boolean; focusWeakPoints: boolean; questionCount: number;
}

export interface Interview {
  id: string; user_id: string; mode: InterviewMode;
  position: string; type: InterviewType; language: string;
  score: Record<string, number>; duration: number;
  recording_url: string | null; created_at: string;
}

export interface InterviewQA {
  id: string; interview_id: string; question_id: string | null;
  question_text: string; user_answer_text: string;
  user_answer_audio_url: string | null;
  ai_feedback: AIFeedback | null;
  score_breakdown: Record<string, number>;
  followup_depth: number; is_weak: boolean; created_at: string;
}

export interface AIFeedback {
  score: number;
  dimensions: { name: string; score: number; comment: string }[];
  comment: string;
  reference_answer: string;
  predicted_followups: string[];
}

// ============== 题库 ==============
export type QuestionType = "tech" | "behavioral";
export type QuestionDifficulty = "easy" | "medium" | "hard";
export type QuestionSource = "preset" | "user" | "ai" | "resume";

export interface Question {
  id: string; user_id: string; position: string; type: QuestionType;
  difficulty: QuestionDifficulty; source: QuestionSource;
  content: string; reference_answer: string; tags: string[];
  is_favorite: boolean; enabled: boolean; created_at: string;
}

export interface WrongQuestion {
  id: string; user_id: string; question_id: string;
  review_notes: string; wrong_reason: string; correct_approach: string;
  retry_count: number; last_wrong_at: string; is_mastered: boolean;
}

export interface KnowledgeCard {
  id: string; user_id: string; title: string; content: string;
  category: string; tags: string[]; related_question_ids: string[];
  easiness_factor: number; next_review_at: string; review_count: number;
}

// ============== 简历 ==============
export interface ResumeContent {
  name: string; phone: string; email: string; summary: string;
  education: ResumeEntry[]; experience: ResumeEntry[];
  projects: ResumeEntry[]; skills: string[]; certifications: string[];
}

export interface ResumeEntry {
  title: string; organization: string;
  start_date: string; end_date: string;
  description: string; highlights: string[];
}

export interface Resume {
  id: string; user_id: string; version_name: string;
  target_position: string; content: ResumeContent;
  file_url: string | null; is_current: boolean;
  created_at: string; updated_at: string;
}

export interface ResumeAnalysis {
  id: string; resume_id: string; user_id: string;
  position_target: string; match_score: number;
  strength_points: string[]; risk_points: string[];
  predicted_questions: string[];
}

// ============== 共享 ==============
export interface SharedQuestion {
  id: string; question_id: string; from_user_id: string;
  shared_at: string; question?: Question;
}

export interface ChallengeSession {
  id: string; challenger_id: string; opponent_id?: string;
  questions: string[];
  challenger_scores: Record<string, number>;
  opponent_scores: Record<string, number>;
  created_at: string;
}

// ============== 面试运行时状态 ==============
export interface InterviewSession {
  id: string;
  config: InterviewConfig;
  phase: InterviewPhase;
  currentQuestionIndex: number;
  questions: InterviewQuestion[];
  startTime: number | null;
  elapsedSeconds: number;
}

export interface InterviewQuestion {
  text: string;
  userAnswer: string;
  userAnswerAudioUrl?: string;
  feedback: AIFeedback | null;
}
