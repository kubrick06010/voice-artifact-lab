# Changelog

## Unreleased — `feat/ollama-local`

- Added local Ollama provider discovery and `/api/chat` conversation.
- Added browser speech recognition and synthesis adapters.
- Replaced simulated response states with a real voice → model → voice loop.
- Added bounded in-memory multi-turn conversation context.
- Added spoken stop phrases and tap-to-interrupt speech behavior.
- Added model/language/endpoint URL configuration.
- Added Ollama setup, architecture, and acceptance-test documentation.

Known limitation: speech recognition and synthesis are still browser/OS adapters and are not guaranteed to operate fully offline.
