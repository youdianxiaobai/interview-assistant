export function buildFeedbackPrompt(position: string, question: string, answer: string): string {
  return `你是资深面试官。请对以下面试回答进行评分反馈。

岗位：${position}
题目：${question}
候选人回答：${answer}

请输出严格JSON格式（不要包含其他文字）：
{
  "score": 数字(0-10),
  "dimensions": [
    {"name": "内容完整性", "score": 数字, "comment": "具体点评"},
    {"name": "逻辑清晰度", "score": 数字, "comment": "具体点评"},
    {"name": "专业度", "score": 数字, "comment": "具体点评"},
    {"name": "表达流畅度", "score": 数字, "comment": "具体点评"}
  ],
  "comment": "综合评价（50字内）",
  "reference_answer": "针对这道题的参考答案",
  "predicted_followups": ["面试官可能追问的问题1", "问题2"]
}`;
}
