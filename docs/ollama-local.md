# Ollama local voice spike

This branch proves the first real conversational loop without OpenAI or Codex:

```text
voice
  ↓
browser SpeechRecognition
  ↓
Ollama /api/chat
  ↓
browser SpeechSynthesis
  ↓
voice
```

The visible product remains voice-only. Transcripts and model text are held in memory for the session but are not rendered as a chat interface.

## What is local

The LLM call is local through Ollama at `http://127.0.0.1:11434` by default. The app discovers installed models with `GET /api/tags` and sends turns to `POST /api/chat`.

The browser speech adapters are deliberately temporary. `SpeechRecognition` and `speechSynthesis` are browser/OS facilities and may use platform services depending on the browser and operating system. Do not treat this branch as an end-to-end offline voice stack yet.

A later branch can replace these adapters with local STT/TTS such as Whisper-family STT and Piper/Kokoro-class TTS while keeping the Ollama provider unchanged.

## Prerequisites

1. Install and start Ollama.
2. Install at least one chat model.
3. Use a browser that exposes the Web Speech recognition API.

A reasonable small test model is:

```bash
ollama pull qwen3:4b
```

Verify Ollama is reachable:

```bash
curl http://127.0.0.1:11434/api/tags
```

## Run the branch

```bash
git clone https://github.com/kubrick06010/voice-artifact-lab.git
cd voice-artifact-lab
git switch feat/ollama-local
python3 -m http.server 8000 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8000
```

Tap the orb, allow microphone access, and speak.

The artifact will:

1. query Ollama for installed models;
2. select the first installed model by default;
3. listen for one utterance;
4. send the transcript plus recent conversation history to Ollama;
5. speak the answer;
6. return to listening.

## Select a specific model

Use the `model` URL parameter:

```text
http://127.0.0.1:8000/?model=qwen3:4b
```

The requested model must already be installed. If it is not installed, the artifact reports an error rather than silently choosing another model.

## Language

By default the speech adapters use the browser language. Override it with `lang`:

```text
http://127.0.0.1:8000/?model=qwen3:4b&lang=es-ES
```

The system prompt asks the LLM to answer in the same language as the user and to keep replies suitable for spoken output.

## Alternate Ollama endpoint

The default endpoint is:

```text
http://127.0.0.1:11434
```

Override it with:

```text
http://127.0.0.1:8000/?ollama=http://127.0.0.1:11434
```

Ollama permits local web origins by default. If you host the artifact from another origin, configure `OLLAMA_ORIGINS` as described in the Ollama documentation.

## Interaction behavior

- **Tap orb while idle:** start the session.
- **Mute:** pause microphone recognition while preserving the session.
- **End / Escape:** stop media capture and clear in-memory conversation history.
- **Tap orb while speaking:** interrupt browser TTS and return to listening.
- Voice phrases such as `goodbye`, `adiós`, or `termina la conversación` end the session.

The in-memory conversation sent to Ollama is bounded to the most recent turns so the prototype does not grow context indefinitely.

## Current limitations

- No wake word yet.
- Browser STT/TTS are not guaranteed to be offline.
- No true acoustic barge-in yet; interruption is currently by tapping the orb.
- Model selection is URL-based rather than a visible settings UI, intentionally keeping the user-facing product voice-only.
- No tool calling or home/device control in this spike.

## Acceptance test

The branch is ready to promote only after this sequence works on a real machine:

```text
start → listening → speak → thinking → spoken answer → listening
```

Then verify a second utterance can refer to the first one, proving that multi-turn context survives invisibly within the active session.
