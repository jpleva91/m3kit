import { M3kAiRuntimeAdapter } from './protocol';
import {
  createOpenAiCompatibleAdapter,
  M3kAiOpenAiAdapterOptions,
} from './openai-adapter';

/**
 * Options for the codex preset. Everything the generic adapter accepts, but
 * `baseUrl` and `model` are optional and default to a local OpenAI-compatible
 * gateway in front of the codex OAuth backend.
 */
export interface M3kAiCodexAdapterOptions
  extends Partial<Omit<M3kAiOpenAiAdapterOptions, 'baseUrl' | 'model'>> {
  /**
   * OpenAI-compatible gateway URL. Defaults to the codex→OpenAI gateway bind
   * (`http://127.0.0.1:8646/v1`).
   *
   * The raw codex backend (`chatgpt.com/backend-api/codex`) is OAuth-gated and
   * speaks the Responses API, not `/chat/completions` — so a translating
   * gateway is required. `hermes proxy` (`:8645`) is a non-transforming
   * forwarder and cannot serve codex; the companion `codex-openai-gateway`
   * (`:8646`) reuses Hermes's own codex translation + credentials to expose a
   * plain `/chat/completions` surface. Point this at whatever does that.
   */
  readonly baseUrl?: string;
  /** Model name; defaults to `gpt-5.5` (the ReadyBench worker default). */
  readonly model?: string;
}

/** Default: the local codex→OpenAI translating gateway (codex-openai-gateway). */
export const M3KIT_CODEX_DEFAULT_BASE_URL = 'http://127.0.0.1:8646/v1';
export const M3KIT_CODEX_DEFAULT_MODEL = 'gpt-5.5';

/**
 * Codex-flavored preset of {@link createOpenAiCompatibleAdapter}.
 *
 * ```ts
 * // Assumes an OpenAI-compatible gateway to codex on the default port.
 * const codex = createCodexAdapter({ apiKey: 'proxy-placeholder' });
 * const summary = await codex.runTask({
 *   requestId: '1', taskType: 'summarize', input: boardActivityText,
 * });
 * ```
 *
 * The adapter itself is credential-free; the gateway attaches real OAuth
 * credentials. Because it is just the generic OpenAI adapter with defaults,
 * the same code targets Ollama, Nous, or xAI by overriding `baseUrl`/`model`.
 */
export function createCodexAdapter(
  options: M3kAiCodexAdapterOptions = {}
): M3kAiRuntimeAdapter<unknown, unknown> {
  return createOpenAiCompatibleAdapter({
    id: options.id ?? 'm3kit-codex',
    baseUrl: options.baseUrl ?? M3KIT_CODEX_DEFAULT_BASE_URL,
    model: options.model ?? M3KIT_CODEX_DEFAULT_MODEL,
    apiKey: options.apiKey,
    headers: options.headers,
    temperature: options.temperature,
    fetchImpl: options.fetchImpl,
    systemPromptFor: options.systemPromptFor,
    buildMessages: options.buildMessages,
    parseJsonForExtract: options.parseJsonForExtract,
  });
}

/**
 * Ollama preset — a local OpenAI-compatible endpoint that works today with no
 * OAuth. Handy for offline dogfooding of the same adapter path codex uses.
 */
export function createOllamaAdapter(
  options: M3kAiCodexAdapterOptions & { model: string }
): M3kAiRuntimeAdapter<unknown, unknown> {
  return createOpenAiCompatibleAdapter({
    id: options.id ?? 'm3kit-ollama',
    baseUrl: options.baseUrl ?? 'http://127.0.0.1:11434/v1',
    model: options.model,
    apiKey: options.apiKey ?? 'ollama',
    headers: options.headers,
    temperature: options.temperature,
    fetchImpl: options.fetchImpl,
    systemPromptFor: options.systemPromptFor,
    buildMessages: options.buildMessages,
    parseJsonForExtract: options.parseJsonForExtract,
  });
}
