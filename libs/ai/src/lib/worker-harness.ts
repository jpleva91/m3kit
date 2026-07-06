import { M3kAiRuntimeAdapter, M3kAiWorkerMessage } from './protocol';

export interface M3kAiWorkerHarnessOptions {
  adapter: M3kAiRuntimeAdapter;
  scope?: M3kAiWorkerGlobalScope;
}

export interface M3kAiWorkerGlobalScope {
  postMessage(message: M3kAiWorkerMessage): void;
  onmessage: ((event: MessageEvent) => void) | null;
  performance?: Pick<Performance, 'now'>;
}

export function createM3kAiWorker(options: M3kAiWorkerHarnessOptions): void {
  const adapter = options.adapter;
  const scope = options.scope ?? (globalThis as unknown as M3kAiWorkerGlobalScope);
  const cancelled = new Set<string>();
  const clock = scope.performance ?? globalThis.performance;
  const emit = (message: M3kAiWorkerMessage) => scope.postMessage(message);

  scope.onmessage = async ({ data }: MessageEvent) => {
    try {
      if (data?.type === 'init') {
        await adapter.init?.((progress) => emit({ type: 'progress', progress }));
        emit({ type: 'ready', adapterId: adapter.id });
        return;
      }

      if (data?.type === 'cancel') {
        cancelled.add(data.requestId);
        return;
      }

      if (data?.type !== 'task') return;

      const request = data.request;
      const started = clock.now();
      if (cancelled.has(request.requestId)) return;

      const output =
        request.stream && adapter.runTaskStreaming
          ? await adapter.runTaskStreaming(request, (chunk) => {
              if (!cancelled.has(request.requestId)) emit({ type: 'chunk', requestId: request.requestId, chunk });
            })
          : await adapter.runTask(request);

      if (cancelled.has(request.requestId)) return;

      emit({
        type: 'result',
        result: {
          requestId: request.requestId,
          taskType: request.taskType,
          output,
          correlationKey: request.correlationKey,
          durationMs: Math.round(clock.now() - started),
          adapterId: adapter.id,
        },
      });
    } catch (error) {
      emit({
        type: 'error',
        error: {
          requestId: data?.request?.requestId,
          errorClass: classifyM3kAiError(error),
          message: error instanceof Error ? error.message : String(error),
        },
      });
    }
  };
}

export function classifyM3kAiError(error: unknown): string {
  if (error instanceof DOMException) return error.name;
  if (error instanceof Error && error.name) return error.name;
  return 'unknown_m3k_ai_error';
}
