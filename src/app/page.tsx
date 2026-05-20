"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/user-store";
import { fetchProfiles, createProfile } from "@/lib/supabase/queries/profiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 space-y-4">
            <h1 className="text-xl font-bold">创建你的面试助手</h1>
            <div className="space-y-2">
              <Label>你的名字</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="输入名字" />
            </div>
            <div className="space-y-2">
              <Label>专业/方向</Label><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="如：物流工程、国际贸易" />
            </div>
            <Button onClick={handleCreate} className="w-full">开始使用</Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="w-full">返回</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">面试助手</h1>
        {profiles.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-muted-foreground">还没有用户，先创建一个吧</CardContent></Card>
        ) : (
          profiles.map((p) => (
            <Card key={p.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleSelect(p.id)}>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">{p.name[0]}</div>
                <div><p className="font-medium">{p.name}</p><p className="text-sm text-muted-foreground">{p.role}</p></div>
              </CardContent>
            </Card>
          ))
        )}
        <Button variant="outline" onClick={() => setShowCreate(true)} className="w-full">创建新用户</Button>
      </div>
    </div>
  );
}
