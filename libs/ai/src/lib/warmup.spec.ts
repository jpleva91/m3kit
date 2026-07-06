import { M3kAiFakeAdapter } from './fake-adapter';
import { warmupM3kAiRuntime } from './warmup';

describe('warmupM3kAiRuntime', () => {
  it('skips warmup when heuristics reject the runtime', async () => {
    const events: unknown[] = [];

    await expect(
      warmupM3kAiRuntime({
        adapter: new M3kAiFakeAdapter(),
        skipContext: { explicitlyDisabled: true },
        telemetry: (event) => events.push(event),
      }),
    ).resolves.toEqual({ state: 'skipped', skipReason: 'disabled' });
    expect(events).toEqual([
      { name: 'm3k_ai_warmup_skipped', properties: { adapterId: 'm3kit-fake-ai', skipReason: 'disabled' } },
    ]);
  });

  it('reports ready after adapter init', async () => {
    await expect(warmupM3kAiRuntime({ adapter: new M3kAiFakeAdapter() })).resolves.toEqual({ state: 'ready' });
  });
});
