import OpenAI from "openai";

export function getClient(apiKey: string, baseUrl: string = "https://api.deepseek.com") {
  return new OpenAI({ apiKey, baseURL: baseUrl, dangerouslyAllowBrowser: true });
}

export async function chat(
  apiKey: string,
  system: string,
  userMessage: string,
  model: string = "deepseek-chat",
  baseUrl: string = "https://api.deepseek.com"
): Promise<string> {
  const c = getClient(apiKey, baseUrl);
  const completion = await c.chat.completions.create({
    model,
    max_tokens: 4096,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userMessage },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
}

export async function chatWithImage(
  apiKey: string,
  text: string,
  base64Image: string,
  mediaType: string = "image/jpeg",
  model: string = "deepseek-chat",
  baseUrl: string = "https://api.deepseek.com"
): Promise<string> {
  const c = getClient(apiKey, baseUrl);
  const completion = await c.chat.completions.create({
    model,
    max_tokens: 1024,
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
}

export async function streamResponse(
  apiKey: string,
  system: string,
  userMessage: string,
  onChunk: (text: string) => void,
  model: string = "deepseek-chat",
  baseUrl: string = "https://api.deepseek.com"
): Promise<string> {
  const c = getClient(apiKey, baseUrl);
  const stream = await c.chat.completions.create({
    model,
    max_tokens: 4096,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userMessage },
    ],
    stream: true,
  });
  let full = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      full += delta;
      onChunk(delta);
    }
  }
  return full;
}
