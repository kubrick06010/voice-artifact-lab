# Prior art and references

This note tracks projects that are relevant to a voice-only assistant artifact. The emphasis is on interaction patterns and reusable architecture rather than copying an entire assistant stack.

## 1. OpenAI `realtime-voice-component`

Repository: https://github.com/openai/realtime-voice-component

Why it matters:

- Browser-oriented realtime voice runtime.
- Supports audio output and VAD-based activation flows.
- Separates controller/runtime logic from the thin launcher UI.
- Documents server-side session proxying so standard API keys do not live in the browser.
- Useful reference for a minimal browser prototype before dedicated hardware.

Potentially reusable ideas:

- Controller-owned voice session lifecycle.
- Explicit `idle / connecting / listening / speaking / error` style state model.
- WebRTC transport.
- Barge-in behavior and VAD defaults.

## 2. Aurora

Repository: https://github.com/abfo/aurora

Why it matters:

- Explicitly describes itself as an Alexa / Google Home style assistant.
- Has a headless UX that only requires audio.
- Uses OpenAI Realtime.
- Includes a local wake-word model and Raspberry Pi implementation.

Potentially reusable ideas:

- Keep wake-word detection local.
- Treat wake-word detection and realtime audio as separate microphone-ownership phases.
- Hardware-independent core plus Pi-specific adapters.

## 3. OpenLexaPi

Repository: https://github.com/ARDings/OpenLexaPi

Why it matters:

- Wake-word activated assistant built around OpenAI Realtime.
- Uses `Computer` as the wake word.
- Automatically returns to sleep after inactivity.
- Runs on very constrained Raspberry Pi hardware.
- Includes practical handling for echo prevention and reconnection.

Potentially reusable ideas:

- Conversation timeout and automatic sleep.
- Audio echo-management strategy.
- Headless operation as a first-class mode.

## 4. Realtime Smart Voice Assistant

Repository: https://github.com/duowang/realtime-smart-voice

Why it matters:

- Direct voice-to-voice OpenAI Realtime architecture.
- Custom wake word through Porcupine.
- Explicit conversation termination via phrase or silence timeout.
- Designed for macOS/Linux/Raspberry Pi.

Potentially reusable ideas:

- Small orchestrator around wake word + realtime client + audio layer.
- Configurable silence and conversation timeout.
- Cross-platform prototype path.

## 5. Brah

Repository: https://github.com/KenKaiii/brah

Why it matters:

Brah is broader than this lab—it also sees the screen and controls the computer—but its authentication experiments are especially relevant.

As documented by the project in June 2026, Brah deliberately experimented with **ChatGPT/Codex OAuth** for Realtime rather than treating a normal API key as the only path. Its notes report that OAuth authentication and Realtime client-secret creation could succeed while the actual Realtime call still failed upstream, and that the Codex backend realtime route appeared unavailable / gated for the tested Plus account.

This makes Brah valuable as a research reference for the distinction between:

```text
ChatGPT subscription / Codex OAuth
                 versus
OpenAI API / Realtime billing
```

Important: treat these OAuth findings as experimental and time-sensitive. They must be re-verified before relying on them.

## Working conclusion

The general voice-assistant architecture is not novel. Existing projects already demonstrate:

```text
wake word
   ↓
local activation
   ↓
realtime audio session
   ↓
voice response
   ↕
barge-in
   ↓
timeout / sleep
```

The value of this lab is therefore to:

1. distill that architecture into the smallest possible voice-only artifact;
2. compare authentication and deployment strategies;
3. make the interaction layer portable enough to move later from browser/desktop prototyping to smart-speaker hardware.

## Research TODO

- Re-check the current status of ChatGPT/Codex OAuth access to Realtime.
- Compare WebRTC vs WebSocket for the first prototype.
- Compare local wake-word engines: Porcupine vs open alternatives.
- Document microphone handoff and echo-cancellation patterns.
- Measure activation → first-audio latency.
- Define the exact state machine before writing UI code.
