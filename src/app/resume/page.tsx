"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { fetchResumes, createResume, setCurrentResume } from "@/lib/supabase/queries/resumes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, BarChart3, Brain } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ResumeListPage() {
  const { currentUserId } = useUserStore(); const qc = useQueryClient(); const router = useRouter();
  const { data: resumes } = useQuery({ queryKey: ["resumes", currentUserId], queryFn: () => fetchResumes(currentUserId!), enabled: !!currentUserId });

  const handleCreate = async () => {
    await createResume({ user_id: currentUserId!, version_name: "新建简历", target_position: "", content: { name: "", phone: "", email: "", summary: "", education: [], experience: [], projects: [], skills: [], certifications: [] } });
    qc.invalidateQueries({ queryKey: ["resumes"] }); toast.success("已创建");
  };

  const handleSetCurrent = async (id: string) => { await setCurrentResume(currentUserId!, id); qc.invalidateQueries({ queryKey: ["resumes"] }); };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">简历管理</h2><Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" />新建简历</Button></div>
        <div className="grid gap-4">
          {resumes?.map((r) => (
            <Card key={r.id} className={r.is_current ? "border-primary" : ""}><CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2"><h3 className="font-medium">{r.version_name}</h3>{r.is_current && <Badge>当前使用</Badge>}<Badge variant="outline">{r.target_position || "未指定岗位"}</Badge></div>
                  <p className="text-sm text-muted-foreground mt-1">更新于 {formatDate(r.updated_at)}</p>
                </div>
                <div className="flex gap-2">
                  {!r.is_current && <Button variant="ghost" size="sm" onClick={() => handleSetCurrent(r.id)}>设为当前</Button>}
                  <Button variant="outline" size="sm" onClick={() => router.push(`/resume/${r.id}/edit`)}><Edit className="w-4 h-4 mr-1" />编辑</Button>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/resume/${r.id}/analysis`)}><BarChart3 className="w-4 h-4 mr-1" />分析</Button>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/resume/${r.id}/train`)}><Brain className="w-4 h-4 mr-1" />熟悉训练</Button>
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
