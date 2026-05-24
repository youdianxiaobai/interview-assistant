"use client";

import { useState, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useVoice } from "@/hooks/use-voice";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import type { InteractionMode } from "@/types";
import { cn } from "@/lib/utils";
import { Send, Mic, Square, MicOff } from "lucide-react";

interface AnswerInputProps {
  interactionMode: InteractionMode;
  language: string;
  onSubmit: (answer: string, audioUrl?: string) => void;
  onNext?: () => void;
}

const MAX_CHARS = 2000;

export function AnswerInput({
  interactionMode,
  language,
  onSubmit,
}: AnswerInputProps) {
  const [text, setText] = useState("");
  const [voiceActive, setVoiceActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    listening,
    interimText,
    startListen,
    stopListen,
  } = useVoice(language === "en" ? "en-US" : "zh-CN");

  const { recording, audioUrl, start, stop } = useAudioRecorder();

  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit = text.trim().length > 0 && !isOverLimit;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit(text.trim(), audioUrl ?? undefined);
    setText("");
    if (voiceActive) {
      stopListen();
      setVoiceActive(false);
    }
    textareaRef.current?.focus();
  }, [canSubmit, text, audioUrl, onSubmit, voiceActive, stopListen]);

  const toggleVoice = useCallback(() => {
    if (voiceActive) {
      stopListen();
      setVoiceActive(false);
    } else {
      startListen((t) => {
        setText((prev) => {
          // Avoid double-spacing
          const needsSpace =
            prev.length > 0 && !prev.endsWith(" ") && !prev.endsWith("\n");
          return prev + (needsSpace ? " " : "") + t;
        });
      });
      setVoiceActive(true);
    }
  }, [voiceActive, startListen, stopListen]);

  const supportsVoice = interactionMode === "voice" || interactionMode === "text-voice";
  const supportsRecording = interactionMode === "voice" || interactionMode === "text-voice";
  const showTextarea = interactionMode === "text" || interactionMode === "text-voice";

  return (
    <div className="space-y-4">
      {/* Text input area */}
      {showTextarea && (
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入你的回答..."
            rows={5}
            className={cn(
              "resize-none pr-16 text-base leading-relaxed",
              "border-border/60 focus-visible:ring-primary/30",
              "transition-all duration-200"
            )}
          />
          {/* Character count */}
          <span
            className={cn(
              "absolute bottom-3 right-3 text-xs font-medium transition-colors duration-200",
              isOverLimit
                ? "text-destructive"
                : charCount > MAX_CHARS * 0.8
                  ? "text-warning"
                  : "text-muted-foreground"
            )}
          >
            {charCount}/{MAX_CHARS}
          </span>
        </div>
      )}

      {/* Voice interim text */}
      {listening && interimText && (
        <p className="text-sm text-muted-foreground italic animate-pulse">
          {interimText}
        </p>
      )}

      {/* Audio recording preview */}
      {audioUrl && (
        <audio
          controls
          src={audioUrl}
          className="w-full h-9 rounded-md"
        />
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {/* Voice dictation toggle */}
        {supportsVoice && (
          <Button
            type="button"
            variant={voiceActive ? "default" : "outline"}
            size="icon"
            onClick={toggleVoice}
            className={cn(
              "shrink-0 transition-all duration-200",
              voiceActive && "bg-accent text-accent-foreground shadow-sm"
            )}
            title={voiceActive ? "停止语音输入" : "开始语音输入"}
          >
            {voiceActive ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Audio recording */}
        {supportsRecording && (
          <Button
            type="button"
            variant={recording ? "destructive" : "outline"}
            size="icon"
            onClick={recording ? stop : start}
            className="shrink-0 transition-all duration-200"
            title={recording ? "停止录音" : "开始录音"}
          >
            {recording ? (
              <Square className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "flex-1 rounded-xl font-medium transition-all duration-200",
            canSubmit && "shadow-sm"
          )}
        >
          <Send className="h-4 w-4 mr-2" />
          提交回答
        </Button>
      </div>
    </div>
  );
}
