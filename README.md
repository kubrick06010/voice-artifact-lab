# Voice Artifact Lab

A public research and prototyping lab for a **voice-only AI assistant**: no chat box, no document-centric UI, just wake, listen, converse, interrupt, and return to idle.

The immediate goal is to reproduce the interaction model of assistants such as Alexa or Siri while using modern realtime voice models. This repository is intentionally hardware-agnostic at first; a future smart-speaker integration can reuse the interaction model once the voice experience is understood.

## Product constraint

The user-facing context is **voice**.

There is no requirement for a visible prompt editor, transcript-first interface, uploaded-document workflow, or conventional chat UI. The intended loop is:

```text
idle
  ↓
wake word / activation
  ↓
listening
  ↓
realtime conversation
  ↕
barge-in / interruption
  ↓
inactivity or explicit stop
  ↓
idle
```

## V0 — local voice surface

The repository now contains a runnable browser prototype with no backend and no API key.

V0 currently provides:

- a minimal full-screen voice surface;
- `idle`, `listening`, `thinking`, `speaking`, `muted`, and `error` states;
- real browser microphone capture;
- local RMS audio-level detection;
- visible voice activity through the orb and meter;
- automatic demo transitions after detected speech and silence;
- mute and explicit end-session controls;
- a small offline-capable PWA shell.

**No captured audio is sent anywhere in V0.** `thinking` and `speaking` are intentionally simulated states. This lets us tune the interaction before coupling it to a model provider.

### Run locally

Microphone APIs require a secure context. `localhost` is accepted by browsers, so no TLS setup is needed for local development.

```bash
git clone https://github.com/kubrick06010/voice-artifact-lab.git
cd voice-artifact-lab
python3 -m http.server 8000
```

Then open `http://localhost:8000`, tap the orb, allow microphone access, and speak. After a short silence the demo will move through `thinking` and `speaking` before returning to `listening`.

Press `Esc` or use **End** to stop microphone capture.

## Architecture direction

```text
V0 today

microphone
   │
   ▼
local audio level detector
   │
   ▼
interaction state machine
   │
   ├──► orb / status UI
   │
   └──► simulated response states

Next

microphone
   │
   ▼
activation / VAD / wake word
   │
   ▼
realtime voice transport
   │
   ▼
model audio response
   │
   ▼
speaker
```

The model/transport layer should remain replaceable. The UI should only care about state and audio lifecycle.

## Questions this lab should answer

- What is the smallest useful voice-only interaction surface?
- How should wake-word activation hand off microphone ownership to a realtime session?
- How natural can interruption / barge-in feel?
- What silence and inactivity thresholds feel correct for an ambient assistant?
- Can the experience be prototyped in a browser before moving to dedicated hardware?
- What authentication paths are possible with OpenAI Realtime, and how do API-key flows differ from ChatGPT/Codex OAuth experiments?
- Which parts of the software can later be reused in a smart-speaker integration?

## Prior art

A number of projects already solve substantial pieces of this problem. See [`docs/prior-art.md`](docs/prior-art.md) for the research list and what appears reusable.

## Roadmap

See [`ROADMAP.md`](ROADMAP.md).

## Status

**V0 browser prototype implemented.** Realtime model integration and wake-word activation are not implemented yet.

## License

MIT. See [`LICENSE`](LICENSE).
