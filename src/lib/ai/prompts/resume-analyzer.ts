export function buildResumeAnalysisPrompt(position: string, resumeText: string): string {
  return `你是资深 HR，请分析这份简历针对【${position}】岗位的适配情况。

简历内容：${resumeText}

请以JSON格式输出：
{
  "match_score": 数字(0-100),
  "strength_points": ["优势1", "优势2", ...],
  "risk_points": ["风险1", "风险2", ...],
  "predicted_questions": ["面试官可能问的问题1", "问题2", ...]
}`;
}
