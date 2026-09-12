function selectVoice(lang) {
  const voices = speechSynthesis.getVoices();
  const normalized = (lang || '').toLowerCase();
  const base = normalized.split('-')[0];

  return voices.find(voice => voice.lang?.toLowerCase() === normalized)
    || voices.find(voice => voice.lang?.toLowerCase().startsWith(`${base}-`))
    || voices.find(voice => voice.lang?.toLowerCase().startsWith(base))
    || null;
}

export class BrowserSpeechSynthesis {
  constructor({ lang } = {}) {
    this.supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    this.lang = lang || navigator.language || 'en-US';
    this.current = null;
    this.finishCurrent = null;
  }

  speak(text) {
    if (!this.supported) {
      return Promise.reject(new Error('Speech synthesis is not supported by this browser.'));
    }

    this.cancel();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.lang;
      utterance.rate = 1;
      utterance.pitch = 1;

      const voice = selectVoice(this.lang);
      if (voice) utterance.voice = voice;

      let settled = false;
      const finish = (error = null) => {
        if (settled) return;
        settled = true;
        if (this.current === utterance) {
          this.current = null;
          this.finishCurrent = null;
        }
        if (error) reject(error);
        else resolve();
      };

      utterance.onend = () => finish();
      utterance.onerror = event => {
        if (event.error === 'canceled' || event.error === 'interrupted') {
          finish();
          return;
        }
        finish(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.current = utterance;
      this.finishCurrent = () => finish();
      speechSynthesis.speak(utterance);
    });
  }

  cancel() {
    if (!this.supported) return;
    const finish = this.finishCurrent;
    speechSynthesis.cancel();
    finish?.();
    this.current = null;
    this.finishCurrent = null;
  }
}
