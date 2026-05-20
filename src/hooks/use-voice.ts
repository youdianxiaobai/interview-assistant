"use client";
import { useRef, useState, useCallback } from "react";
import { SpeechService } from "@/lib/speech/speech-service";

export function useVoice(lang: string = "zh-CN") {
  const serviceRef = useRef<SpeechService | null>(null);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interimText, setInterimText] = useState("");

  const getService = () => {
    if (!serviceRef.current) serviceRef.current = new SpeechService(lang);
    return serviceRef.current;
  };

  const startListen = useCallback((onResult: (text: string) => void) => {
    setListening(true);
    getService().startListening(
      (text, isFinal) => { setInterimText(isFinal ? "" : text); if (isFinal) onResult(text); },
      () => setListening(false)
    );
  }, [lang]);

  const stopListen = useCallback(() => { getService().stopListening(); setListening(false); }, []);

  const speakQuestion = useCallback((text: string, rate = 1) => {
    setSpeaking(true);
    getService().speak(text, rate, () => setSpeaking(false));
  }, []);

  const stopSpeak = useCallback(() => { getService().stopSpeaking(); setSpeaking(false); }, []);

  return { listening, speaking, interimText, startListen, stopListen, speakQuestion, stopSpeak };
}
