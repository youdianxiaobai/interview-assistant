"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, BarChart3, Wind, Shield, Sun, Users, Brain, ArrowRight, Calendar, Coffee } from "lucide-react";

const modules = [
  {
    href: "/wellness/chat", icon: Heart, title: "AI 心理疏导",
    desc: "随时倾诉，AI 温暖倾听，给你具体建议和鼓励",
    color: "bg-rose-50 text-rose-700",
  },
  {
    href: "/wellness/mood", icon: BarChart3, title: "情绪追踪",
    desc: "记录每次练习后的心情，看趋势变化，发现压力源",
    color: "bg-amber-50 text-amber-700",
  },
  {
    href: "/wellness/toolkit", icon: Wind, title: "减压工具箱",
    desc: "深呼吸引导、正念冥想、积极暗示卡、高光时刻收藏",
    color: "bg-sky-50 text-sky-700",
  },
];

const rituals = [
  { icon: Calendar, title: "面试前夜", desc: "AI 安抚对话 + 高光回顾 + 睡眠引导" },
  { icon: Coffee, title: "面试前 30 分钟", desc: "快速热身 + 积极姿势提醒 + 要点速览" },
  { icon: Shield, title: "面试后 24 小时", desc: "情绪卸压 + 延迟复盘建议 + 小奖励" },
];

export default function WellnessPage() {
  const { currentUserId, profiles } = useUserStore();
  const router = useRouter();
  const currentUser = profiles.find((p) => p.id === currentUserId);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 p-8 text-white">
          <div className="relative z-10">
            <p className="text-white/70 text-sm mb-1">心理支持中心</p>
            <h2 className="text-2xl font-bold mb-2">求职路上，心情也很重要</h2>
            <p className="text-white/80 text-sm max-w-md">
              {currentUser?.name || "求职者"}，每一次面试都是一次成长。无论结果如何，这里永远是你的避风港。
            </p>
          </div>
          <Heart className="absolute right-6 top-1/2 -translate-y-1/2 w-28 h-28 text-white/20" />
        </div>

        {/* Main modules */}
        <div className="grid grid-cols-3 gap-4">
          {modules.map(({ href, icon: Icon, title, desc, color }) => (
            <Card
              key={href}
              className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-0 shadow-sm"
              onClick={() => router.push(href)}
            >
              <CardContent className="p-6">
                <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Interview rituals */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">面试前后守护仪式</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {rituals.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-0 shadow-sm bg-white">
                <CardContent className="p-5">
                  <Icon className="w-5 h-5 text-primary mb-3" />
                  <h4 className="font-semibold text-sm mb-1">{title}</h4>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-amber-50 cursor-pointer hover:shadow-md transition-all" onClick={() => router.push("/wellness/chat")}>
            <CardContent className="p-5">
              <MessageCircle className="w-5 h-5 text-rose-500 mb-3" />
              <h4 className="font-semibold text-sm mb-1">需要聊聊？</h4>
              <p className="text-xs text-muted-foreground">AI 是你最耐心的听众</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-sky-50 to-indigo-50 cursor-pointer hover:shadow-md transition-all" onClick={() => router.push("/wellness/toolkit")}>
            <CardContent className="p-5">
              <Brain className="w-5 h-5 text-sky-500 mb-3" />
              <h4 className="font-semibold text-sm mb-1">焦虑认知重构</h4>
              <p className="text-xs text-muted-foreground">用理性回应用焦虑</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 cursor-pointer hover:shadow-md transition-all" onClick={() => router.push("/wellness/mood")}>
            <CardContent className="p-5">
              <Users className="w-5 h-5 text-green-500 mb-3" />
              <h4 className="font-semibold text-sm mb-1">双人互相鼓励</h4>
              <p className="text-xs text-muted-foreground">你们并肩前行</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
