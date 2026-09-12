import { OllamaProvider } from './providers/ollama.js';
import { BrowserSpeechRecognition } from './speech/browser-stt.js';
import { BrowserSpeechSynthesis } from './speech/browser-tts.js';

const shell = document.querySelector('.shell');
const orb = document.querySelector('#orb');
const statusEl = document.querySelector('#status');
const detailEl = document.querySelector('#detail');
const muteBtn = document.querySelector('#mute');
const stopBtn = document.querySelector('#stop');
const errorEl = document.querySelector('#error');
const bars = [...document.querySelectorAll('#meter span')];
const core = document.querySelector('.orb-core');

const params = new URLSearchParams(location.search);
const OLLAMA_BASE_URL = params.get('ollama') || 'http://127.0.0.1:11434';
const REQUESTED_MODEL = params.get('model') || null;
const SPEECH_LANG = params.get('lang') || navigator.language || 'es-ES';
const DEBUG = params.get('debug') === '1';

const SYSTEM_PROMPT = [
  'You are a voice assistant in a voice-only interface.',
  'Reply in the same language the user speaks unless they ask for another language.',
  'Write for speech, not for a screen: be natural, concise, and conversational.',
  'Do not use markdown, headings, tables, citations, or formatting symbols.',
  'Prefer one or two short sentences unless the user explicitly asks for detail.',
].join(' ');

const COPY = {
  idle: ['Tap to begin', 'Ollama local • browser speech I/O'],
  connecting: ['Connecting…', 'Checking local Ollama'],
  listening: ['Listening…', 'Speak naturally'],
  thinking: ['Thinking…', 'Ollama is generating locally'],
  speaking: ['Speaking…', 'Tap the orb to interrupt'],
  muted: ['Muted', 'Microphone capture is paused'],
  error: ['Unavailable', 'Check the message below'],
};

const STOP_PHRASES = new Set([
  'goodbye',
  'bye',
  'stop listening',
  'end conversation',
  'adiós',
  'adios',
  'hasta luego',
  'termina la conversación',
  'termina la conversacion',
]);

let state = 'idle';
let stream;
let audioContext;
let analyser;
let samples;
let rafId;
let muted = false;
let processing = false;
let provider = null;
let modelName = null;
let sessionActive = false;
let turnStage = 'idle';
let conversation = [{ role: 'system', content: SYSTEM_PROMPT }];
const debugEvents = [];

function trace(stage, data = {}) {
  turnStage = stage;
  const entry = { at: new Date().toISOString(), stage, ...data };
  debugEvents.push(entry);
  if (debugEvents.length > 50) debugEvents.shift();
  console.debug('[voice-artifact]', entry);
}

window.__voiceArtifactDebug = {
  events: debugEvents,
  get state() { return state; },
  get stage() { return turnStage; },
  get model() { return modelName; },
};

const tts = new BrowserSpeechSynthesis({
  lang: SPEECH_LANG,
  onStart: ({ voice, lang }) => {
    trace('tts-start', { voice, lang });
    if (DEBUG && state === 'speaking') {
      detailEl.textContent = `TTS ✓ ${voice || 'system default'} • ${lang}`;
    }
  },
});

const stt = new BrowserSpeechRecognition({
  lang: SPEECH_LANG,
  onTranscript: transcript => handleTranscript(transcript),
  onError: error => handleSpeechRecognitionError(error),
});

function setState(next, detailOverride) {
  state = next;
  shell.dataset.state = next;
  const [label, detail] = COPY[next];
  statusEl.textContent = label;
  detailEl.textContent = detailOverride ?? detail;
}

function listeningDetail() {
  const base = modelName ? `${modelName} • Ollama local` : COPY.listening[1];
  return DEBUG ? `${base} • debug on` : base;
}

function setMeter(level = 0) {
  const multipliers = [0.55, 0.82, 1, 0.72, 0.48];
  bars.forEach((bar, index) => {
    const height = 5 + Math.min(17, level * 280 * multipliers[index]);
    bar.style.height = `${height}px`;
  });

  const scale = 1 + Math.min(0.14, level * 1.8);
  core.style.transform = `scale(${scale})`;
}

function rmsLevel() {
  analyser.getFloatTimeDomainData(samples);
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  return Math.sqrt(sum / samples.length);
}

function monitor() {
  if (!analyser) return;
  setMeter(muted ? 0 : rmsLevel());
  rafId = requestAnimationFrame(monitor);
}

function isStopPhrase(transcript) {
  const normalized = transcript
    .trim()
    .toLocaleLowerCase()
    .replace(/[.!?¡¿,;:]+$/g, '');
  return STOP_PHRASES.has(normalized);
}

function trimmedConversation() {
  const system = conversation[0];
  const recent = conversation.slice(1).slice(-12);
  return [system, ...recent];
}

async function handleTranscript(transcript) {
  if (!sessionActive || muted || processing || !transcript) return;

  trace('stt-final', { transcript });

  if (isStopPhrase(transcript)) {
    trace('stop-phrase', { transcript });
    stopSession();
    return;
  }

  processing = true;
  stt.stop();
  hideError();
  const startedAt = performance.now();
  setState(
    'thinking',
    DEBUG ? `STT ✓ “${transcript}” • calling ${modelName}` : `${modelName} • local inference`,
  );
  conversation.push({ role: 'user', content: transcript });

  let turnFailed = false;

  try {
    trace('ollama-request', { model: modelName, messages: trimmedConversation().length });
    const answer = await provider.chat(trimmedConversation());
    const modelMs = Math.round(performance.now() - startedAt);
    trace('ollama-response', { modelMs, chars: answer.length, preview: answer.slice(0, 120) });
    conversation.push({ role: 'assistant', content: answer });

    setState(
      'speaking',
      DEBUG ? `Ollama ✓ ${modelMs} ms • ${answer.length} chars • starting TTS` : 'Reply received • starting voice',
    );

    await tts.speak(answer);
    trace('tts-end');
  } catch (error) {
    turnFailed = true;
    trace('turn-error', { stage: turnStage, message: error?.message || String(error) });
    console.error(error);
    showError(`${error.message || 'The local model request failed.'} [stage: ${turnStage}]`);
  } finally {
    processing = false;

    if (!sessionActive) return;
    if (muted) {
      setState('muted');
      return;
    }

    setState(
      'listening',
      turnFailed && DEBUG ? `Turn failed at ${turnStage} • see error below` : listeningDetail(),
    );
    try {
      stt.start();
    } catch (error) {
      handleSpeechRecognitionError(error);
    }
  }
}

async function activate() {
  if (sessionActive) {
    if (state === 'speaking') {
      trace('tts-interrupt');
      tts.cancel();
    }
    return;
  }

  hideError();

  if (!stt.supported) {
    setState('error');
    showError('This browser does not expose SpeechRecognition. Try a browser with Web Speech recognition support.');
    return;
  }

  if (!tts.supported) {
    setState('error');
    showError('This browser does not expose speech synthesis.');
    return;
  }

  setState('connecting', OLLAMA_BASE_URL);
  trace('connect-start', { ollama: OLLAMA_BASE_URL, requestedModel: REQUESTED_MODEL, lang: SPEECH_LANG });

  try {
    provider = new OllamaProvider({
      baseUrl: OLLAMA_BASE_URL,
      model: REQUESTED_MODEL,
    });

    const ollama = await provider.connect();
    modelName = ollama.model;
    trace('ollama-connected', { model: modelName, models: ollama.models });

    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    samples = new Float32Array(analyser.fftSize);
    source.connect(analyser);

    sessionActive = true;
    muteBtn.disabled = false;
    stopBtn.disabled = false;
    orb.setAttribute('aria-label', 'Voice session active');
    trace('session-ready', { model: modelName });
    setState('listening', listeningDetail());
    monitor();
    stt.start();
  } catch (error) {
    trace('activation-error', { message: error?.message || String(error) });
    console.error(error);
    setState('error');
    showError(formatActivationError(error));
    cleanupMedia();
  }
}

function formatActivationError(error) {
  const message = error?.message || 'Could not start the voice session.';

  if (message.includes('Ollama') || message.includes('model')) {
    return `${message} Start Ollama and install a chat model, then try again.`;
  }

  return `${message} Use http://127.0.0.1 or HTTPS and allow microphone permission.`;
}

function handleSpeechRecognitionError(error) {
  trace('stt-error', { message: error?.message || String(error) });
  console.error(error);
  if (!sessionActive) return;
  showError(error.message || 'Speech recognition failed.');
}

function toggleMute() {
  if (!sessionActive || !stream) return;

  muted = !muted;
  stream.getAudioTracks().forEach(track => { track.enabled = !muted; });
  muteBtn.textContent = muted ? 'Unmute' : 'Mute';
  muteBtn.setAttribute('aria-pressed', String(muted));

  if (muted) {
    trace('muted');
    stt.stop();
    setState('muted');
  } else if (!processing) {
    trace('unmuted');
    setState('listening', listeningDetail());
    try {
      stt.start();
    } catch (error) {
      handleSpeechRecognitionError(error);
    }
  }
}

function cleanupMedia() {
  cancelAnimationFrame(rafId);
  stream?.getTracks().forEach(track => track.stop());
  audioContext?.close();
  stream = undefined;
  audioContext = undefined;
  analyser = undefined;
  samples = undefined;
  setMeter(0);
}

function stopSession() {
  trace('session-stop');
  stt.abort();
  tts.cancel();
  cleanupMedia();

  sessionActive = false;
  provider = null;
  modelName = null;
  processing = false;
  muted = false;
  conversation = [{ role: 'system', content: SYSTEM_PROMPT }];

  muteBtn.textContent = 'Mute';
  muteBtn.setAttribute('aria-pressed', 'false');
  muteBtn.disabled = true;
  stopBtn.disabled = true;
  orb.setAttribute('aria-label', 'Activate microphone');
  hideError();
  setState('idle');
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function hideError() {
  errorEl.hidden = true;
  errorEl.textContent = '';
}

orb.addEventListener('click', activate);
muteBtn.addEventListener('click', toggleMute);
stopBtn.addEventListener('click', stopSession);
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && sessionActive) stopSession();
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service worker registration failed', error));
}
