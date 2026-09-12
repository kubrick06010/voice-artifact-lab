const shell = document.querySelector('.shell');
const orb = document.querySelector('#orb');
const statusEl = document.querySelector('#status');
const detailEl = document.querySelector('#detail');
const muteBtn = document.querySelector('#mute');
const stopBtn = document.querySelector('#stop');
const errorEl = document.querySelector('#error');
const bars = [...document.querySelectorAll('#meter span')];

const COPY = {
  idle: ['Tap to begin', 'Local demo — no audio leaves this browser'],
  listening: ['Listening…', 'Speak naturally'],
  thinking: ['Thinking…', 'Demo transition — no model call yet'],
  speaking: ['Speaking…', 'Demo response state'],
  muted: ['Muted', 'Microphone capture is paused'],
  error: ['Microphone unavailable', 'Check browser permissions and secure context'],
};

let state = 'idle';
let stream;
let audioContext;
let analyser;
let samples;
let rafId;
let muted = false;
let speechStartedAt = 0;
let lastVoiceAt = 0;
let transitionTimer;

const VOICE_THRESHOLD = 0.045;
const SPEECH_CONFIRM_MS = 180;
const SILENCE_TO_THINK_MS = 850;

function setState(next, detailOverride) {
  state = next;
  shell.dataset.state = next;
  const [label, detail] = COPY[next];
  statusEl.textContent = label;
  detailEl.textContent = detailOverride ?? detail;
}

function setMeter(level = 0) {
  const multipliers = [0.55, 0.82, 1, 0.72, 0.48];
  bars.forEach((bar, index) => {
    const height = 5 + Math.min(17, level * 280 * multipliers[index]);
    bar.style.height = `${height}px`;
  });

  const core = document.querySelector('.orb-core');
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

  const now = performance.now();
  const level = muted ? 0 : rmsLevel();
  setMeter(level);

  if (!muted && state === 'listening') {
    if (level >= VOICE_THRESHOLD) {
      if (!speechStartedAt) speechStartedAt = now;
      lastVoiceAt = now;
    } else if (speechStartedAt && now - speechStartedAt >= SPEECH_CONFIRM_MS && now - lastVoiceAt >= SILENCE_TO_THINK_MS) {
      runDemoResponse();
      speechStartedAt = 0;
      lastVoiceAt = 0;
    } else if (level < VOICE_THRESHOLD && now - lastVoiceAt > SILENCE_TO_THINK_MS) {
      speechStartedAt = 0;
    }
  }

  rafId = requestAnimationFrame(monitor);
}

function runDemoResponse() {
  clearTimeout(transitionTimer);
  setState('thinking');

  transitionTimer = setTimeout(() => {
    setState('speaking');
    transitionTimer = setTimeout(() => {
      if (!muted && stream) setState('listening');
    }, 1600);
  }, 900);
}

async function activate() {
  if (stream) return;
  hideError();

  try {
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

    muteBtn.disabled = false;
    stopBtn.disabled = false;
    orb.setAttribute('aria-label', 'Voice session active');
    setState('listening');
    monitor();
  } catch (error) {
    console.error(error);
    setState('error');
    showError('Could not access the microphone. Use HTTPS or localhost and allow microphone permission.');
  }
}

function toggleMute() {
  if (!stream) return;
  muted = !muted;
  stream.getAudioTracks().forEach(track => { track.enabled = !muted; });
  muteBtn.textContent = muted ? 'Unmute' : 'Mute';
  muteBtn.setAttribute('aria-pressed', String(muted));
  setState(muted ? 'muted' : 'listening');
  speechStartedAt = 0;
  lastVoiceAt = 0;
}

function stopSession() {
  clearTimeout(transitionTimer);
  cancelAnimationFrame(rafId);
  stream?.getTracks().forEach(track => track.stop());
  audioContext?.close();

  stream = undefined;
  audioContext = undefined;
  analyser = undefined;
  samples = undefined;
  muted = false;
  speechStartedAt = 0;
  lastVoiceAt = 0;

  muteBtn.textContent = 'Mute';
  muteBtn.setAttribute('aria-pressed', 'false');
  muteBtn.disabled = true;
  stopBtn.disabled = true;
  orb.setAttribute('aria-label', 'Activate microphone');
  setMeter(0);
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
  if (event.key === 'Escape' && stream) stopSession();
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service worker registration failed', error));
}
