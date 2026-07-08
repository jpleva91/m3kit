import { defineM3kAiAdapter } from './runtime-adapter';
import {
  M3kAiRuntimeAdapter,
  M3kAiTaskRequest,
  M3kAiTaskType,
} from './protocol';

/** One chat message in the OpenAI chat-completions wire format. */
export interface M3kAiChatMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

/**
 * Configuration for an OpenAI-compatible chat-completions adapter.
 *
 * The adapter speaks the plain `/chat/completions` wire format, so it works
 * against anything that implements it: a local Ollama (`/v1`), an OpenAI-
 * compatible gateway such as `hermes proxy`, or a hosted endpoint. It never
 * embeds credentials — `apiKey` is forwarded as a bearer token, and when the
 * base URL points at a proxy that attaches real OAuth credentials the key can
 * be any non-empty placeholder.
 */
export interface M3kAiOpenAiAdapterOptions {
  /** Adapter id surfaced in telemetry; defaults to `m3kit-openai`. */
  readonly id?: string;
  /** Root of the OpenAI-compatible API, e.g. `http://127.0.0.1:11434/v1`. */
  readonly baseUrl: string;
  /** Model name passed through to the endpoint, e.g. `gpt-5.5`. */
  readonly model: string;
  /** Bearer token. Optional when the upstream proxy injects credentials. */
  readonly apiKey?: string;
  /** Extra headers merged into every request. */
  readonly headers?: Readonly<Record<string, string>>;
  /** Sampling temperature; omitted from the payload when undefined. */
  readonly temperature?: number;
  /** Injected fetch, primarily for tests. Defaults to global `fetch`. */
  readonly fetchImpl?: typeof fetch;
  /**
   * Per-task system prompt. The defaults give reasonable behavior for the
   * built-in task types; return `undefined` to omit the system message.
   */
  readonly systemPromptFor?: (taskType: M3kAiTaskType) => string | undefined;
  /** Full override of message construction; bypasses `systemPromptFor`. */
  readonly buildMessages?: (
    request: M3kAiTaskRequest<unknown>
  ) => readonly M3kAiChatMessage[];
  /**
   * Parse `extract-json` outputs into objects (stripping ``` fences).
   * Defaults to `true`; set `false` to always return the raw string.
   */
  readonly parseJsonForExtract?: boolean;
}

const DEFAULT_SYSTEM_PROMPTS: Readonly<Record<string, string>> = {
  summarize:
    'You are a concise summarizer. Return a faithful summary of the user text and nothing else.',
  rewrite:
    'You are an editor. Rewrite the user text for clarity while preserving meaning. Return only the rewrite.',
  'extract-json':
    'Extract the requested information and respond with a single valid JSON object. No prose, no code fences.',
  classify:
    'Classify the user text. Respond with a single JSON object: {"label": string, "score": number}.',
};

function defaultSystemPrompt(taskType: M3kAiTaskType): string | undefined {
  return DEFAULT_SYSTEM_PROMPTS[taskType];
}

function toMessages(
  request: M3kAiTaskRequest<unknown>,
  options: M3kAiOpenAiAdapterOptions
): readonly M3kAiChatMessage[] {
  if (options.buildMessages) return options.buildMessages(request);
  const system = (options.systemPromptFor ?? defaultSystemPrompt)(
    request.taskType
  );
  const userContent =
    typeof request.input === 'string'
      ? request.input
      : JSON.stringify(request.input);
  const messages: M3kAiChatMessage[] = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: userContent });
  return messages;
}

/** HTTP failures carry a stable `name` so `classifyM3kAiError` can tag them. */
class M3kAiHttpError extends Error {
  constructor(status: number, body: string) {
    super(`OpenAI-compatible endpoint returned HTTP ${status}: ${body.slice(0, 200)}`);
    this.name = `http_${status}`;
  }
}

function buildHeaders(options: M3kAiOpenAiAdapterOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...options.headers,
  };
  if (options.apiKey) headers['authorization'] = `Bearer ${options.apiKey}`;
  return headers;
}

function endpoint(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}/chat/completions`;
}

/** Extract `choices[0].message.content` from a parsed completion response. */
function readContent(payload: unknown): string {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'choices' in payload &&
    Array.isArray((payload as { choices: unknown }).choices)
  ) {
    const first = (payload as { choices: unknown[] }).choices[0];
    const content = (first as { message?: { content?: unknown } } | undefined)
      ?.message?.content;
    if (typeof content === 'string') return content;
  }
  return '';
}

/** Strip ``` / ```json fences some models wrap JSON in, then parse. */
function coerceJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

function finalize(
  request: M3kAiTaskRequest<unknown>,
  text: string,
  options: M3kAiOpenAiAdapterOptions
): unknown {
  const parseJson = options.parseJsonForExtract ?? true;
  if (parseJson && (request.taskType === 'extract-json' || request.taskType === 'classify')) {
    try {
      return coerceJson(text);
    } catch {
      return text;
    }
  }
  return text;
}

interface RequestContext {
  readonly signal: AbortSignal;
  readonly cleanup: () => void;
}

function withTimeout(timeoutMs: number | undefined): RequestContext {
  if (!timeoutMs || timeoutMs <= 0) {
    return { signal: new AbortController().signal, cleanup: () => undefined };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cleanup: () => clearTimeout(timer) };
}

/** Pull `choices[0].delta.content` out of one streamed SSE JSON frame. */
function readDelta(frame: unknown): string {
  if (
    typeof frame === 'object' &&
    frame !== null &&
    'choices' in frame &&
    Array.isArray((frame as { choices: unknown }).choices)
  ) {
    const first = (frame as { choices: unknown[] }).choices[0];
    const delta = (first as { delta?: { content?: unknown } } | undefined)
      ?.delta?.content;
    if (typeof delta === 'string') return delta;
  }
  return '';
}

/**
 * Build an OpenAI-compatible chat-completions {@link M3kAiRuntimeAdapter}.
 *
 * ```ts
 * const adapter = createOpenAiCompatibleAdapter({
 *   baseUrl: 'http://127.0.0.1:11434/v1',
 *   model: 'llama3.2',
 * });
 * const summary = await adapter.runTask({
 *   requestId: '1', taskType: 'summarize', input: longText,
 * });
 * ```
 */
export function createOpenAiCompatibleAdapter(
  options: M3kAiOpenAiAdapterOptions
): M3kAiRuntimeAdapter<unknown, unknown> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('createOpenAiCompatibleAdapter: no fetch implementation available');
  }
  const url = endpoint(options.baseUrl);
  const headers = buildHeaders(options);

  const post = (body: unknown, signal: AbortSignal): Promise<Response> =>
    fetchImpl(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });

  const basePayload = (
    request: M3kAiTaskRequest<unknown>,
    stream: boolean
  ): Record<string, unknown> => {
    const payload: Record<string, unknown> = {
      model: options.model,
      messages: toMessages(request, options),
      stream,
    };
    if (options.temperature !== undefined) payload['temperature'] = options.temperature;
    return payload;
  };

  return defineM3kAiAdapter<unknown, unknown>({
    id: options.id ?? 'm3kit-openai',
    run: async (request) => {
      const { signal, cleanup } = withTimeout(request.timeoutMs);
      try {
        const response = await post(basePayload(request, false), signal);
        if (!response.ok) {
          throw new M3kAiHttpError(response.status, await safeText(response));
        }
        const payload: unknown = await response.json();
        return finalize(request, readContent(payload), options);
      } finally {
        cleanup();
      }
    },
    runStreaming: async (request, emitChunk) => {
      const { signal, cleanup } = withTimeout(request.timeoutMs);
      try {
        const response = await post(basePayload(request, true), signal);
        if (!response.ok) {
          throw new M3kAiHttpError(response.status, await safeText(response));
        }
        const text = await consumeSse(response, emitChunk);
        return finalize(request, text, options);
      } finally {
        cleanup();
      }
    },
  });
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

/**
 * Read a `text/event-stream` completion, emitting each content delta and
 * returning the concatenated text. Tolerates frames split across chunks.
 */
async function consumeSse(
  response: Response,
  emitChunk: (chunk: string) => void
): Promise<string> {
  const body = response.body;
  if (!body) {
    // Non-streaming fallback: some gateways ignore `stream: true`.
    const payload: unknown = await response.json().catch(() => null);
    const content = readContent(payload);
    if (content) emitChunk(content);
    return content;
  }
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '' || data === '[DONE]') continue;
      let frame: unknown;
      try {
        frame = JSON.parse(data);
      } catch {
        continue;
      }
      const delta = readDelta(frame);
      if (delta) {
        full += delta;
        emitChunk(delta);
      }
    }
  }
  return full;
}
