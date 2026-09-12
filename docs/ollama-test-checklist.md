# Ollama branch acceptance checklist

Do not merge `feat/ollama-local` into `main` until the real-machine checks below pass.

## Setup

- [ ] Ollama is running on `127.0.0.1:11434`.
- [ ] `curl http://127.0.0.1:11434/api/tags` returns at least one model.
- [ ] The artifact is served from `http://127.0.0.1:8000`.
- [ ] Browser microphone permission is granted.
- [ ] Browser supports speech recognition and speech synthesis.

## Core loop

- [ ] Tap orb → `connecting` → `listening`.
- [ ] The detail line shows the selected Ollama model.
- [ ] Speak one sentence; the state changes to `thinking`.
- [ ] Ollama generates a non-empty response.
- [ ] The response is spoken aloud.
- [ ] The artifact returns to `listening` automatically.

## Debug mode

If a turn enters `thinking` but no audible response arrives, run with:

```text
http://127.0.0.1:8000/?model=qwen3:4b&lang=es-ES&debug=1
```

The detail line will identify each successful boundary:

1. `STT ✓` — final transcript received.
2. `Ollama ✓` — `/api/chat` returned a non-empty response.
3. `TTS ✓` — the browser/OS speech engine actually started speaking.

If a turn fails, the on-screen error includes the last stage. The same events are available in DevTools as `window.__voiceArtifactDebug.events`.

To isolate Ollama independently of the browser speech layer:

```bash
curl http://127.0.0.1:11434/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"model":"qwen3:4b","messages":[{"role":"user","content":"Responde solamente: prueba recibida"}],"stream":false}'
```

To isolate browser TTS in DevTools:

```js
speechSynthesis.speak(new SpeechSynthesisUtterance('prueba de voz'))
```

## Conversation context

- [ ] Ask a first question that establishes a fact or subject.
- [ ] Ask a second question using a pronoun or implicit reference.
- [ ] Confirm the second answer proves recent conversation context was retained.
- [ ] End the session and start a new one; confirm the previous session context is gone.

## Controls

- [ ] Mute stops recognition without ending the session.
- [ ] Unmute returns to listening.
- [ ] Tap the orb while the assistant is speaking; speech stops and listening resumes.
- [ ] `End` stops the session.
- [ ] `Escape` stops the session.
- [ ] Saying `adiós`, `goodbye`, or another implemented stop phrase ends the session.

## Error cases

- [ ] With Ollama stopped, the artifact reports a useful connection error.
- [ ] With no installed models, the artifact reports that a model must be installed.
- [ ] With `?model=<missing-model>`, the artifact reports that the requested model is not installed.
- [ ] Microphone denial produces a useful permission error.

## Promotion gate

Merge to `main` only when the core loop and conversation-context sections pass. Browser/OS speech limitations may remain documented as known constraints for this spike.
