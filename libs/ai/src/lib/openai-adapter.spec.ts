import { createOpenAiCompatibleAdapter } from './openai-adapter';
import { createCodexAdapter, M3KIT_CODEX_DEFAULT_MODEL } from './codex-adapter';
import { classifyM3kAiError } from './worker-harness';
import { M3kAiTaskRequest } from './protocol';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

function completion(content: string): unknown {
  return { choices: [{ message: { role: 'assistant', content } }] };
}

/**
 * Minimal `Response`-shaped stub whose `body.getReader()` replays the given
 * SSE frames. Avoids depending on a jsdom global `ReadableStream`, and
 * exercises exactly the reader contract the adapter consumes.
 */
function sseResponse(frames: readonly string[]): Response {
  const encoder = new TextEncoder();
  const queue = frames.map((frame) => encoder.encode(frame));
  let index = 0;
  const reader = {
    read: () =>
      Promise.resolve(
        index < queue.length
          ? { done: false, value: queue[index++] }
          : { done: true, value: undefined }
      ),
  };
  return {
    ok: true,
    status: 200,
    body: { getReader: () => reader },
  } as unknown as Response;
}

describe('createOpenAiCompatibleAdapter', () => {
  it('posts chat/completions and returns the message content', async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
      calls.push({ url: String(url), body: JSON.parse(String(init?.body)) });
      return jsonResponse(completion('a tidy summary'));
    }) as unknown as typeof fetch;

    const adapter = createOpenAiCompatibleAdapter({
      baseUrl: 'http://gw.local/v1',
      model: 'gpt-5.5',
      apiKey: 'placeholder',
      fetchImpl,
    });

    const request: M3kAiTaskRequest<string> = {
      requestId: 'r1',
      taskType: 'summarize',
      input: 'a very long body of text',
    };
    await expect(adapter.runTask(request)).resolves.toBe('a tidy summary');

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('http://gw.local/v1/chat/completions');
    const body = calls[0].body as { model: string; messages: Array<{ role: string }>; stream: boolean };
    expect(body.model).toBe('gpt-5.5');
    expect(body.stream).toBe(false);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[1].role).toBe('user');
  });

  it('parses extract-json outputs, tolerating code fences', async () => {
    const fetchImpl = (async () =>
      jsonResponse(completion('```json\n{"ok": true, "n": 2}\n```'))) as unknown as typeof fetch;
    const adapter = createOpenAiCompatibleAdapter({
      baseUrl: 'http://gw.local/v1',
      model: 'gpt-5.5',
      fetchImpl,
    });
    await expect(
      adapter.runTask({ requestId: 'r2', taskType: 'extract-json', input: 'x' })
    ).resolves.toEqual({ ok: true, n: 2 });
  });

  it('streams SSE deltas and resolves the concatenated text', async () => {
    const fetchImpl = (async () =>
      sseResponse([
        'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"lo"}}]}\n\n',
        'data: [DONE]\n\n',
      ])) as unknown as typeof fetch;
    const adapter = createOpenAiCompatibleAdapter({
      baseUrl: 'http://gw.local/v1',
      model: 'gpt-5.5',
      fetchImpl,
    });

    const chunks: string[] = [];
    await expect(
      adapter.runTaskStreaming?.(
        { requestId: 'r3', taskType: 'rewrite', input: 'x', stream: true },
        (chunk) => chunks.push(chunk)
      )
    ).resolves.toBe('Hello');
    expect(chunks).toEqual(['Hel', 'lo']);
  });

  it('throws a classifiable http_<status> error on non-2xx', async () => {
    const fetchImpl = (async () =>
      new Response('nope', { status: 429 })) as unknown as typeof fetch;
    const adapter = createOpenAiCompatibleAdapter({
      baseUrl: 'http://gw.local/v1',
      model: 'gpt-5.5',
      fetchImpl,
    });
    const error = await adapter
      .runTask({ requestId: 'r4', taskType: 'summarize', input: 'x' })
      .then(() => null)
      .catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(classifyM3kAiError(error)).toBe('http_429');
  });
});

describe('createCodexAdapter', () => {
  it('defaults to gpt-5.5 through the gateway and threads the bearer token', async () => {
    const calls: Array<{ auth: string | null; body: { model: string } }> = [];
    const fetchImpl = (async (_url: string | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      calls.push({
        auth: headers.get('authorization'),
        body: JSON.parse(String(init?.body)),
      });
      return jsonResponse(completion('ok'));
    }) as unknown as typeof fetch;

    const codex = createCodexAdapter({ apiKey: 'proxy-placeholder', fetchImpl });
    await codex.runTask({ requestId: 'r5', taskType: 'summarize', input: 'x' });

    expect(codex.id).toBe('m3kit-codex');
    expect(calls[0].auth).toBe('Bearer proxy-placeholder');
    expect(calls[0].body.model).toBe(M3KIT_CODEX_DEFAULT_MODEL);
  });
});
