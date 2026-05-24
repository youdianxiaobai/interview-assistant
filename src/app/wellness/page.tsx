"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageCircle,
  BarChart3,
  Wind,
  Shield,
  Sun,
  Brain,
  ArrowRight,
  Calendar,
  Coffee,
  Smile,
} from "lucide-react";

const modules = [
  {
    href: "/wellness/chat",
    icon: Heart,
    title: "AI 心理疏导",
    desc: "随时倾诉，AI 温暖倾听，给你具体建议和鼓励",
  },
  {
    href: "/wellness/mood",
    icon: BarChart3,
    title: "情绪追踪",
    desc: "记录每次练习后的心情，看趋势变化，发现压力源",
  },
  {
    href: "/wellness/toolkit",
    icon: Wind,
    title: "减压工具箱",
    desc: "深呼吸引导、积极暗示卡、焦虑认知重构",
  },
];

const rituals = [
  {
    icon: Calendar,
    title: "面试前夜",
    desc: "AI 安抚对话 + 高光回顾 + 睡眠引导",
    href: "/wellness/rituals/night-before",
  },
  {
    icon: Coffee,
    title: "面试前 30 分钟",
    desc: "快速热身 + 积极姿势提醒 + 要点速览",
    href: "/wellness/rituals/pre-interview",
  },
  {
    icon: Shield,
    title: "面试后 24 小时",
    desc: "情绪卸压 + 延迟复盘建议 + 小奖励",
    href: "/wellness/rituals/post-interview",
  },
];

export default function WellnessPage() {
  const { currentUserId, profiles } = useUserStore();
  const router = useRouter();
  const currentUser = profiles.find((p) => p.id === currentUserId);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground shadow-sm">
          <div className="relative z-10">
            <p className="text-primary-foreground/70 text-sm mb-1 font-medium">心理支持中心</p>
            <h2 className="text-2xl font-bold font-display mb-2">求职路上，心情也很重要</h2>
            <p className="text-primary-foreground/80 text-sm max-w-md leading-relaxed">
              {currentUser?.name || "求职者"}，每一次面试都是一次成长。无论结果如何，这里永远是你的避风港。
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-4 bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground border-primary-foreground/20 rounded-xl"
              onClick={() => router.push("/wellness/chat")}
            >
              开始聊聊 <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
          <Heart className="absolute right-4 top-1/2 -translate-y-1/2 w-32 h-32 text-primary-foreground/10" />
        </div>

        {/* Main modules */}
        <div className="grid grid-cols-3 gap-5">
          {modules.map(({ href, icon: Icon, title, desc }) => (
            <Card
              key={href}
              className="cursor-pointer card-hover bg-card rounded-xl shadow-sm border border-border/40 group"
              onClick={() => router.push(href)}
            >
              <CardContent className="p-6 relative">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-5 h-5 text-primary" />
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
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-accent" />
            </div>
            <h3 className="font-semibold text-lg">面试前后守护仪式</h3>
          </div>
          <div className="grid grid-cols-3 gap-5">
            {rituals.map(({ icon: Icon, title, desc, href }) => (
              <Card
                key={title}
                className="cursor-pointer card-hover bg-card rounded-xl shadow-sm border border-border/40 group"
                onClick={() => router.push(href)}
              >
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1.5">{title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-5">
          <Card
            className="cursor-pointer card-hover bg-card rounded-xl shadow-sm border border-border/40 group"
            onClick={() => router.push("/wellness/chat")}
          >
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-semibold text-sm mb-1">需要聊聊？</h4>
              <p className="text-xs text-muted-foreground">AI 是你最耐心的听众</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer card-hover bg-card rounded-xl shadow-sm border border-border/40 group"
            onClick={() => router.push("/wellness/cognitive")}
          >
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-5 h-5 text-accent" />
              </div>
              <h4 className="font-semibold text-sm mb-1">焦虑认知重构</h4>
              <p className="text-xs text-muted-foreground">CBT思维记录，用理性回应焦虑</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer card-hover bg-card rounded-xl shadow-sm border border-border/40 group"
            onClick={() => router.push("/wellness/mood")}
          >
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <Smile className="w-5 h-5 text-success" />
              </div>
              <h4 className="font-semibold text-sm mb-1">情绪记录</h4>
              <p className="text-xs text-muted-foreground">追踪你的心情变化</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
