"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUserStore } from "@/lib/store/user-store";
import { chat, formatAIError } from "@/lib/ai/client";
import { supabase } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Moon, Star, Trophy, Sparkles, ChevronRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

const NIGHT_BEFORE_SYSTEM = `你是一位温暖贴心的面试前夜陪伴导师。你的角色：

1. 安抚焦虑：理解候选人面试前的紧张情绪，用共情而非说教
2. 建立信心：引导候选人回顾自己的准备和优势，看到已取得的进步
3. 高光回顾：帮候选人回忆过往的成就和闪光时刻，建立积极的自我认知
4. 睡眠引导：给出放松身心的具体建议，帮助获得好的休息

你的风格：
- 温柔而坚定，像一位有经验的前辈
- 使用第一人称，像朋友聊天
- 每次回复 100-200 字
- 具体实在，不说空洞的安慰
- 帮助对方把注意力从"明天会怎样"转移到"我已经准备好了什么"`;

const SCENE_SUGGESTIONS = [
  { label: "我很紧张睡不着", prompt: "明天就要面试了，我现在躺在床上翻来覆去睡不着，脑子里全是各种担心。" },
  { label: "怕自己表现不好", prompt: "我总觉得自己准备得还不够，怕明天面试官问的问题我答不上来。" },
  { label: "回顾我的优势", prompt: "帮我一起回顾一下，面试前我应该记住自己的哪些优势和成就？" },
  { label: "睡眠放松引导", prompt: "我需要一些帮助放松入睡的方法，能让我的心静下来。" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function NightBeforePage() {
  const router = useRouter();
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const model = useSettingsStore((s) => s.deepseekModel);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const { currentUserId, profiles } = useUserStore();
  const currentUser = profiles.find((p) => p.id === currentUserId);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `嗨 ${currentUser?.name || "同学"}，明天就是重要的日子了。此刻无论你是什么心情——紧张、期待、或者有点不安——都是完全正常的。\n\n我在这里陪你。我们可以聊聊你的担忧，也可以一起回顾你为这次面试做的准备。你想从哪里开始？`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [highlights, setHighlights] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    if (currentUserId) {
      supabase
        .from("achievements")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(5)
        .then(({ data }) => { if (data) setHighlights(data); });
    }
  }, [currentUserId]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !apiKey || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg]
        .map((m) => `${m.role === "assistant" ? "导师" : "我"}: ${m.content}`)
        .join("\n");
      const resp = await chat(
        apiKey,
        NIGHT_BEFORE_SYSTEM,
        `对话历史：\n${history}\n\n请用温暖、专业的前辈口吻回复。`,
        model,
        baseUrl,
      );
      setMessages((prev) => [...prev, { role: "assistant", content: resp }]);
    } catch (err) {
      const msg = formatAIError(err);
      toast.error(`AI 响应失败: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.push("/wellness")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-sm">
            <Moon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold font-display">面试前夜 · 安心陪伴</h2>
            <p className="text-xs text-muted-foreground">AI 安抚对话 + 高光回顾 + 睡眠引导</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className={msg.role === "assistant" ? "bg-indigo-100 text-indigo-600" : "bg-primary text-primary-foreground text-xs"}>
                  {msg.role === "assistant" ? <Moon className="w-3.5 h-3.5" /> : "我"}
                </AvatarFallback>
              </Avatar>
              <div className={`rounded-2xl px-4 py-2.5 max-w-[80%] text-sm leading-relaxed ${
                msg.role === "assistant" ? "bg-muted text-foreground border border-border/30" : "bg-primary text-primary-foreground"
              }`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 items-center px-4">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>

        {/* Highlights section */}
        {highlights.length > 0 && messages.length <= 1 && (
          <Card className="mb-3 rounded-xl border-indigo-200 bg-indigo-50/50 flex-shrink-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold">你的高光时刻</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {highlights.map((h: any) => (
                  <div key={h.id} className="flex-shrink-0 px-3 py-2 rounded-lg bg-white border border-indigo-100 text-sm max-w-[200px]">
                    <Star className="w-3 h-3 text-amber-400 mb-1" />
                    <p className="text-xs line-clamp-2">{h.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {messages.length <= 1 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0 scrollbar-hide">
            {SCENE_SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => sendMessage(s.prompt)}
                disabled={!apiKey}
                className="px-3.5 py-2 rounded-xl border border-indigo-200 text-xs whitespace-nowrap hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex-shrink-0 text-foreground/70"
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
            placeholder="说说你现在的心情..."
            rows={2}
            className="resize-none rounded-xl"
            disabled={!apiKey}
          />
          <Button
            size="icon"
            className="h-auto rounded-xl bg-indigo-500 hover:bg-indigo-600 shadow-sm"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || !apiKey}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
