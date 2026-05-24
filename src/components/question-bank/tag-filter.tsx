"use client";
import { Badge } from "@/components/ui/badge";

interface TagFilterProps {
  tags: string[];
  selected: string[];
  onChange: (s: string[]) => void;
}

export function TagFilter({ tags, selected, onChange }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex gap-1.5 flex-wrap">
      {tags.map((t) => (
        <Badge
          key={t}
          variant={selected.includes(t) ? "default" : "outline"}
          className="cursor-pointer rounded-lg transition-all duration-200 hover:scale-105"
          onClick={() =>
            onChange(
              selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t]
            )
          }
        >
          {t}
        </Badge>
      ))}
    </div>
  );
}
