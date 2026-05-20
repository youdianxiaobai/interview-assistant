"use client";
import { useRef, useState, useCallback } from "react";

export function useAudioRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const r = new MediaRecorder(stream);
    recorderRef.current = r; chunksRef.current = [];
    r.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    r.onstop = () => {
      const b = new Blob(chunksRef.current, { type: "audio/webm" });
      setBlob(b); setAudioUrl(URL.createObjectURL(b));
      stream.getTracks().forEach((t) => t.stop());
    };
    r.start(); setRecording(true);
  }, []);

  const stop = useCallback(() => { recorderRef.current?.stop(); setRecording(false); }, []);

  return { recording, blob, audioUrl, start, stop };
}
