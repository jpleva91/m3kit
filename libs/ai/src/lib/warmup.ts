import {
  M3kAiRuntimeAdapter,
  M3kAiSkipContext,
  M3kAiTelemetrySink,
  M3kAiWarmupSnapshot,
} from './protocol';
import { getM3kAiSkipReason } from './heuristics';
import { createM3kAiTelemetrySink } from './telemetry';
import { classifyM3kAiError } from './worker-harness';

export interface M3kAiWarmupOptions {
  adapter: M3kAiRuntimeAdapter;
  skipContext?: M3kAiSkipContext;
  telemetry?: M3kAiTelemetrySink;
}

export async function warmupM3kAiRuntime(options: M3kAiWarmupOptions): Promise<M3kAiWarmupSnapshot> {
  const telemetry = createM3kAiTelemetrySink(options.telemetry);
  const skipReason = options.skipContext ? getM3kAiSkipReason(options.skipContext) : null;
  if (skipReason) {
    telemetry({ name: 'm3k_ai_warmup_skipped', properties: { adapterId: options.adapter.id, skipReason } });
    return { state: 'skipped', skipReason };
  }

  telemetry({ name: 'm3k_ai_warmup_started', properties: { adapterId: options.adapter.id } });
  try {
    let snapshot: M3kAiWarmupSnapshot = { state: 'warming' };
    await options.adapter.init?.((progress) => {
      snapshot = { state: 'warming', progress };
    });
    telemetry({ name: 'm3k_ai_warmup_ready', properties: { adapterId: options.adapter.id } });
    return { ...snapshot, state: 'ready' };
  } catch (error) {
    const taskError = {
      errorClass: classifyM3kAiError(error),
      message: error instanceof Error ? error.message : String(error),
      retryable: true,
    };
    telemetry({
      name: 'm3k_ai_warmup_failed',
      properties: { adapterId: options.adapter.id, errorClass: taskError.errorClass, retryable: true },
    });
    return { state: 'failed', error: taskError };
  }
}
