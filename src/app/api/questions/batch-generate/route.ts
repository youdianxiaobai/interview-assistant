/**
 * API Route: 批量生成面试题
 * 路径: src/app/api/questions/batch-generate/route.ts
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, position, type, difficulty, count, model, baseUrl } = await req.json();

    if (!apiKey || !position || !count) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const system = `你是资深面试官。请为${position}岗位生成${count}道${type === "behavioral" ? "行为面试" : "专业技术"}题，难度${difficulty}。
输出严格JSON: {"questions":[{"content":"题目","reference_answer":"参考答案","tags":["标签1","标签2"],"difficulty":"${difficulty}"}]}
每题需有完整的参考答案（80-150字）和相关标签。`;

    const resp = await fetch(`${baseUrl || "https://api.deepseek.com"}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "deepseek-v4-flash",
        max_tokens: Math.max(2048, count * 600),
        messages: [
          { role: "system", content: system },
          { role: "user", content: `请生成${count}道${position}岗位的面试题。` },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      const err = await resp.text();
      return NextResponse.json({ error: `[${resp.status}] ${err}` }, { status: resp.status });
    }

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || "";

    // 解析 JSON
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
    const parsed = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text);
    const questions = parsed.questions || parsed || [];

    return NextResponse.json({ questions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort") || msg.includes("AbortError")) {
      return NextResponse.json({ error: "请求超时" }, { status: 504 });
    }
    return NextResponse.json({ error: msg, questions: [] }, { status: 500 });
  }
}
