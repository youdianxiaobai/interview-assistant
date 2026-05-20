"use client";

import { Badge } from "@/components/ui/badge";

export function TagFilter({
  tags,
  selected,
  onChange,
}: {
  tags: string[];
  selected: string[];
  onChange: (s: string[]) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {tags.map((t) => (
        <Badge
          key={t}
          variant={selected.includes(t) ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() =>
            onChange(
              selected.includes(t)
                ? selected.filter((x) => x !== t)
                : [...selected, t]
            )
          }
        >
          {t}
        </Badge>
      ))}
    </div>
  );
}
