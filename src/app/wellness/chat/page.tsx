"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useSettingsStore } from "@/lib/store/settings-store";
import { chat, formatAIError } from "@/lib/ai/client";
import toast from "react-hot-toast";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Heart, Sparkles, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SCENE_SUGGESTIONS = [
  { label: "面试前紧张", prompt: "我明天有一场重要的面试，现在特别紧张，睡不着觉，怎么办？" },
  { label: "被拒后低落", prompt: "我刚收到一封拒信，感觉特别沮丧，觉得自己不够好。" },
  { label: "自我怀疑", prompt: "身边的同学都拿到offer了，我还在投简历，是不是我真的不行？" },
  { label: "职业迷茫", prompt: "我不确定自己选的方向对不对，对未来很迷茫。" },
  { label: "压力太大", prompt: "又要准备面试又要写论文，我觉得快撑不住了。" },
];

const COUNSELOR_SYSTEM = `你是一位温暖而专业的求职心理咨询师。你的角色是：

1. 倾听理解：先认真倾听求职者的困扰，表达共情和理解
2. 正常化感受：让对方知道这些感受是完全正常的
3. 具体建议：给出可操作的、具体的小步骤建议
4. 积极赋能：帮对方看到自己的优势和已取得的进步
5. 长期视角：帮对方看到求职只是人生的一个阶段

你的风格：
- 温暖但不煽情，理性但不冷漠
- 使用第一人称，像朋友聊天
- 不用空话套话，给具体建议
- 适当使用表情符号增加温度
- 每次回复控制在 100-200 字

你绝不：
- 说"不要焦虑"这种否定情绪的话
- 给出空洞的鸡汤
- 替对方做决定
- 忽视对方的情绪`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function WellnessChatPage() {
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const model = useSettingsStore((s) => s.deepseekModel);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "嗨，我是你的求职心理伙伴。有什么想跟我聊聊的吗？无论你在经历什么，我都在这里听着。",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !apiKey || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg]
        .map((m) => `${m.role === "assistant" ? "咨询师" : "我"}: ${m.content}`)
        .join("\n");
      const resp = await chat(
        apiKey,
        COUNSELOR_SYSTEM,
        `对话历史：\n${history}\n\n请用温暖的专业口吻回复。`,
        model,
        baseUrl,
      );
      setMessages((prev) => [...prev, { role: "assistant", content: resp }]);
    } catch (err) {
      const msg = formatAIError(err);
      console.error("AI 心理疏导调用失败:", msg);
      toast.error(`AI 响应失败: ${msg}`);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `抱歉，我暂时无法回应。\n\n> 错误: ${msg}\n\n请检查网络或 API 设置后重试。`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold font-display">AI 心理疏导</h2>
            <p className="text-xs text-muted-foreground">你的专属求职心理伙伴</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback
                  className={
                    msg.role === "assistant"
                      ? "bg-primary/10 text-primary"
                      : "bg-primary text-primary-foreground text-xs"
                  }
                >
                  {msg.role === "assistant" ? <Heart className="w-3.5 h-3.5" /> : "我"}
                </AvatarFallback>
              </Avatar>
              <div
                className={`rounded-2xl px-4 py-2.5 max-w-[80%] text-sm leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-muted text-foreground border border-border/30"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 items-center px-4">
              <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0 scrollbar-hide">
            {SCENE_SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => sendMessage(s.prompt)}
                disabled={!apiKey}
                className="px-3.5 py-2 rounded-xl border border-primary/20 text-xs whitespace-nowrap hover:bg-primary/5 hover:border-primary/40 transition-colors flex-shrink-0 text-foreground/70"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-shrink-0">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="说说你的感受..."
            rows={2}
            className="resize-none rounded-xl"
            disabled={!apiKey}
          />
          <Button
            size="icon"
            className="h-auto rounded-xl bg-primary hover:bg-primary/90 shadow-sm"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || !apiKey}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {!apiKey && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            请先在设置页面配置 DeepSeek API Key
          </p>
        )}
      </div>
    </AppShell>
  );
}
