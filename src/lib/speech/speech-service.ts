export class SpeechService {
  private recognition: SpeechRecognition | null = null;
  private speaking = false;

  constructor(private lang: string = "zh-CN") {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SR();
      rec.lang = lang;
      rec.interimResults = true;
      rec.continuous = true;
      this.recognition = rec;
    }
  }

  startListening(onResult: (text: string, isFinal: boolean) => void, onError: (e: any) => void) {
    if (!this.recognition) { onError("浏览器不支持语音识别"); return; }
    this.recognition.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (final) onResult(final, true);
      else if (interim) onResult(interim, false);
    };
    this.recognition.onerror = onError;
    try { this.recognition.start(); } catch {}
  }

  stopListening() { try { this.recognition?.stop(); } catch {} }

  speak(text: string, rate: number = 1, onEnd?: () => void) {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = this.lang; u.rate = rate;
    if (onEnd) u.onend = onEnd;
    this.speaking = true;
    window.speechSynthesis.speak(u);
  }

  stopSpeaking() { window.speechSynthesis.cancel(); this.speaking = false; }
  isSpeaking() { return this.speaking; }
}
