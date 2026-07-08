import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import portAnalyzeSchema from './port-analyze/schema.json';
import portPageSchema from './port-page/schema.json';

describe('m3kit app porting skill and docs', () => {
  const repoRoot = join(__dirname, '../../../..');

  it('ships a skill whose command references match generator schemas', () => {
    const skill = readFileSync(join(repoRoot, 'skills/m3kit-app-port/SKILL.md'), 'utf-8');
    const analyzeOptions = Object.keys(portAnalyzeSchema.properties);
    const pageOptions = Object.keys(portPageSchema.properties);

    expect(skill).toContain('npx nx g @m3kit/plugin:port-analyze');
    expect(skill).toContain('npx nx g @m3kit/plugin:port-page');
    for (const option of ['target', 'domain', 'page', 'outputDir'] satisfies string[]) {
      expect(analyzeOptions).toContain(option);
      expect(skill).toContain(`--${option}`);
    }
    for (const option of ['analysis', 'destinationRoot', 'apply', 'force'] satisfies string[]) {
      expect(pageOptions).toContain(option);
      expect(skill).toContain(`--${option}`);
    }
  });

  it('documents safety boundaries, RED-first TDD, and manual wiring', () => {
    const skill = readFileSync(join(repoRoot, 'skills/m3kit-app-port/SKILL.md'), 'utf-8');
    const docs = readFileSync(join(repoRoot, 'docs/APP_PORTING.md'), 'utf-8');

    for (const content of [skill, docs]) {
      expect(content).toContain('analysis packet first');
      expect(content).toContain('RED first');
      expect(content).toContain('Do not delete');
      expect(content).toContain('manual wiring');
    }
  });

  it('documents the sanctioned external app probe limitation', () => {
    const skill = readFileSync(join(repoRoot, 'skills/m3kit-app-port/SKILL.md'), 'utf-8');
    const docs = readFileSync(join(repoRoot, 'docs/APP_PORTING.md'), 'utf-8');

    for (const content of [skill, docs]) {
      expect(content).toContain('external app');
      expect(content).toContain('apps/demo-reporting/src/app/legacy-probe');
      expect(content).toContain('hash before/after');
    }
  });
});
