import { M3kAiFakeAdapter } from './fake-adapter';

import { M3kAiTaskRequest } from './protocol';

describe('M3kAiFakeAdapter', () => {
  it('returns deterministic summaries without model downloads', async () => {
    const adapter = new M3kAiFakeAdapter();
    const request: M3kAiTaskRequest<string> = {
      requestId: 'r1',
      taskType: 'summarize',
      input: `${'local '.repeat(30)}runtime`,
    };

    await expect(adapter.runTask(request)).resolves.toMatch(/\.\.\.$/);
  });

  it('streams fixture chunks and still resolves the final output', async () => {
    const adapter = new M3kAiFakeAdapter({ output: 'alpha beta' });
    const chunks: string[] = [];

    await expect(
      adapter.runTaskStreaming({ requestId: 'r2', taskType: 'rewrite', input: 'ignored' }, (chunk) => chunks.push(chunk)),
    ).resolves.toBe('alpha beta');
    expect(chunks).toEqual(['alpha', 'beta']);
  });
});
