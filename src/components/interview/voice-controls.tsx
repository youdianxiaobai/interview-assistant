"use client";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play } from "lucide-react";

interface VCProps { listening: boolean; speaking: boolean; recording: boolean; onStartListen: () => void; onStopListen: () => void; onSpeak: () => void; onStopSpeak: () => void; onRecord: () => void; onStopRecord: () => void; audioUrl: string | null; }
export function VoiceControls(props: VCProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={props.listening ? props.onStopListen : props.onStartListen}>
        <Mic className="w-4 h-4 mr-1" />{props.listening ? "停止听" : "语音输入"}
      </Button>
      <Button variant="outline" size="sm" onClick={props.recording ? props.onStopRecord : props.onRecord}>
        {props.recording ? <Square className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}{props.recording ? "停止录音" : "录音"}
      </Button>
      {props.audioUrl && <audio controls src={props.audioUrl} className="h-8" />}
    </div>
  );
}
