"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/user-store";
import { fetchProfiles, createProfile } from "@/lib/supabase/queries/profiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  Sparkles,
  UserPlus,
  Mic,
  Library,
  FileText,
  Target,
  Shield,
  Zap,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "AI 模拟面试",
    desc: "练习、教练、模拟、挑战四种模式，真实还原面试场景",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Library,
    title: "智能题库",
    desc: "AI 生成 + 拍照 OCR + 语音录入，三合一高效选题",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: FileText,
    title: "简历分析",
    desc: "深度解析亮点与风险，AI 预测面试追问，多版本管理",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Shield,
    title: "数据隔离",
    desc: "双人独立空间，有限共享互相激励，数据安全可控",
    color: "bg-indigo-50 text-indigo-600",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { currentUserId, setCurrentUser, profiles, setProfiles, addProfile } = useUserStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchProfiles().then(setProfiles).catch(console.error);
  }, [setProfiles]);

  useEffect(() => {
    // Only auto-redirect on first app load (session scope), not on manual navigation to "/"
    if (currentUserId && !sessionStorage.getItem("interview-redirected")) {
      sessionStorage.setItem("interview-redirected", "1");
      router.push("/dashboard");
    }
  }, [currentUserId, router]);

  const handleCreate = async () => {
    if (!name.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const p = await createProfile(name, role);
      addProfile(p);
      setCurrentUser(p.id);
      router.push("/dashboard");
    } catch {
      setIsCreating(false);
    }
  };

  const handleSelect = (id: string) => {
    setCurrentUser(id);
    router.push("/dashboard");
  };

  // ── Create Profile View ──
  if (showCreate) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md shadow-xl border-border/40 animate-fade-in-scale">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold tracking-tight">创建你的面试助手</h2>
              <p className="text-sm text-muted-foreground">AI 面试教练，陪你拿下心仪 Offer</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">你的名字</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入你的名字"
                  className="h-11 rounded-xl"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">专业 / 方向</Label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="如：物流工程、国际贸易、跨境电商"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <Button
              onClick={handleCreate}
              className="w-full h-11 rounded-xl text-base font-medium"
              disabled={!name.trim() || isCreating}
              size="lg"
            >
              {isCreating ? "创建中..." : "开始使用"}
              {!isCreating && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowCreate(false)}
              className="w-full"
            >
              返回
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Landing Page ──
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-20 pb-12 px-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-8 border border-accent/20 animate-fade-in">
          <Zap className="w-3.5 h-3.5" />
          AI 驱动的智能面试教练
        </div>

        <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight mb-5 leading-[1.1] animate-fade-in">
          每一次练习
          <br />
          <span className="gradient-text">都离 Offer 更近一步</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed animate-fade-in">
          模拟真实面试场景，AI 实时反馈指导，系统备战每一次面试机会。
          专为物流、国际贸易、跨境电商岗位深度优化。
        </p>

        <div className="flex items-center justify-center gap-4 animate-fade-in">
          {profiles.length > 0 ? (
            <Button
              onClick={() => {
                if (profiles[0]) handleSelect(profiles[0].id);
              }}
              size="lg"
              className="h-12 rounded-xl text-base px-8 font-medium"
            >
              进入工作台
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              onClick={() => setShowCreate(true)}
              size="lg"
              className="h-12 rounded-xl text-base px-8 font-medium"
            >
              创建我的面试助手
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-4xl mx-auto px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="flex gap-4 p-5 rounded-2xl border border-border/40 bg-card hover:shadow-md transition-all duration-300 group"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color} bg-opacity-10`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* User Selection */}
      {profiles.length > 0 && (
        <section className="max-w-md mx-auto px-6 pb-20">
          <p className="text-sm text-muted-foreground mb-4 text-center">选择身份，继续练习</p>
          <div className="space-y-3">
            {profiles.map((p) => (
              <Card
                key={p.id}
                className="cursor-pointer card-hover border-border/40 rounded-2xl group"
                onClick={() => handleSelect(p.id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground flex-shrink-0 shadow-sm">
                    {p.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.role || "未设置方向"}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </CardContent>
              </Card>
            ))}
            <Button
              variant="ghost"
              onClick={() => setShowCreate(true)}
              className="w-full rounded-xl text-muted-foreground"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              添加新用户
            </Button>
          </div>
        </section>
      )}

      {profiles.length === 0 && (
        <section className="max-w-md mx-auto px-6 pb-20 text-center">
          <Card className="border-dashed border-2 border-border/40 bg-transparent rounded-2xl">
            <CardContent className="pt-8 pb-8 space-y-4">
              <UserPlus className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground text-sm">还没有用户，创建一个开始练习吧</p>
              <Button onClick={() => setShowCreate(true)} className="rounded-xl" size="lg">
                创建用户
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
