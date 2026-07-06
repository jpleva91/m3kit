import { createM3kAiTelemetrySink, redactM3kAiTelemetry } from './telemetry';

describe('m3k ai telemetry', () => {
  it('drops prompt and output shaped properties by default', () => {
    expect(
      redactM3kAiTelemetry({
        name: 'm3k_ai_task_completed',
        properties: {
          adapterId: 'fake',
          taskType: 'summarize',
          durationMs: 12,
          prompt: 'secret prompt',
          output: 'secret output',
        },
      }),
    ).toEqual({
      name: 'm3k_ai_task_completed',
      properties: { adapterId: 'fake', taskType: 'summarize', durationMs: 12 },
    });
  });

  it('wraps custom sinks with redaction', () => {
    const events: unknown[] = [];
    const sink = createM3kAiTelemetrySink((event) => events.push(event));

    sink({ name: 'm3k_ai_task_failed', properties: { errorClass: 'AbortError', input: 'private' } });

    expect(events).toEqual([{ name: 'm3k_ai_task_failed', properties: { errorClass: 'AbortError' } }]);
  });
});
