import Anthropic from "@anthropic-ai/sdk";

export function getClient(apiKey: string) { return new Anthropic({ apiKey }); }

export async function streamResponse(
  apiKey: string, system: string, userMessage: string, onChunk: (text: string) => void
): Promise<string> {
  const c = getClient(apiKey);
  const stream = c.messages.stream({ model: "claude-sonnet-4-6", max_tokens: 4096, system, messages: [{ role: "user", content: userMessage }] });
  let full = "";
  for await (const ev of stream) {
    if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") { full += ev.delta.text; onChunk(ev.delta.text); }
  }
  return full;
}

export async function chat(apiKey: string, system: string, userMessage: string): Promise<string> {
  const c = getClient(apiKey);
  const msg = await c.messages.create({ model: "claude-sonnet-4-6", max_tokens: 4096, system, messages: [{ role: "user", content: userMessage }] });
  return (msg.content[0] as any).text;
}
