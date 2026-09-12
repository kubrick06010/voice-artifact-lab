# Roadmap

The project should progress from interaction research to a portable voice runtime without prematurely coupling the prototype to any specific speaker hardware.

## Phase 0 — Define the voice interaction

Goal: specify what the assistant should feel like before building it.

- [x] Define core states: `idle`, `listening`, `thinking`, `speaking`, `muted`, `error`.
- [ ] Define wake-word behavior.
- [ ] Define barge-in / interruption behavior.
- [ ] Define explicit stop phrases.
- [x] Establish an initial speech/silence transition threshold for browser experiments.
- [x] Decide early visible UI: status orb + minimal controls, no chat UI.
- [x] Provide a clear privacy indicator while microphone capture is active.

Exit condition: a small state-machine specification that can be implemented independently of model/provider details.

**Status:** partially complete. The V0 state machine is now executable in the browser; wake word and barge-in semantics remain to be specified.

## Phase 1 — Browser artifact

Goal: prove the experience with the lowest hardware friction.

- [x] Minimal full-screen / PWA-style artifact.
- [x] Microphone permission and local audio capture.
- [ ] Realtime voice session.
- [x] Visual state indicator only; no traditional chat UI.
- [ ] Barge-in.
- [x] Explicit end and return to idle.
- [ ] Instrument end-to-end latency measurements once a realtime transport exists.

V0 currently simulates `thinking` and `speaking` after local voice activity detection. No captured audio is transmitted.

Exit condition: open artifact → activate → converse naturally → interrupt → end → return to idle.

## Phase 2 — Wake word

Goal: make activation assistant-like rather than button-driven.

- [ ] Evaluate local wake-word engines.
- [ ] Keep wake-word audio local where practical.
- [ ] Implement clean microphone handoff from detector to realtime session.
- [ ] Prevent self-triggering while the assistant speaks.
- [ ] Measure false positives / missed activations.

Exit condition: hands-free activation is reliable enough for daily testing.

## Phase 3 — Authentication experiments

Goal: understand supported and experimental ways to reach the voice model.

- [ ] Implement the documented OpenAI API / Realtime path as the control case.
- [ ] Reproduce and document the current ChatGPT/Codex OAuth behavior separately.
- [ ] Verify whether Realtime access through subscription OAuth is supported, gated, or unavailable at test time.
- [ ] Never depend on an undocumented path for the main prototype.

Exit condition: clear evidence table of authentication method, support status, cost model, and limitations.

## Phase 4 — Portable runtime

Goal: separate the voice experience from the browser UI.

- [ ] Extract state machine.
- [ ] Abstract microphone input.
- [ ] Abstract speaker output.
- [ ] Abstract LEDs / visual status.
- [ ] Abstract activation source (wake word, button, external signal).
- [ ] Add echo-control strategy.

Exit condition: the same assistant behavior can run with different I/O adapters.

## Phase 5 — Smart-speaker target

Goal: reuse the portable runtime in dedicated speaker hardware.

Possible target capabilities:

```text
microphone array ─┐
buttons ──────────┼──► voice runtime ───► speaker / amplifier
LEDs ─────────────┘
```

Hardware-specific reverse engineering belongs here, after the voice runtime is already functional.

## Non-goals for the early prototype

- General desktop agent / computer-use automation.
- Document-centric RAG interface.
- Full chat history UI.
- Building a large plugin ecosystem before the core conversation loop works.
- Hardware reverse engineering before the software interaction model is proven.
