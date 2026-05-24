/**
 * DeepSeek API 统一封装
 * - 自动重试（失败重试2次，间隔1s）
 * - 超时处理（30s）
 * - 流式输出支持
 * - 统一错误格式化
 */
import OpenAI from "openai";

// ── 类型 ──
export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  onChunk?: (text: string) => void;
  signal?: AbortSignal;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 2,
  retryDelay: 1000,
  timeout: 30000,
};

// ── 单例客户端缓存 ──
const clientCache = new Map<string, OpenAI>();

export function getClient(apiKey: string, baseUrl: string = "https://api.deepseek.com"): OpenAI {
  const cacheKey = `${apiKey}::${baseUrl}`;
  if (!clientCache.has(cacheKey)) {
    clientCache.set(cacheKey, new OpenAI({ apiKey, baseURL: baseUrl, dangerouslyAllowBrowser: true }));
  }
  return clientCache.get(cacheKey)!;
}

export function clearClientCache() {
  clientCache.clear();
}

// ── 错误格式化 ──
export function formatAIError(err: unknown): string {
  if (!err) return "未知错误";
  if (typeof err === "string") return err;
  const e = err as Record<string, unknown>;
  if (e.status && e.message) return `[HTTP ${e.status}] ${e.message}`;
  if (e.code && e.message) return `[${e.code}] ${e.message}`;
  if (e.message) return String(e.message);
  if (e.name === "AbortError") return "请求已取消或超时";
  return String(err);
}

// ── 重试包装 ──
async function withRetry<T>(
  fn: () => Promise<T>,
  retry: RetryConfig = DEFAULT_RETRY,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retry.maxRetries; attempt++) {
    try {
      const result = await withTimeout(fn(), retry.timeout);
      return result;
    } catch (err) {
      lastErr = err;
      const msg = formatAIError(err);
      // 不重试的情况：认证错误、参数错误
      if (msg.includes("401") || msg.includes("403") || msg.includes("invalid_request_error")) {
        throw err;
      }
      if (attempt < retry.maxRetries) {
        console.warn(`[DeepSeek] 第${attempt + 1}次失败，${retry.retryDelay}ms后重试: ${msg}`);
        await new Promise((r) => setTimeout(r, retry.retryDelay));
      }
    }
  }
  throw lastErr;
}

// ── 超时包装 ──
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`请求超时(${ms / 1000}s)`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

// ── 核心聊天方法 ──
export async function chat(
  apiKey: string,
  system: string,
  userMessage: string,
  options: ChatOptions = {},
): Promise<string> {
  const {
    model = "deepseek-v4-flash",
    maxTokens = 8192,
    temperature = 0.7,
    signal,
  } = options;

  return withRetry(async () => {
    const c = getClient(apiKey);
    const completion = await c.chat.completions.create(
      {
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMessage },
        ],
      },
      signal ? { signal } : {},
    );
    return completion.choices[0]?.message?.content ?? "";
  });
}

// ── 流式聊天 ──
export async function chatStream(
  apiKey: string,
  system: string,
  userMessage: string,
  options: ChatOptions = {},
): Promise<string> {
  const {
    model = "deepseek-v4-flash",
    maxTokens = 8192,
    temperature = 0.7,
    onChunk,
    signal,
  } = options;

  let fullText = "";
  const abortController = new AbortController();
  const combinedSignal = signal
    ? combineSignals(signal, abortController.signal)
    : abortController.signal;

  try {
    const c = getClient(apiKey);
    const stream = await c.chat.completions.create(
      {
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMessage },
        ],
        stream: true,
      },
      { signal: combinedSignal },
    );

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullText += delta;
        onChunk?.(delta);
      }
    }
    return fullText;
  } catch (err) {
    // 中断时清理
    abortController.abort();
    throw err;
  }
}

// ── 带图片的聊天 ──
export async function chatWithImage(
  apiKey: string,
  text: string,
  base64Image: string,
  mediaType: string = "image/jpeg",
  options: ChatOptions = {},
): Promise<string> {
  const { model = "deepseek-v4-flash", maxTokens = 1024 } = options;

  return withRetry(async () => {
    const c = getClient(apiKey);
    const completion = await c.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64Image}` } },
            { type: "text", text },
          ],
        },
      ],
    });
    return completion.choices[0]?.message?.content ?? "";
  });
}

// ── JSON 模式聊天（自动解析） ──
export async function chatJSON<T>(
  apiKey: string,
  system: string,
  userMessage: string,
  options: ChatOptions = {},
): Promise<T> {
  const text = await chat(apiKey, system, userMessage, options);
  // 尝试从 markdown code block 中提取 JSON
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  try {
    return JSON.parse(jsonMatch ? jsonMatch[1].trim() : text) as T;
  } catch {
    throw new Error(`JSON 解析失败: ${text.slice(0, 200)}`);
  }
}

// ── 工具函数 ──
function combineSignals(s1: AbortSignal, s2: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  s1.addEventListener("abort", onAbort);
  s2.addEventListener("abort", onAbort);
  if (s1.aborted || s2.aborted) controller.abort();
  return controller.signal;
}

// ── 便捷方法：使用设置存储中的配置 ──
export function createDeepSeekAPI(apiKey: string, model?: string, baseUrl?: string) {
  const m = model || "deepseek-v4-flash";
  const b = baseUrl || "https://api.deepseek.com";

  return {
    chat: (system: string, userMessage: string, opts?: ChatOptions) =>
      chat(apiKey, system, userMessage, { model: m, ...opts }),
    chatStream: (system: string, userMessage: string, opts?: ChatOptions) =>
      chatStream(apiKey, system, userMessage, { model: m, ...opts }),
    chatJSON: <T>(system: string, userMessage: string, opts?: ChatOptions) =>
      chatJSON<T>(apiKey, system, userMessage, { model: m, ...opts }),
    getClient: () => getClient(apiKey, b),
  };
}
