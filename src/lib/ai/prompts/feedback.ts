export function buildFeedbackPrompt(position: string, question: string, answer: string): string {
  return `你是资深面试官。请对以下面试回答进行评分反馈。

岗位：${position}
题目：${question}
候选人回答：${answer}

评分要求：
- 严格基于回答的实际质量评分，不要敷衍，不要总是给6-7分
- 如果回答准确、完整、有逻辑，给8-10分，真诚肯定
- 如果回答方向对但不完整，给5-7分，指出具体可以补充的地方
- 如果回答偏离方向或错误，给0-4分，提供正确引导
- reference_answer：高分（≥7）时基于候选人的回答优化补充，不要给一个完全不同的标准答案；低分（<7）时给出完整参考答案

请输出严格JSON格式（不要包含其他文字）：
{
  "score": 数字(0-10),
  "dimensions": [
    {"name": "内容完整性", "score": 数字, "comment": "具体点评（不是套话）"},
    {"name": "逻辑清晰度", "score": 数字, "comment": "具体点评（不是套话）"},
    {"name": "专业度", "score": 数字, "comment": "具体点评（不是套话）"},
    {"name": "表达流畅度", "score": 数字, "comment": "具体点评（不是套话）"}
  ],
  "comment": "针对性综合评价：具体指出回答中哪里好、哪里不好，要引用候选人原话中的具体内容，不要说'你的回答很好但是可以更好'这种套话",
  "reference_answer": "高分（≥7）：在候选人原回答基础上优化润色的版本；低分（<7）：完整参考答案（100-200字）",
  "predicted_followups": ["基于候选人回答中薄弱或遗漏的点，给出1-2个面试官可能追问的问题"]
}`;
}

export function buildFinalReportPrompt(
  position: string,
  mode: string,
  questions: { text: string; answer: string; score?: number; comment?: string }[]
): string {
  const qaSummary = questions
    .map((q, i) => `Q${i + 1}: ${q.text}\n回答: ${q.answer || "(未回答)"}\n得分: ${q.score ?? "未评分"}\n点评: ${q.comment || "无"}`)
    .join("\n\n");

  return `你是资深职业面试教练。请基于以下完整面试记录，生成一份综合评估报告。

目标岗位：${position}
面试模式：${mode}
题目数量：${questions.length}

=== 面试逐题记录 ===
${qaSummary}
=== 记录结束 ===

请输出严格JSON格式（不要包含其他文字）：
{
  "overallScore": 数字(0-100，综合评分),
  "summary": "整体表现总结（80-120字）",
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["待改进1", "待改进2", "待改进3"],
  "actionPlan": [
    {"area": "具体改进方向", "action": "可操作的练习建议", "priority": "high/medium/low"}
  ],
  "positionMatch": "岗位匹配度分析（60-80字）",
  "nextSteps": "接下来一周的练习重点建议（50-80字）"
}`;
}

export function buildSummaryFeedbackPrompt(
  position: string,
  questions: { text: string; answer: string }[]
): string {
  const qaList = questions
    .map((q, i) => `Q${i + 1}: ${q.text}\n回答: ${q.answer || "(未回答)"}`)
    .join("\n\n");

  return `你是资深面试官。请对以下全部${questions.length}道面试题的回答进行统一评分反馈。

岗位：${position}

=== 全部问答 ===
${qaList}
=== 结束 ===

请输出严格JSON格式（不要包含其他文字）：
{
  "evaluations": [
    {
      "questionIndex": 数字(从0开始),
      "score": 数字(0-10),
      "dimensions": [
        {"name": "内容完整性", "score": 数字, "comment": "15字点评"},
        {"name": "逻辑清晰度", "score": 数字, "comment": "15字点评"},
        {"name": "专业度", "score": 数字, "comment": "15字点评"},
        {"name": "表达流畅度", "score": 数字, "comment": "15字点评"}
      ],
      "comment": "综合评价（40字内）",
      "reference_answer": "参考答案（80-150字）",
      "predicted_followups": ["追问1", "追问2"]
    }
  ],
  "overallComment": "整体评价（60字内）"
}`;
}
