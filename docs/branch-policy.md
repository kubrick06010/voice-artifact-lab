# Branch promotion policy

`main` is the stable, demonstrable branch.

Development should happen in focused branches:

- `feat/*` for coherent product capabilities.
- `exp/*` for research that may be discarded.
- `fix/*` for scoped corrections.

A feature branch can be proposed for promotion when it has:

1. a coherent user-facing deliverable;
2. setup and limitation documentation;
3. a real-machine acceptance test when hardware, browsers, local services, or credentials are involved;
4. no committed secrets;
5. a clear rollback boundary.

For `feat/ollama-local`, the acceptance checklist in `docs/ollama-test-checklist.md` is the promotion gate.
