import {
  Tree,
  joinPathFragments,
  names,
  readJson,
  updateJson,
  writeJson,
} from '@nx/devkit';

import { detectScope } from '../utils/detect-scope';
import { portAnalyzeGenerator, type PortingAnalysis } from '../port-analyze/generator';
import type { PortPageGeneratorSchema } from './schema';

/** Generate side-by-side Nx-style app porting scaffolds without touching source app routes. */
export async function portPageGenerator(tree: Tree, options: PortPageGeneratorSchema): Promise<void> {
  const analysis = await loadAnalysis(tree, options);
  const domain = options.domain ?? analysis.domain;
  const page = options.page ?? analysis.page;
  const scope = options.scope ?? detectScope(tree);
  const destinationRoot = options.destinationRoot ?? joinPathFragments('libs', domain);
  const packetDir = joinPathFragments('m3kit-porting', domain, page);
  const libs = normalizeLibs(options.libs ?? analysis.inferredM3kitLibs);
  const mode = options.mode ?? 'scaffold';

  const files = mode === 'runbook-only' ? packetFiles(packetDir, analysis, scope, libs) : [
    ...scaffoldFiles(destinationRoot, domain, page, scope, analysis),
    ...packetFiles(packetDir, analysis, scope, libs),
  ];
  const conflicts = files.map((file) => file.path).filter((path) => tree.exists(path) && !safePacketRewrite(path) && !options.force);
  if (conflicts.length > 0) {
    tree.write(joinPathFragments(packetDir, 'conflicts.md'), conflictReport(conflicts));
    throw new Error(`Refusing to overwrite existing destination files without --force: ${conflicts.join(', ')}`);
  }

  for (const file of files) {
    tree.write(file.path, file.content);
  }
  if (mode !== 'runbook-only') {
    writeProjectMetadata(tree, destinationRoot, domain, page);
    updateTsconfigPaths(tree, destinationRoot, domain, page, scope);
  }

}

async function loadAnalysis(tree: Tree, options: PortPageGeneratorSchema): Promise<PortingAnalysis> {
  if (options.analysis) {
    return readJson(tree, options.analysis) as PortingAnalysis;
  }
  if (!options.target) {
    throw new Error('port-page requires --analysis or --target.');
  }
  return portAnalyzeGenerator(tree, {
    target: options.target,
    domain: options.domain,
    page: options.page,
    write: false,
  });
}

function normalizeLibs(libs: string[]): string[] {
  return ['core', 'theme', 'shell', 'forms', 'table', 'dashboard', 'charts', 'feedback', 'state'].filter((lib) => libs.includes(lib));
}

function safePacketRewrite(path: string): boolean {
  return path.startsWith('m3kit-porting/') && !path.endsWith('analysis.json');
}

interface GeneratedFile {
  path: string;
  content: string;
}

function scaffoldFiles(
  root: string,
  domain: string,
  page: string,
  scope: string,
  analysis: PortingAnalysis,
): GeneratedFile[] {
  const { fileName, className, constantName } = names(page);
  const featureRoot = joinPathFragments(root, `feature-${fileName}`, 'src');
  const dataRoot = joinPathFragments(root, 'data-access', 'src');
  const uiRoot = joinPathFragments(root, 'ui', 'src');
  return [
    ...testableLibraryConfigFiles(joinPathFragments(root, `feature-${fileName}`)),
    { path: joinPathFragments(featureRoot, 'index.ts'), content: `export * from './lib/${fileName}-page.component';\n` },
    { path: joinPathFragments(featureRoot, 'lib', `${fileName}-page.component.ts`), content: featureComponentTs(fileName, className, scope, domain) },
    { path: joinPathFragments(featureRoot, 'lib', `${fileName}-page.component.html`), content: featureComponentHtml(fileName) },
    { path: joinPathFragments(featureRoot, 'lib', `${fileName}-page.component.scss`), content: pageScss(fileName) },
    { path: joinPathFragments(featureRoot, 'lib', `${fileName}-page.component.spec.ts`), content: featureSpec(fileName, className) },
    ...testableLibraryConfigFiles(joinPathFragments(root, 'data-access')),
    { path: joinPathFragments(dataRoot, 'index.ts'), content: `export * from './lib/${fileName}.facade';\n` },
    { path: joinPathFragments(dataRoot, 'lib', `${fileName}.facade.ts`), content: facadeTs(className, constantName, analysis) },
    { path: joinPathFragments(dataRoot, 'lib', `${fileName}.facade.spec.ts`), content: facadeSpec(className, fileName) },
    ...testableLibraryConfigFiles(joinPathFragments(root, 'ui')),
    { path: joinPathFragments(uiRoot, 'index.ts'), content: `export * from './lib/${fileName}-summary.component';\n` },
    { path: joinPathFragments(uiRoot, 'lib', `${fileName}-summary.component.ts`), content: summaryComponentTs(fileName, className) },
    { path: joinPathFragments(uiRoot, 'lib', `${fileName}-summary.component.html`), content: summaryComponentHtml(fileName) },
    { path: joinPathFragments(uiRoot, 'lib', `${fileName}-summary.component.scss`), content: summaryComponentScss(fileName) },
    { path: joinPathFragments(uiRoot, 'lib', `${fileName}-summary.component.spec.ts`), content: summarySpec(fileName, className) },
    { path: joinPathFragments(uiRoot, 'lib', `${fileName}-summary.component.stories.ts`), content: summaryStories(fileName, className) },
    { path: joinPathFragments(uiRoot, 'lib', `${fileName}-summary.component.cy.ts`), content: summaryCy(fileName, className) },
  ];
}

function testableLibraryConfigFiles(projectRoot: string): GeneratedFile[] {
  return [
    { path: joinPathFragments(projectRoot, 'tsconfig.json'), content: tsconfigJson() },
    { path: joinPathFragments(projectRoot, 'tsconfig.lib.json'), content: tsconfigLibJson() },
    { path: joinPathFragments(projectRoot, 'tsconfig.spec.json'), content: tsconfigSpecJson() },
    { path: joinPathFragments(projectRoot, 'vite.config.mts'), content: viteConfigMts(projectRoot) },
    { path: joinPathFragments(projectRoot, 'src', 'test-setup.ts'), content: testSetupTs() },
  ];
}

function packetFiles(packetDir: string, analysis: PortingAnalysis, scope: string, libs: string[]): GeneratedFile[] {
  return [
    { path: joinPathFragments(packetDir, 'spec.md'), content: specMd(analysis) },
    { path: joinPathFragments(packetDir, 'plan.md'), content: planMd(analysis) },
    { path: joinPathFragments(packetDir, 'tasks.md'), content: tasksMd(analysis) },
    { path: joinPathFragments(packetDir, 'quickstart.md'), content: quickstartMd(analysis) },
    { path: joinPathFragments(packetDir, 'governance.yaml'), content: governanceYaml() },
    { path: joinPathFragments(packetDir, 'runbook.md'), content: runbookMd(analysis, scope, libs) },
    { path: joinPathFragments(packetDir, 'ai-wiring-prompt.md'), content: aiPromptMd(analysis) },
    { path: joinPathFragments(packetDir, 'contracts', 'source-behavior.md'), content: sourceBehaviorContract(analysis) },
    { path: joinPathFragments(packetDir, 'contracts', 'data-access.md'), content: dataAccessContract(analysis) },
    { path: joinPathFragments(packetDir, 'contracts', 'ui-states.md'), content: uiStatesContract(analysis) },
    { path: joinPathFragments(packetDir, 'checklists', 'requirements.md'), content: requirementsChecklist() },
  ];
}

function writeProjectMetadata(tree: Tree, root: string, domain: string, page: string): void {
  const fileName = names(page).fileName;
  const projects = [
    { path: joinPathFragments(root, `feature-${fileName}`, 'project.json'), name: `${domain}-feature-${fileName}`, tags: [`scope:${domain}`, 'type:feature'] },
    { path: joinPathFragments(root, 'data-access', 'project.json'), name: `${domain}-data-access`, tags: [`scope:${domain}`, 'type:data-access'] },
    { path: joinPathFragments(root, 'ui', 'project.json'), name: `${domain}-ui`, tags: [`scope:${domain}`, 'type:ui'] },
  ];
  for (const project of projects) {
    writeJson(tree, project.path, {
      name: project.name,
      $schema: '../../../node_modules/nx/schemas/project-schema.json',
      projectType: 'library',
      sourceRoot: project.path.replace('/project.json', '/src'),
      tags: project.tags,
      targets: {
        test: {
          executor: '@nx/vite:test',
          outputs: ['{options.reportsDirectory}'],
          options: {
            reportsDirectory: joinPathFragments('../../../coverage', project.path.replace('/project.json', '')),
          },
        },
      },
    });
  }
}

function tsconfigJson(): string {
  return `${JSON.stringify({
    compilerOptions: {
      target: 'es2022',
      forceConsistentCasingInFileNames: true,
      strict: true,
      noImplicitOverride: true,
      noPropertyAccessFromIndexSignature: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
    },
    files: [],
    include: [],
    references: [{ path: './tsconfig.lib.json' }, { path: './tsconfig.spec.json' }],
    extends: '../../../tsconfig.base.json',
    angularCompilerOptions: {
      enableI18nLegacyMessageIdFormat: false,
      strictInjectionParameters: true,
      strictInputAccessModifiers: true,
      strictTemplates: true,
    },
  }, null, 2)}\n`;
}

function tsconfigLibJson(): string {
  return `${JSON.stringify({
    extends: './tsconfig.json',
    compilerOptions: {
      outDir: '../../../dist/out-tsc',
      declaration: true,
      declarationMap: true,
      inlineSources: true,
      types: [],
    },
    exclude: [
      'src/**/*.spec.ts',
      'src/test-setup.ts',
      'src/**/*.test.ts',
      '**/*.stories.ts',
      '**/*.stories.js',
      'cypress/**/*',
      'cypress.config.ts',
      '**/*.cy.ts',
      '**/*.cy.js',
      '**/*.cy.tsx',
      '**/*.cy.jsx',
    ],
    include: ['src/**/*.ts'],
  }, null, 2)}\n`;
}

function tsconfigSpecJson(): string {
  return `${JSON.stringify({
    extends: './tsconfig.json',
    compilerOptions: {
      outDir: '../../../dist/out-tsc',
      target: 'es2016',
      types: ['vitest/globals', 'vitest/importMeta', 'vite/client', 'node'],
    },
    files: ['src/test-setup.ts'],
    include: ['vite.config.mts', 'src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/*.d.ts'],
  }, null, 2)}\n`;
}

function viteConfigMts(projectRoot: string): string {
  return `/// <reference types="vitest" />\nimport angular from '@analogjs/vite-plugin-angular';\nimport { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';\nimport { defineConfig } from 'vite';\n\nexport default defineConfig({\n  root: __dirname,\n  cacheDir: '../../../node_modules/.vite/${projectRoot}',\n  plugins: [angular(), nxViteTsPaths()],\n  test: {\n    watch: false,\n    globals: true,\n    environment: 'jsdom',\n    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],\n    setupFiles: ['src/test-setup.ts'],\n    reporters: ['default'],\n    coverage: {\n      reportsDirectory: '../../../coverage/${projectRoot}',\n      provider: 'v8' as const,\n    },\n  },\n});\n`;
}

function testSetupTs(): string {
  return `import '@analogjs/vitest-angular/setup-zone';\n\nimport { getTestBed } from '@angular/core/testing';\nimport {\n  BrowserDynamicTestingModule,\n  platformBrowserDynamicTesting,\n} from '@angular/platform-browser-dynamic/testing';\n\ngetTestBed().initTestEnvironment(\n  BrowserDynamicTestingModule,\n  platformBrowserDynamicTesting(),\n  {\n    errorOnUnknownElements: true,\n    errorOnUnknownProperties: true,\n  }\n);\n`;
}

function updateTsconfigPaths(tree: Tree, root: string, domain: string, page: string, scope: string): void {
  if (!tree.exists('tsconfig.base.json')) {
    writeJson(tree, 'tsconfig.base.json', { compilerOptions: { paths: {} } });
  }
  updateJson(tree, 'tsconfig.base.json', (json) => {
    json.compilerOptions ??= {};
    json.compilerOptions.paths ??= {};
    const fileName = names(page).fileName;
    json.compilerOptions.paths[`@${scope}/${domain}/feature-${fileName}`] = [joinPathFragments(root, `feature-${fileName}`, 'src', 'index.ts')];
    json.compilerOptions.paths[`@${scope}/${domain}/data-access`] = [joinPathFragments(root, 'data-access', 'src', 'index.ts')];
    json.compilerOptions.paths[`@${scope}/${domain}/ui`] = [joinPathFragments(root, 'ui', 'src', 'index.ts')];
    return json;
  });
}

function featureComponentTs(fileName: string, className: string, scope: string, domain: string): string {
  return `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';\nimport { PageHeaderComponent } from '@${scope}/shell';\nimport { ${className}Facade } from '@${scope}/${domain}/data-access';\nimport { ${className}SummaryComponent } from '@${scope}/${domain}/ui';\n\n@Component({\n  selector: 'app-${fileName}-page',\n  imports: [PageHeaderComponent, ${className}SummaryComponent],\n  templateUrl: './${fileName}-page.component.html',\n  styleUrl: './${fileName}-page.component.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ${className}PageComponent {\n  protected readonly facade = inject(${className}Facade);\n}\n`;
}

function featureComponentHtml(fileName: string): string {
  return `<section class="${fileName}-page">\n  <m3k-page-header title="${names(fileName).className}" subtitle="Side-by-side port scaffold" />\n  <app-${fileName}-summary [state]="facade.state()" />\n</section>\n`;
}

function pageScss(fileName: string): string {
  return `.${fileName}-page {\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n}\n`;
}

function featureSpec(fileName: string, className: string): string {
  return `import { TestBed } from '@angular/core/testing';\nimport { provideNoopAnimations } from '@angular/platform-browser/animations';\n\nimport { ${className}PageComponent } from './${fileName}-page.component';\n\ndescribe('${className}PageComponent', () => {\n  it('renders the side-by-side port shell', async () => {\n    await TestBed.configureTestingModule({\n      imports: [${className}PageComponent],\n      providers: [provideNoopAnimations()],\n    }).compileComponents();\n\n    const fixture = TestBed.createComponent(${className}PageComponent);\n    fixture.detectChanges();\n\n    expect((fixture.nativeElement as HTMLElement).querySelector('m3k-page-header')).not.toBeNull();\n  });\n});\n`;
}

function facadeTs(className: string, constantName: string, analysis: PortingAnalysis): string {
  return `import { Injectable, signal } from '@angular/core';\n\nexport interface ${className}PortState {\n  readonly status: 'pending-manual-review' | 'ready-for-wiring';\n  readonly sourceFiles: readonly string[];\n  readonly manualReviewItems: readonly string[];\n}\n\nconst ${constantName}_INITIAL_STATE: ${className}PortState = {\n  status: 'pending-manual-review',\n  sourceFiles: ${JSON.stringify(analysis.sourceFiles, null, 2)},\n  manualReviewItems: ${JSON.stringify(analysis.manualReviewItems, null, 2)},\n};\n\n@Injectable({ providedIn: 'root' })\nexport class ${className}Facade {\n  readonly state = signal<${className}PortState>(${constantName}_INITIAL_STATE);\n}\n`;
}

function facadeSpec(className: string, fileName: string): string {
  return `import { TestBed } from '@angular/core/testing';\n\nimport { ${className}Facade } from './${fileName}.facade';\n\ndescribe('${className}Facade', () => {\n  it('starts in pending manual review until source behavior is ported', () => {\n    const facade = TestBed.inject(${className}Facade);\n\n    expect(facade.state().status).toBe('pending-manual-review');\n    expect(facade.state().manualReviewItems.length).toBeGreaterThan(0);\n  });\n});\n`;
}

function summaryComponentTs(fileName: string, className: string): string {
  return `import { ChangeDetectionStrategy, Component, input } from '@angular/core';\n\n@Component({\n  selector: 'app-${fileName}-summary',\n  templateUrl: './${fileName}-summary.component.html',\n  styleUrl: './${fileName}-summary.component.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ${className}SummaryComponent {\n  readonly state = input.required<{ readonly status: string; readonly sourceFiles: readonly string[]; readonly manualReviewItems: readonly string[] }>();\n}\n`;
}

function summaryComponentHtml(fileName: string): string {
  return `<section class="${fileName}-summary">\n  <h2>Porting status: {{ state().status }}</h2>\n  <p>Source files: {{ state().sourceFiles.length }}</p>\n  <ul>\n    @for (item of state().manualReviewItems; track item) {\n      <li>{{ item }}</li>\n    }\n  </ul>\n</section>\n`;
}

function summaryComponentScss(fileName: string): string {
  return `.${fileName}-summary {\n  display: grid;\n  gap: 0.75rem;\n  padding: 1rem;\n  border: 1px solid var(--mat-sys-outline-variant);\n  border-radius: var(--app-radius-card);\n  color: var(--mat-sys-on-surface);\n  background: var(--mat-sys-surface);\n}\n`;
}

function summarySpec(fileName: string, className: string): string {
  return `import { TestBed } from '@angular/core/testing';\n\nimport { ${className}SummaryComponent } from './${fileName}-summary.component';\n\ndescribe('${className}SummaryComponent', () => {\n  it('renders pending manual-review items', async () => {\n    await TestBed.configureTestingModule({ imports: [${className}SummaryComponent] }).compileComponents();\n    const fixture = TestBed.createComponent(${className}SummaryComponent);\n    fixture.componentRef.setInput('state', { status: 'pending-manual-review', sourceFiles: ['source.ts'], manualReviewItems: ['Write RED first'] });\n    fixture.detectChanges();\n\n    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Write RED first');\n  });\n});\n`;
}

function summaryStories(fileName: string, className: string): string {
  return `import type { Meta, StoryObj } from '@storybook/angular';\n\nimport { ${className}SummaryComponent } from './${fileName}-summary.component';\n\nconst meta: Meta<${className}SummaryComponent> = {\n  component: ${className}SummaryComponent,\n  title: 'Porting/${className}Summary',\n};\nexport default meta;\n\ntype Story = StoryObj<${className}SummaryComponent>;\n\nexport const PendingManualReview: Story = {\n  args: {\n    state: { status: 'pending-manual-review', sourceFiles: ['source.ts'], manualReviewItems: ['Write RED first'] },\n  },\n};\n`;
}

function summaryCy(fileName: string, className: string): string {
  return `import { ${className}SummaryComponent } from './${fileName}-summary.component';\n\ndescribe(${className}SummaryComponent.name, () => {\n  it('renders manual review items', () => {\n    cy.mount(${className}SummaryComponent, {\n      componentProperties: { state: { status: 'pending-manual-review', sourceFiles: ['source.ts'], manualReviewItems: ['Write RED first'] } },\n    });\n    cy.contains('Write RED first');\n  });\n});\n`;
}

function specMd(analysis: PortingAnalysis): string {
  return `# Spec: Port ${analysis.domain}/${analysis.page}\n\nPort \`${analysis.target}\` side-by-side into m3kit-aligned feature/data-access/ui layers. The old route remains authoritative until a human approves replacement.\n`;
}

function planMd(analysis: PortingAnalysis): string {
  return `# Plan\n\n1. Preserve source files: ${analysis.sourceFiles.map((file) => `\`${file}\``).join(', ')}.\n2. Write RED first specs for facade, feature shell, and UI summary.\n3. Wire generated route manually and compare side-by-side.\n`;
}

function tasksMd(analysis: PortingAnalysis): string {
  return `# Tasks\n\n- [ ] Confirm analysis packet first.\n- [ ] Keep RED first tests failing for real business behavior before implementation.\n- [ ] Review data seams: ${analysis.dataAccessSeams.map((seam) => seam.file).join(', ') || 'none detected'}.\n- [ ] Perform manual wiring only after review.\n`;
}

function quickstartMd(analysis: PortingAnalysis): string {
  return `# Quickstart\n\n\`\`\`sh\nnpx nx test ${analysis.domain}-data-access\nnpx nx test ${analysis.domain}-ui\nnpx nx test ${analysis.domain}-feature-${analysis.page}\n\`\`\`\n\nUse the runbook for manual wiring.\n`;
}

function governanceYaml(): string {
  return `non_destructive_default: true\nroute_rewrite_allowed: false\nmanual_wiring_required: true\nverification_required:\n  - nx tests for generated libs\n  - side-by-side visual comparison\n`;
}

function runbookMd(analysis: PortingAnalysis, scope: string, libs: string[]): string {
  const fileName = names(analysis.page).fileName;
  const liftLibs = libs.filter((lib) => !['core', 'theme'].includes(lib)).join(',');
  return `# Runbook: ${analysis.domain}/${analysis.page}\n\n## analysis packet first\nReview \`analysis.json\`, \`data-access-map.md\`, and this runbook before editing app routes.\n\n## Lift m3kit libs\n\n\`\`\`sh\nnpx nx g @m3kit/plugin:lift --libs=${liftLibs} --scope=${scope}\n\`\`\`\n\n## manual wiring\nAdd a side-by-side route only after generated tests pass:\n\n\`\`\`ts\n{ path: '${fileName}', loadComponent: () => import('@${scope}/${analysis.domain}/feature-${fileName}').then((m) => m.${names(analysis.page).className}PageComponent) }\n\`\`\`\n\nDo not delete the old route/page. Compare behavior first.\n\n## Rollback\nRemove only the new side-by-side route snippet and keep original files untouched.\n`;
}

function aiPromptMd(analysis: PortingAnalysis): string {
  return `# Safe AI Wiring Prompt\n\nPort ${analysis.domain}/${analysis.page} from the generated packet. Do not delete, move, or rewrite the original route/page files. Keep manual wiring isolated, write RED first tests before behavior changes, and stop for human review before replacement.\n`;
}

function sourceBehaviorContract(analysis: PortingAnalysis): string {
  return `# Source Behavior Contract\n\nSource files to preserve byte-for-byte until replacement approval:\n${analysis.sourceFiles.map((file) => `- ${file}`).join('\n')}\n`;
}

function dataAccessContract(analysis: PortingAnalysis): string {
  return `# Data Access Contract\n\n${analysis.dataAccessSeams.map((seam) => `- ${seam.file}: ${seam.status} — ${seam.reason}`).join('\n') || '- No obvious data seam detected; confirm manually.'}\n`;
}

function uiStatesContract(analysis: PortingAnalysis): string {
  return `# UI States Contract\n\n${analysis.uiComponents.map((component) => `- ${component.kind}: ${component.evidence}`).join('\n') || '- Minimal shell only.'}\n`;
}

function requirementsChecklist(): string {
  return `# Requirements Checklist\n\n- [ ] analysis packet first reviewed.\n- [ ] RED first specs written before porting behavior.\n- [ ] Do not delete source files.\n- [ ] manual wiring only; no automatic route replacement.\n- [ ] rollback path documented.\n`;
}

function conflictReport(conflicts: string[]): string {
  return `# Conflict Report\n\nRefusing to overwrite existing files without \`--force\`:\n\n${conflicts.map((file) => `- ${file}`).join('\n')}\n`;
}

export default portPageGenerator;
