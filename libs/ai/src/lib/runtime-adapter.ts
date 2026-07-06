import { M3kAiProgress, M3kAiRuntimeAdapter, M3kAiTaskRequest } from './protocol';

export interface DefineM3kAiAdapterOptions<TInput = unknown, TOutput = unknown> {
  id: string;
  init?: (emitProgress: (progress: M3kAiProgress) => void) => Promise<void> | void;
  run: (request: M3kAiTaskRequest<TInput>) => Promise<TOutput> | TOutput;
  runStreaming?: (request: M3kAiTaskRequest<TInput>, emitChunk: (chunk: string) => void) => Promise<TOutput> | TOutput;
  dispose?: () => Promise<void> | void;
}

export function defineM3kAiAdapter<TInput = unknown, TOutput = unknown>(
  options: DefineM3kAiAdapterOptions<TInput, TOutput>,
): M3kAiRuntimeAdapter<TInput, TOutput> {
  return {
    id: options.id,
    init: options.init,
    runTask: options.run,
    runTaskStreaming: options.runStreaming,
    dispose: options.dispose,
  };
}
