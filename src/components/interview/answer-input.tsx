"use client";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useVoice } from "@/hooks/use-voice";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import type { InteractionMode } from "@/types";
import { Send, Mic, Square } from "lucide-react";

export function AnswerInput({ interactionMode, language, onSubmit, onNext }: {
  interactionMode: InteractionMode; language: string; onSubmit: (answer: string, audioUrl?: string) => void; onNext?: () => void;
}) {
  const [text, setText] = useState("");
  const { listening, interimText, startListen, stopListen } = useVoice(language === "en" ? "en-US" : "zh-CN");
  const { recording, audioUrl, start, stop } = useAudioRecorder();

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text, audioUrl ?? undefined);
    setText("");
  };

  return (
    <div className="space-y-4">
      {(interactionMode === "text-voice" || interactionMode === "text") && (
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="输入你的回答..." rows={4} />
      )}
      {interimText && <p className="text-sm text-muted-foreground italic">{interimText}</p>}
      <div className="flex items-center gap-2">
        {(interactionMode === "text-voice" || interactionMode === "voice") && (
          <>
            <Button variant={recording ? "destructive" : "outline"} size="icon" onClick={recording ? stop : start}>
              {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button variant={listening ? "default" : "outline"} size="icon" onClick={() => listening ? stopListen() : startListen((t) => setText((prev) => prev + t))}>
              <Mic className="w-4 h-4" />
            </Button>
          </>
        )}
        <Button onClick={handleSubmit} className="flex-1"><Send className="w-4 h-4 mr-2" />提交回答</Button>
      </div>
      {audioUrl && <audio controls src={audioUrl} className="w-full" />}
    </div>
  );
}
