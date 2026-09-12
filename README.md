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

## Questions this lab should answer

- What is the smallest useful voice-only interaction surface?
- How should wake-word activation hand off microphone ownership to a realtime session?
- How natural can interruption / barge-in feel?
- What silence and inactivity thresholds feel correct for an ambient assistant?
- Can the experience be prototyped in a browser before moving to dedicated hardware?
- What authentication paths are possible with OpenAI Realtime, and how do API-key flows differ from ChatGPT/Codex OAuth experiments?
- Which parts of the software can later be reused in a smart-speaker integration?

## Initial architecture

```text
wake-word detector
       │
       ▼
activation state machine
       │
       ▼
microphone ──► realtime voice session ──► speaker
                    ▲       │
                    └───────┘
                    barge-in
```

The first prototype should stay intentionally small: one voice surface, a clear state machine, local wake-word detection if possible, and no unrelated agent features.

## Prior art

A number of projects already solve substantial pieces of this problem. See [`docs/prior-art.md`](docs/prior-art.md) for the research list and what appears reusable.

## Roadmap

See [`ROADMAP.md`](ROADMAP.md).

## Status

Research / pre-prototype.

## License

MIT. See [`LICENSE`](LICENSE).
