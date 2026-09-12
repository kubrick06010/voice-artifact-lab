const DEFAULT_BASE_URL = 'http://127.0.0.1:11434';

function normalizeBaseUrl(value) {
  return (value || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function clampInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export class OllamaProvider {
  constructor({
    baseUrl = DEFAULT_BASE_URL,
    model = null,
    contextLength = 2048,
    maxOutputTokens = 128,
  } = {}) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.requestedModel = model;
    this.model = null;
    this.contextLength = clampInteger(contextLength, 2048, 512, 8192);
    this.maxOutputTokens = clampInteger(maxOutputTokens, 128, 32, 512);
  }

  async connect() {
    let response;
    try {
      response = await fetchWithTimeout(`${this.baseUrl}/api/tags`);
    } catch (error) {
      const reason = error?.name === 'AbortError' ? 'timed out' : 'could not be reached';
      throw new Error(`Ollama ${reason} at ${this.baseUrl}.`);
    }

    if (!response.ok) {
      throw new Error(`Ollama returned HTTP ${response.status} from /api/tags.`);
    }

    const payload = await response.json();
    const models = Array.isArray(payload.models) ? payload.models : [];

    if (!models.length) {
      throw new Error('Ollama is running, but no local models are installed.');
    }

    if (this.requestedModel) {
      const requested = models.find(item => item.name === this.requestedModel || item.model === this.requestedModel);
      if (!requested) {
        throw new Error(`Requested Ollama model “${this.requestedModel}” is not installed.`);
      }
      this.model = requested.name || requested.model;
    } else {
      this.model = models[0].name || models[0].model;
    }

    return {
      baseUrl: this.baseUrl,
      model: this.model,
      models: models.map(item => item.name || item.model).filter(Boolean),
      contextLength: this.contextLength,
      maxOutputTokens: this.maxOutputTokens,
    };
  }

  async chat(messages) {
    if (!this.model) {
      throw new Error('Ollama provider is not connected.');
    }

    let response;
    try {
      response = await fetchWithTimeout(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          think: false,
          keep_alive: '2m',
          options: {
            num_ctx: this.contextLength,
            num_predict: this.maxOutputTokens,
            temperature: 0.5,
          },
        }),
      }, 120000);
    } catch (error) {
      const reason = error?.name === 'AbortError' ? 'timed out' : 'failed';
      throw new Error(`Ollama chat ${reason}.`);
    }

    if (!response.ok) {
      let detail = '';
      try {
        const payload = await response.json();
        detail = payload?.error ? ` ${payload.error}` : '';
      } catch {
        // Ignore malformed error bodies.
      }
      throw new Error(`Ollama returned HTTP ${response.status}.${detail}`.trim());
    }

    const payload = await response.json();
    const content = payload?.message?.content?.trim();

    if (!content) {
      throw new Error('Ollama returned an empty assistant message.');
    }

    return content;
  }
}
