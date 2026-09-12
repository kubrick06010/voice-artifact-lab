# Voice Artifact Lab

A public research and prototyping lab for a **voice-only AI assistant**: no chat box, no document-centric UI, just wake, listen, converse, interrupt, and return to idle.

The immediate goal is to reproduce the interaction model of assistants such as Alexa or Siri while using modern voice and language models. This repository is intentionally hardware-agnostic at first; a future smart-speaker integration can reuse the interaction model once the voice experience is understood.

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
conversation
  ↕
interruption
  ↓
inactivity or explicit stop
  ↓
idle
```

## V0 — local voice surface

`main` contains the first stable browser prototype: microphone capture, the orb/state machine, local audio-level visualization, mute/end controls, and simulated thinking/speaking states.

## V1 spike — Ollama local

The `feat/ollama-local` branch replaces the simulated response with a real conversational loop:

```text
microphone
   ↓
browser speech recognition
   ↓
Ollama /api/chat
   ↓
browser speech synthesis
   ↓
speaker
```

The app automatically discovers installed Ollama models through `/api/tags`, keeps recent multi-turn context in memory, sends no visible transcript to the UI, and returns to listening after speaking the response.

The LLM path is local. Browser speech recognition/synthesis are temporary adapters and may rely on browser or OS services; this branch is therefore **not yet an end-to-end offline voice stack**.

Full setup and test instructions: [`docs/ollama-local.md`](docs/ollama-local.md).

### Quick start for the Ollama branch

```bash
git clone https://github.com/kubrick06010/voice-artifact-lab.git
cd voice-artifact-lab
git switch feat/ollama-local
ollama pull qwen3:4b
python3 -m http.server 8000 --bind 127.0.0.1
```

Make sure Ollama is running, then open:

```text
http://127.0.0.1:8000/?model=qwen3:4b&lang=es-ES
```

Tap the orb, allow microphone access, and speak.

## Architecture direction

```text
voice I/O adapters
        │
        ▼
interaction state machine
        │
        ▼
provider adapter
        │
   ┌────┼───────────┐
   ▼    ▼           ▼
Ollama  OpenAI   future providers
```

The UI should only care about conversation state and audio lifecycle. Model and speech implementations should remain replaceable.

## Questions this lab should answer

- What is the smallest useful voice-only interaction surface?
- How should wake-word activation hand off microphone ownership to a conversation session?
- How natural can interruption / barge-in feel?
- What silence and inactivity thresholds feel correct for an ambient assistant?
- Can the experience be prototyped in a browser before moving to dedicated hardware?
- How much of the stack can run locally?
- What authentication paths are possible with OpenAI Realtime, and how do API-key flows differ from ChatGPT/Codex OAuth experiments?
- Which parts of the software can later be reused in a smart-speaker integration?

## Prior art

A number of projects already solve substantial pieces of this problem. See [`docs/prior-art.md`](docs/prior-art.md) for the research list and what appears reusable.

## Roadmap

See [`ROADMAP.md`](ROADMAP.md).

## Branch policy

`main` is the stable, demonstrable line. New providers and experiments are developed in focused feature/experiment branches, tested there, and promoted through review only when they form a coherent deliverable.

## Status

- `main`: V0 voice-surface prototype.
- `feat/ollama-local`: V1 local-LLM conversational spike, ready for machine testing.

## License

MIT. See [`LICENSE`](LICENSE).
