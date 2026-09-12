# Testing notes

This branch depends on services and browser capabilities that cannot be exercised by repository-only automation:

- a running local Ollama daemon;
- at least one installed Ollama model;
- microphone permission;
- browser Web Speech recognition/synthesis support;
- audible speaker output.

Repository review can verify wiring and API contracts, but promotion to `main` requires the real-machine acceptance checklist.
