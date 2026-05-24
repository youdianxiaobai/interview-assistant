"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { fetchResumes, createResume, setCurrentResume } from "@/lib/supabase/queries/resumes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, BarChart3, Brain, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate, cn } from "@/lib/utils";
import { CardListSkeleton } from "@/components/skeletons";
import toast from "react-hot-toast";

export default function ResumeListPage() {
  const { currentUserId } = useUserStore();
  const qc = useQueryClient();
  const router = useRouter();

  const { data: resumes, isLoading } = useQuery({
    queryKey: ["resumes", currentUserId],
    queryFn: () => fetchResumes(currentUserId!),
    enabled: !!currentUserId,
  });

  const handleCreate = async () => {
    await createResume({
      user_id: currentUserId!,
      version_name: "新建简历",
      target_position: "",
      content: {
        name: "",
        phone: "",
        email: "",
        summary: "",
        education: [],
        experience: [],
        projects: [],
        skills: [],
        certifications: [],
      },
    });
    qc.invalidateQueries({ queryKey: ["resumes"] });
    toast.success("已创建");
  };

  const handleSetCurrent = async (id: string) => {
    await setCurrentResume(currentUserId!, id);
    qc.invalidateQueries({ queryKey: ["resumes"] });
    toast.success("已切换当前简历");
  };

  return (
    <AppShell>
      <div className="page-container animate-fade-in">
        {/* Header */}
        <div className="section-header">
          <h2 className="text-2xl font-display font-bold text-foreground">
            简历管理
          </h2>
          <Button onClick={handleCreate} className="rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            新建简历
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && <CardListSkeleton count={3} />}

        {/* Empty state */}
        {!isLoading && resumes?.length === 0 && (
          <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground text-base">
                还没有简历，创建第一份吧
              </p>
              <Button onClick={handleCreate} className="mt-4 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                新建简历
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Resume list */}
        {!isLoading && resumes && resumes.length > 0 && (
          <div className="grid gap-4">
            {resumes.map((r) => (
              <Card
                key={r.id}
                className={cn(
                  "rounded-xl shadow-sm border bg-card card-hover cursor-pointer transition-all duration-300",
                  r.is_current
                    ? "border-primary/60 ring-1 ring-primary/20"
                    : "border-border/40"
                )}
                onClick={() => router.push(`/resume/${r.id}/edit`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-semibold text-foreground">
                          {r.version_name}
                        </h3>
                        {r.is_current && (
                          <Badge
                            variant="secondary"
                            className="rounded-full bg-primary/10 text-primary text-xs border-primary/20"
                          >
                            当前使用
                          </Badge>
                        )}
                        <Badge variant="outline" className="rounded-full text-xs">
                          {r.target_position || "未指定岗位"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        更新于 {formatDate(r.updated_at)}
                      </p>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {!r.is_current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetCurrent(r.id);
                          }}
                        >
                          设为当前
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/resume/${r.id}/edit`);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/resume/${r.id}/analysis`);
                        }}
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        分析
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/resume/${r.id}/train`);
                        }}
                      >
                        <Brain className="w-4 h-4 mr-1" />
                        熟悉训练
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
