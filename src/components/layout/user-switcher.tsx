"use client";
import { useUserStore } from "@/lib/store/user-store";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";

export function UserSwitcher() {
  const { currentUserId, profiles, setCurrentUser } = useUserStore();
  const current = profiles.find((p) => p.id === currentUserId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Avatar className="w-6 h-6"><AvatarFallback className="text-xs">{current?.name?.[0] ?? "?"}</AvatarFallback></Avatar>
          <span className="text-sm">{current?.name ?? "未选择"}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {profiles.map((p) => (
          <DropdownMenuItem key={p.id} onClick={() => setCurrentUser(p.id)} className={p.id === currentUserId ? "bg-muted" : ""}>
            {p.name} · {p.role}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
