"use client";
import { useUserStore } from "@/lib/store/user-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, Check, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function UserSwitcher() {
  const { currentUserId, profiles, setCurrentUser } = useUserStore();
  const router = useRouter();
  const current = profiles.find((p) => p.id === currentUserId);

  if (profiles.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9 rounded-lg border-border/60">
          <Avatar className="w-5 h-5">
            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
              {current?.name?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm max-w-[100px] truncate">{current?.name ?? "未选择"}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          切换身份
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profiles.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => setCurrentUser(p.id)}
            className={cn(
              "flex items-center gap-3 py-2.5 cursor-pointer rounded-lg mx-1",
              p.id === currentUserId && "bg-primary/5"
            )}
          >
            <Avatar className="w-7 h-7">
              <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                {p.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{p.name}</span>
              <span className="text-[11px] text-muted-foreground truncate">
                {p.role || "未设置方向"}
              </span>
            </div>
            {p.id === currentUserId && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/")}
          className="gap-2 py-2.5 cursor-pointer rounded-lg mx-1 text-muted-foreground"
        >
          <UserPlus className="w-4 h-4" />
          <span className="text-sm">添加新用户</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
