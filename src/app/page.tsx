"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/user-store";
import { fetchProfiles, createProfile } from "@/lib/supabase/queries/profiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Sparkles, UserPlus, Briefcase, Globe } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { currentUserId, setCurrentUser, profiles, setProfiles, addProfile } = useUserStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => { fetchProfiles().then(setProfiles).catch(console.error); }, [setProfiles]);
  useEffect(() => { if (currentUserId) router.push("/dashboard"); }, [currentUserId, router]);

  const handleSelect = (id: string) => { setCurrentUser(id); router.push("/dashboard"); };

  const handleCreate = async () => {
    if (!name.trim()) return;
    const p = await createProfile(name, role);
    addProfile(p); setCurrentUser(p.id); router.push("/dashboard");
  };

  if (showCreate) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">创建你的面试助手</CardTitle>
            <CardDescription>属于你的 AI 面试教练，陪你拿下心仪 Offer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">你的名字</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="输入名字" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">专业 / 方向</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="如：物流工程、国际贸易" className="h-11" />
            </div>
            <Button onClick={handleCreate} className="w-full h-11 text-base" size="lg">
              开始使用 <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="w-full">返回</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Hero */}
      <div className="pt-20 pb-12 text-center px-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          AI 驱动的智能面试教练
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          面试助手
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          模拟真实面试场景，AI 实时反馈指导，帮你系统备战每一次机会
        </p>
      </div>

      {/* Feature highlights */}
      <div className="max-w-lg mx-auto px-6 mb-10 grid grid-cols-3 gap-3">
        {[
          { icon: Briefcase, label: "岗位题库" },
          { icon: Globe, label: "行业覆盖" },
          { icon: Sparkles, label: "AI 反馈" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/60 backdrop-blur-sm">
            <Icon className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* User selection */}
      <div className="max-w-md mx-auto px-6 pb-12">
        <p className="text-sm font-medium text-muted-foreground mb-4 text-center">
          {profiles.length > 0 ? "选择你的身份开始练习" : "创建你的第一个身份"}
        </p>

        {profiles.length === 0 ? (
          <Card className="border-dashed border-2 bg-white/50">
            <CardContent className="pt-6 pb-6 text-center">
              <UserPlus className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-4">还没有用户，先创建一个吧</p>
              <Button onClick={() => setShowCreate(true)}>创建用户</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {profiles.map((p) => (
              <Card
                key={p.id}
                className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-0 shadow-md bg-white/90 backdrop-blur-sm"
                onClick={() => handleSelect(p.id)}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
                    {p.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base">{p.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{p.role || "未设置方向"}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                </CardContent>
              </Card>
            ))}
            <Button variant="ghost" onClick={() => setShowCreate(true)} className="w-full mt-2">
              <UserPlus className="w-4 h-4 mr-2" />添加新用户
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
