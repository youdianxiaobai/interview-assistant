"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUserStore } from "@/lib/store/user-store";
import { supabase } from "@/lib/supabase/client";
import { chat, formatAIError } from "@/lib/ai/client";
import toast from "react-hot-toast";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Coffee, Lightbulb, Shield, Brain, ArrowLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

const PRE_INTERVIEW_SYSTEM = `你是面试前的快速热身教练。距离面试还有30分钟，你的任务是帮候选人进入最佳状态。

你的角色：
1. 快速热身：给出1-2个简单问题让候选人快速进入状态，建立信心
2. 积极姿势：提醒身体语言和呼吸，帮助缓解生理紧张
3. 要点速览：帮候选人回顾核心卖点和自我介绍要点
4. 心态调整：简短有力的鼓励，把紧张转化为兴奋

你的风格：
- 干脆利落，不拖泥带水（时间宝贵）
- 积极有能量，像赛前教练
- 每次回复控制在 80-150 字
- 多用短句，节奏明快
- 聚焦"现在能做什么"，不谈"如果失败了怎么办"`;

const WARMUP_QUESTIONS = [
  "请用30秒做一个自信的自我介绍",
  "你为什么适合这个岗位？说三个理由",
  "你最大的职业优势是什么？",
];

const SCENE_SUGGESTIONS = [
  { label: "帮我快速热身", prompt: "还有30分钟面试，帮我快速进入状态，先来一个简单的热身问题吧！" },
  { label: "缓解紧张", prompt: "我现在心跳很快手心出汗，帮我快速冷静下来。" },
  { label: "回顾核心卖点", prompt: "帮我快速梳理一下面试时最应该突出的3个核心卖点。" },
  { label: "最后的心态调整", prompt: "给我几句赛前打气的话，让我带着信心上场。" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function PreInterviewPage() {
  const router = useRouter();
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const model = useSettingsStore((s) => s.deepseekModel);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const { currentUserId, profiles } = useUserStore();
  const currentUser = profiles.find((p) => p.id === currentUserId);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `⏰ 还有30分钟！${currentUser?.name || "同学"}，现在是热身时间，不是焦虑时间。\n\n深呼吸，肩膀下沉。我会帮你快速进入状态。\n\n**选择一个开始：**\n- 想快速热身练一道题？\n- 需要我帮你梳理核心卖点？\n- 还是先来一波心态调整？`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [warmupIndex, setWarmupIndex] = useState(0);
  const [showWarmup, setShowWarmup] = useState(true);
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
        .map((m) => `${m.role === "assistant" ? "教练" : "我"}: ${m.content}`)
        .join("\n");
      const resp = await chat(
        apiKey,
        PRE_INTERVIEW_SYSTEM,
        `对话历史：\n${history}\n\n请用干脆利落、有能量的教练口吻回复。简短有力。`,
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

  const startWarmup = () => {
    const q = WARMUP_QUESTIONS[warmupIndex % WARMUP_QUESTIONS.length];
    setMessages((prev) => [...prev, { role: "assistant", content: `🔥 **热身练习**\n\n${q}\n\n别想太多，直接说出你的第一反应就好。` }]);
    setWarmupIndex((i) => i + 1);
    setShowWarmup(false);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.push("/wellness")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold font-display">面试前 30 分钟 · 快速热身</h2>
            <p className="text-xs text-muted-foreground">快速热身 + 积极姿势 + 要点速览</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className={msg.role === "assistant" ? "bg-amber-100 text-amber-600" : "bg-primary text-primary-foreground text-xs"}>
                  {msg.role === "assistant" ? <Coffee className="w-3.5 h-3.5" /> : "我"}
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
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>

        {/* Quick action cards */}
        {messages.length <= 1 && (
          <>
            {showWarmup && (
              <Card className="mb-3 rounded-xl border-amber-200 bg-amber-50/50 flex-shrink-0 cursor-pointer hover:bg-amber-100/50 transition-colors" onClick={startWarmup}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">快速热身练习</p>
                    <p className="text-xs text-muted-foreground">来一道简单题，让大脑活跃起来</p>
                  </div>
                  <Badge variant="outline" className="rounded-lg border-amber-300 text-amber-600">推荐</Badge>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0 scrollbar-hide">
              {SCENE_SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.prompt)}
                  disabled={!apiKey}
                  className="px-3.5 py-2 rounded-xl border border-amber-200 text-xs whitespace-nowrap hover:bg-amber-50 hover:border-amber-300 transition-colors flex-shrink-0 text-foreground/70"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </>
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
            placeholder="说说你现在需要什么帮助..."
            rows={2}
            className="resize-none rounded-xl"
            disabled={!apiKey}
          />
          <Button
            size="icon"
            className="h-auto rounded-xl bg-amber-500 hover:bg-amber-600 shadow-sm"
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
