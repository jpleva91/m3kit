export type M3kAiWarmupState = 'idle' | 'warming' | 'ready' | 'failed' | 'skipped';

export type M3kAiTaskType = 'summarize' | 'rewrite' | 'extract-json' | 'classify' | (string & {});

export interface M3kAiTaskRequest<TInput = unknown, TOptions = unknown> {
  requestId: string;
  taskType: M3kAiTaskType;
  input: TInput;
  options?: TOptions;
  correlationKey?: string;
  timeoutMs?: number;
  stream?: boolean;
}

export interface M3kAiTaskResult<TOutput = unknown> {
  requestId: string;
  taskType: M3kAiTaskType;
  output: TOutput;
  correlationKey?: string;
  durationMs?: number;
  adapterId?: string;
}

export interface M3kAiTaskError {
  requestId?: string;
  errorClass: string;
  message?: string;
  retryable?: boolean;
}

export interface M3kAiProgress {
  phase: 'download' | 'init' | 'task' | (string & {});
  loaded?: number;
  total?: number;
  message?: string;
}

export type M3kAiWorkerMessage<TOutput = unknown> =
  | { type: 'ready'; adapterId?: string }
  | { type: 'progress'; progress: M3kAiProgress }
  | { type: 'chunk'; requestId: string; chunk: string }
  | { type: 'result'; result: M3kAiTaskResult<TOutput> }
  | { type: 'error'; error: M3kAiTaskError };

export type M3kAiMainMessage<TInput = unknown, TOptions = unknown> =
  | { type: 'init' }
  | { type: 'task'; request: M3kAiTaskRequest<TInput, TOptions> }
  | { type: 'cancel'; requestId: string };

export interface M3kAiRuntimeAdapter<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  init?(emitProgress: (progress: M3kAiProgress) => void): Promise<void> | void;
  runTask(request: M3kAiTaskRequest<TInput>): Promise<TOutput> | TOutput;
  runTaskStreaming?(request: M3kAiTaskRequest<TInput>, emitChunk: (chunk: string) => void): Promise<TOutput> | TOutput;
  dispose?(): Promise<void> | void;
}

export interface M3kAiSkipContext {
  explicitlyDisabled?: boolean;
  workerSupported?: boolean;
  saveData?: boolean;
  effectiveType?: string;
  quotaBytes?: number;
  usageBytes?: number;
  minRemainingStorageBytes?: number;
}

export type M3kAiSkipReason = 'disabled' | 'worker_unsupported' | 'save_data' | 'slow_connection' | 'low_storage';

export interface M3kAiWarmupSnapshot {
  state: M3kAiWarmupState;
  progress?: M3kAiProgress;
  skipReason?: M3kAiSkipReason;
  error?: M3kAiTaskError;
}

export interface M3kAiTelemetryEvent {
  name:
    | 'm3k_ai_warmup_started'
    | 'm3k_ai_warmup_ready'
    | 'm3k_ai_warmup_failed'
    | 'm3k_ai_warmup_skipped'
    | 'm3k_ai_task_started'
    | 'm3k_ai_task_completed'
    | 'm3k_ai_task_failed'
    | 'm3k_ai_stale_result_discarded';
  properties?: Record<string, string | number | boolean | undefined>;
}

export type M3kAiTelemetrySink = (event: M3kAiTelemetryEvent) => void;

export interface M3kAiRunOptions<TOutput = unknown> {
  correlationKey?: string;
  timeoutMs?: number;
  validate?: (output: unknown) => output is TOutput;
  fallback?: () => TOutput | Promise<TOutput>;
  isCurrent?: (correlationKey: string | undefined) => boolean;
}
