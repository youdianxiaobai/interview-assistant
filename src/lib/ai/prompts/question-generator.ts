export function buildQuestionGenPrompt(position: string, type: string, difficulty: string, count: number): string {
  return `为【${position}】岗位生成 ${count} 道${type === "tech" ? "专业" : "行为"}面试题，难度：${difficulty}。

请输出JSON：{"questions":[{"content":"...","reference_answer":"...","tags":["..."]}]}`;
}
