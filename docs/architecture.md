# Voice runtime architecture

The prototype deliberately separates user interaction, speech I/O, and model provider concerns.

```text
voice surface / state machine
          │
          ├──── speech input adapter
          │
          ├──── speech output adapter
          │
          └──── model provider adapter
```

Current experimental implementation:

```text
BrowserSpeechRecognition ─┐
                          ├── app state machine ── OllamaProvider
BrowserSpeechSynthesis  ◄──┘
```

The boundaries are intentional:

- `app.js` owns session state and conversation lifecycle.
- `speech/*` owns speech capture/transcription and spoken output.
- `providers/*` owns model transport and provider-specific request/response shapes.
- the visible UI does not know which model provider generated a reply.

This allows later branches to replace individual pieces independently, for example:

```text
Whisper STT + Ollama + Kokoro TTS
OpenAI realtime audio provider
Codex/OpenAI experimental authentication provider
smart-speaker microphone/speaker adapters
```

Provider-specific authentication, credentials, and transport details must not leak into the voice surface state machine.
