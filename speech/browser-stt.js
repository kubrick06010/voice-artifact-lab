export class BrowserSpeechRecognition {
  constructor({ lang, onTranscript, onError, onStart, onEnd } = {}) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.supported = Boolean(Recognition);
    this.Recognition = Recognition;
    this.lang = lang || navigator.language || 'en-US';
    this.onTranscript = onTranscript;
    this.onError = onError;
    this.onStart = onStart;
    this.onEnd = onEnd;
    this.recognition = null;
    this.shouldRun = false;
    this.running = false;
    this.restartTimer = null;
  }

  start() {
    if (!this.supported) {
      throw new Error('Speech recognition is not supported by this browser.');
    }

    this.shouldRun = true;
    if (this.running) return;
    this.#ensureRecognition();

    try {
      this.recognition.start();
    } catch (error) {
      if (error?.name !== 'InvalidStateError') throw error;
    }
  }

  stop() {
    this.shouldRun = false;
    clearTimeout(this.restartTimer);
    if (!this.recognition || !this.running) return;

    try {
      this.recognition.stop();
    } catch {
      // Recognition may already be ending.
    }
  }

  abort() {
    this.shouldRun = false;
    clearTimeout(this.restartTimer);
    if (!this.recognition) return;

    try {
      this.recognition.abort();
    } catch {
      // Recognition may already be stopped.
    }
  }

  #ensureRecognition() {
    if (this.recognition) return;

    const recognition = new this.Recognition();
    recognition.lang = this.lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.running = true;
      this.onStart?.();
    };

    recognition.onresult = event => {
      const result = event.results[event.results.length - 1];
      const transcript = result?.[0]?.transcript?.trim();
      if (result?.isFinal && transcript) {
        this.onTranscript?.(transcript);
      }
    };

    recognition.onerror = event => {
      const ignorable = ['no-speech', 'aborted'].includes(event.error);
      if (!ignorable) this.onError?.(new Error(`Speech recognition error: ${event.error}`));
    };

    recognition.onend = () => {
      this.running = false;
      this.onEnd?.();

      if (this.shouldRun) {
        clearTimeout(this.restartTimer);
        this.restartTimer = setTimeout(() => {
          if (!this.shouldRun || this.running) return;
          try {
            recognition.start();
          } catch {
            // A subsequent onend will try again if needed.
          }
        }, 180);
      }
    };

    this.recognition = recognition;
  }
}
