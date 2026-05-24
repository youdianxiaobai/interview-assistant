/**
 * API Route: DeepSeek 聊天代理
 * 路径: src/app/api/deepseek/chat/route.ts
 * 前端不直接调用 DeepSeek，通过此 API 代理
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, system, userMessage, model, baseUrl, maxTokens } = await req.json();

    if (!apiKey || !userMessage) {
      return NextResponse.json({ error: "缺少必要参数 apiKey/userMessage" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const resp = await fetch(`${baseUrl || "https://api.deepseek.com"}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "deepseek-v4-flash",
        max_tokens: maxTokens || 8192,
        messages: [
          { role: "system", content: system || "" },
          { role: "user", content: userMessage },
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
    const content = data.choices?.[0]?.message?.content || "";
    return NextResponse.json({ content });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort") || msg.includes("AbortError")) {
      return NextResponse.json({ error: "请求超时" }, { status: 504 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
