"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

export function Teleprompter() {
  const [show, setShow] = useState(false);
  const [notes, setNotes] = useState("");
  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => setShow(!show)}>{show ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}提词器</Button>
      {show && <Card className="mt-2"><CardContent className="pt-4"><textarea className="w-full text-sm bg-transparent resize-none" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="输入关键词提示..." /></CardContent></Card>}
    </div>
  );
}
