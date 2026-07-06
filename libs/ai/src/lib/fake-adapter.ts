import { M3kAiRuntimeAdapter, M3kAiTaskRequest } from './protocol';

export interface M3kAiFakeAdapterOptions {
  delayMs?: number;
  output?: unknown;
}

export class M3kAiFakeAdapter implements M3kAiRuntimeAdapter<unknown, unknown> {
  readonly id = 'm3kit-fake-ai';

  constructor(private readonly options: M3kAiFakeAdapterOptions = {}) {}

  async init(): Promise<void> {
    await wait(this.options.delayMs ?? 0);
  }

  async runTask(request: M3kAiTaskRequest<unknown>): Promise<unknown> {
    await wait(this.options.delayMs ?? 0);
    if (this.options.output !== undefined) return this.options.output;

    if (request.taskType === 'summarize') return summarizeForFixture(String(request.input ?? ''));
    if (request.taskType === 'classify') return { label: 'fixture', score: 1 };
    if (request.taskType === 'extract-json') return { value: request.input };
    return request.input;
  }

  async runTaskStreaming(request: M3kAiTaskRequest<unknown>, emitChunk: (chunk: string) => void): Promise<unknown> {
    const output = await this.runTask(request);
    const text = typeof output === 'string' ? output : JSON.stringify(output);
    for (const chunk of text.split(/\s+/).filter(Boolean)) {
      emitChunk(chunk);
    }
    return output;
  }
}

function summarizeForFixture(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 120) return trimmed;
  return `${trimmed.slice(0, 117)}...`;
}

function wait(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}
