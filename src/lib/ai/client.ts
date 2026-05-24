/**
 * AI 客户端 - 向后兼容层
 * 路径: src/lib/ai/client.ts
 * 内部使用 @/lib/deepseek 统一封装（含重试、超时、流式）
 */
import { chat as newChat, chatStream, chatWithImage as newChatImage, formatAIError as newFormatError } from "@/lib/deepseek";
import type { ChatOptions } from "@/lib/deepseek";

// ── 向后兼容的 chat（支持旧 5 参数签名） ──
export async function chat(
  apiKey: string,
  system: string,
  userMessage: string,
  modelOrOpts?: string | ChatOptions,
  baseUrl?: string,
): Promise<string> {
  // 新签名: chat(key, sys, msg, { model, ... })
  if (typeof modelOrOpts === "object" && modelOrOpts !== null) {
    return newChat(apiKey, system, userMessage, modelOrOpts);
  }
  // 旧签名: chat(key, sys, msg, model, baseUrl)
  return newChat(apiKey, system, userMessage, {
    model: typeof modelOrOpts === "string" ? modelOrOpts : undefined,
  });
}

// ── 向后兼容的 chatStream / streamResponse ──
export async function streamResponse(
  apiKey: string,
  system: string,
  userMessage: string,
  onChunk: (text: string) => void,
  model?: string,
  baseUrl?: string,
): Promise<string> {
  return chatStream(apiKey, system, userMessage, {
    model,
    onChunk,
  });
}

// 直接重导出流式方法
export { chatStream };

// ── 向后兼容的 chatWithImage ──
export async function chatWithImage(
  apiKey: string,
  text: string,
  base64Image: string,
  mediaType: string = "image/jpeg",
  model?: string,
  baseUrl?: string,
): Promise<string> {
  return newChatImage(apiKey, text, base64Image, mediaType, { model });
}

// ── 向后兼容的 formatAIError ──
export { newFormatError as formatAIError };

// ── 导出新 API ──
export { getClient, createDeepSeekAPI, chatJSON } from "@/lib/deepseek";
