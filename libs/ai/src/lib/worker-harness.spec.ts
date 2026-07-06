import { defineM3kAiAdapter } from './runtime-adapter';

import { createM3kAiWorker, M3kAiWorkerGlobalScope } from './worker-harness';

describe('createM3kAiWorker', () => {
  it('emits ready and result messages for task requests', async () => {
    const messages: unknown[] = [];
    const scope: M3kAiWorkerGlobalScope = {
      postMessage: (message) => messages.push(message),
      onmessage: null,
      performance: { now: () => 10 },
    };
    const adapter = defineM3kAiAdapter<string, string>({ id: 'test-adapter', run: ({ input }) => `ok:${input}` });

    createM3kAiWorker({ adapter, scope });
    await scope.onmessage?.({ data: { type: 'init' } } as MessageEvent);
    await scope.onmessage?.({
      data: { type: 'task', request: { requestId: 'r1', taskType: 'rewrite', input: 'hello' } },
    } as MessageEvent);

    expect(messages).toEqual([
      { type: 'ready', adapterId: 'test-adapter' },
      {
        type: 'result',
        result: {
          requestId: 'r1',
          taskType: 'rewrite',
          output: 'ok:hello',
          correlationKey: undefined,
          durationMs: 0,
          adapterId: 'test-adapter',
        },
      },
    ]);
  });

  it('does not emit cancelled task results', async () => {
    const messages: unknown[] = [];
    const scope: M3kAiWorkerGlobalScope = { postMessage: (message) => messages.push(message), onmessage: null };
    const adapter = defineM3kAiAdapter<string, string>({ id: 'test-adapter', run: ({ input }) => input });

    createM3kAiWorker({ adapter, scope });
    await scope.onmessage?.({ data: { type: 'cancel', requestId: 'r1' } } as MessageEvent);
    await scope.onmessage?.({
      data: { type: 'task', request: { requestId: 'r1', taskType: 'rewrite', input: 'hello' } },
    } as MessageEvent);

    expect(messages).toEqual([]);
  });
});
