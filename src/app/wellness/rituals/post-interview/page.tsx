"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUserStore } from "@/lib/store/user-store";
import { chat, formatAIError } from "@/lib/ai/client";
import toast from "react-hot-toast";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Shield, ThumbsUp, BookOpen, Gift, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

const POST_INTERVIEW_SYSTEM = `你是面试后的情绪卸压教练。面试已经结束24小时了，你的任务是帮候选人健康地消化这段经历。

你的角色：
1. 情绪卸压：无论面试结果如何，先帮对方释放积压的情绪
2. 肯定努力：无论表现如何，肯定对方的勇气和付出
3. 延迟复盘：引导对方从"我哪里没做好"转向"我从中学到了什么"
4. 小奖励：鼓励对方给自己一个奖励，庆祝完成这件事本身
5. 向前看：帮对方把注意力从本次面试转移到接下来的行动

你的风格：
- 温和但理性，像一位过来人
- 帮助对方看到"完成面试"本身就是一种胜利
- 不急着复盘，先处理情绪
- 每次回复 100-200 字
- 传递"这只是漫长职业生涯中的一站"的视角`;

const SCENE_SUGGESTIONS = [
  { label: "感觉没发挥好", prompt: "面试完回想起来，觉得自己有好几个地方没说好，越想越懊恼。" },
  { label: "等待结果焦虑", prompt: "面试完了但是要等一周才知道结果，这段时间好难熬，总是忍不住去想。" },
  { label: "不知道该做什么", prompt: "面试完了突然不知道该干什么，之前天天准备面试，现在有点空虚。" },
  { label: "帮我来个复盘", prompt: "帮我理性分析一下这次面试，哪些地方做得好，哪些可以改进？不是自我批评，是客观复盘。" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function PostInterviewPage() {
  const router = useRouter();
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const model = useSettingsStore((s) => s.deepseekModel);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const { currentUserId, profiles } = useUserStore();
  const currentUser = profiles.find((p) => p.id === currentUserId);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `嘿 ${currentUser?.name || "同学"}，面试结束了。\n\n首先，我想说的是——**能坐在那里完成面试，就已经是很了不起的一件事了。** 很多人都没有这个勇气。\n\n现在是属于你自己的时间。不管你现在是哪种心情——如释重负、还在纠结某个回答、或者已经开始焦虑结果——都可以跟我说说。\n\n我们今天不急着复盘，先让情绪落地。你想从哪里开始？`,
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
        .map((m) => `${m.role === "assistant" ? "教练" : "我"}: ${m.content}`)
        .join("\n");
      const resp = await chat(
        apiKey,
        POST_INTERVIEW_SYSTEM,
        `对话历史：\n${history}\n\n请用温和、理性、过来人的口吻回复。`,
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
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold font-display">面试后 24 小时 · 情绪卸压</h2>
            <p className="text-xs text-muted-foreground">情绪卸压 + 延迟复盘 + 小奖励</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className={msg.role === "assistant" ? "bg-emerald-100 text-emerald-600" : "bg-primary text-primary-foreground text-xs"}>
                  {msg.role === "assistant" ? <Shield className="w-3.5 h-3.5" /> : "我"}
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
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
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
                className="px-3.5 py-2 rounded-xl border border-emerald-200 text-xs whitespace-nowrap hover:bg-emerald-50 hover:border-emerald-300 transition-colors flex-shrink-0 text-foreground/70"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Self-reward card */}
        {messages.length <= 1 && (
          <Card className="mb-3 rounded-xl border-emerald-200 bg-emerald-50/50 flex-shrink-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">别忘了给自己一个小奖励 🎁</p>
                <p className="text-xs text-muted-foreground">不管结果如何，完成面试本身就值得庆祝。吃顿好的、看部电影、或者就好好睡一觉。</p>
              </div>
            </CardContent>
          </Card>
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
            placeholder="说说面试后的感受..."
            rows={2}
            className="resize-none rounded-xl"
            disabled={!apiKey}
          />
          <Button
            size="icon"
            className="h-auto rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-sm"
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
