import {
  Tree,
  getProjects,
  joinPathFragments,
  logger,
  names,
  writeJson,
} from '@nx/devkit';

import type { PortAnalyzeGeneratorSchema } from './schema';

export interface PortingAnalysis {
  schemaVersion: 1;
  target: string;
  projectName: string;
  domain: string;
  page: string;
  sourceFiles: string[];
  inferredM3kitLibs: string[];
  dataAccessSeams: Array<{ file: string; status: 'manual-review'; reason: string }>;
  uiComponents: Array<{ kind: string; evidence: string }>;
  routeSnippets: string[];
  manualReviewItems: string[];
  generatedAt: string;
}

/** Analyze one source page and emit a non-destructive m3kit porting packet. */
export async function portAnalyzeGenerator(
  tree: Tree,
  options: PortAnalyzeGeneratorSchema,
): Promise<PortingAnalysis> {
  const target = normalizePath(options.target);
  if (!tree.exists(target)) {
    throw new Error(`Unable to resolve target '${options.target}'. Pass a workspace-relative component/page path or add --project when ambiguous.`);
  }

  const projectName = resolveProjectName(tree, target, options.project);
  const page = options.page ?? inferPage(target);
  const domain = options.domain ?? inferDomain(target, page);
  const outputDir = options.outputDir ?? joinPathFragments('m3kit-porting', domain, page);
  const source = tree.read(target, 'utf-8') ?? '';
  const siblingSources = findSiblingSources(tree, target, source);
  const routeSnippets = findRouteSnippets(tree, projectName, page);
  const dataAccessSeams = siblingSources
    .filter((file) => file !== target)
    .map((file) => ({ file, status: 'manual-review' as const, reason: seamReason(tree.read(file, 'utf-8') ?? '') }));

  const analysis: PortingAnalysis = {
    schemaVersion: 1,
    target,
    projectName,
    domain,
    page,
    sourceFiles: [target, ...siblingSources.filter((file) => file !== target)],
    inferredM3kitLibs: inferM3kitLibs(source, siblingSources.map((file) => tree.read(file, 'utf-8') ?? '').join('\n')),
    dataAccessSeams,
    uiComponents: inferUiComponents(source),
    routeSnippets,
    manualReviewItems: buildManualReviewItems(source, dataAccessSeams),
    generatedAt: new Date().toISOString(),
  };

  if (options.write !== false) {
    writeAnalysisPacket(tree, outputDir, analysis, options.scope ?? 'ui');
  } else {
    logger.info(JSON.stringify(analysis, null, 2));
  }

  return analysis;
}

function normalizePath(path: string): string {
  return path.replace(/^\.\//, '').replace(/\\/g, '/');
}

function resolveProjectName(tree: Tree, target: string, explicitProject?: string): string {
  const projects = getProjects(tree);
  if (explicitProject) {
    const project = projects.get(explicitProject);
    if (!project) {
      throw new Error(`Unable to resolve project '${explicitProject}' for port-analyze.`);
    }
    return explicitProject;
  }

  const matches = [...projects.entries()].filter(([, project]) => {
    const root = normalizePath(project.root);
    const sourceRoot = normalizePath(project.sourceRoot ?? joinPathFragments(project.root, 'src'));
    return target.startsWith(`${sourceRoot}/`) || target.startsWith(`${root}/`);
  });
  if (matches.length !== 1) {
    throw new Error(`Unable to resolve target '${target}' to exactly one Nx project. Pass --project.`);
  }
  return matches[0][0];
}

function inferPage(target: string): string {
  const fileName = target.split('/').pop() ?? 'page';
  return fileName.replace(/\.component\.ts$/, '').replace(/\.page\.ts$/, '').replace(/\.ts$/, '');
}

function inferDomain(target: string, page: string): string {
  const parts = target.split('/');
  const pageIndex = parts.findIndex((part) => part === page || page.startsWith(part));
  if (pageIndex > 0) {
    return parts[pageIndex - 1];
  }
  return names(page).fileName.split('-')[0] || 'app';
}

function findSiblingSources(tree: Tree, target: string, source: string): string[] {
  const dir = target.split('/').slice(0, -1).join('/');
  const files = new Set<string>([target]);
  const relativeImports = [...source.matchAll(/from ['"](\.\.?\/[^'"]+)['"]/g)].map((match) => match[1]);
  for (const importPath of relativeImports) {
    const candidate = joinPathFragments(dir, importPath, '').replace(/\/$/, '');
    for (const suffix of ['.ts', '/index.ts']) {
      const path = normalizePath(`${candidate}${suffix}`);
      if (tree.exists(path)) {
        files.add(path);
      }
    }
  }
  return [...files];
}

function findRouteSnippets(tree: Tree, projectName: string, page: string): string[] {
  const project = getProjects(tree).get(projectName);
  const sourceRoot = project?.sourceRoot ?? joinPathFragments(project?.root ?? '', 'src');
  const routePaths = [
    joinPathFragments(sourceRoot, 'app', 'app.routes.ts'),
    joinPathFragments(sourceRoot, 'app', 'routes.ts'),
  ];
  const snippets: string[] = [];
  for (const routePath of routePaths) {
    if (!tree.exists(routePath)) {
      continue;
    }
    const routeSource = tree.read(routePath, 'utf-8') ?? '';
    const routeMatch = routeSource.match(/\{[^{}]*path:\s*['"][^'"]+['"][\s\S]*?\}/m);
    if (routeMatch) {
      snippets.push(routeMatch[0]);
    }
  }
  if (snippets.length === 0) {
    snippets.push(`{ path: '${page}', loadComponent: () => import('./${page}/${page}.component') }`);
  }
  return snippets;
}

function inferM3kitLibs(source: string, siblingSource: string): string[] {
  const combined = `${source}\n${siblingSource}`;
  const libs = new Set<string>(['core', 'theme', 'shell']);
  if (/form|ReactiveFormsModule|FormBuilder|formControlName/i.test(combined)) libs.add('forms');
  if (/mat-table|<table|dataSource|MatTableModule/i.test(combined)) libs.add('table');
  if (/chart|canvas|svg|trend|kpi/i.test(combined)) libs.add('charts');
  if (/error|empty|snackbar|dialog|banner|skeleton/i.test(combined)) libs.add('feedback');
  if (/HttpClient|Service|Store|signalStore|inject\(/i.test(combined)) libs.add('state');
  return ['core', 'theme', 'shell', 'forms', 'table', 'dashboard', 'charts', 'feedback', 'state'].filter((lib) => libs.has(lib));
}

function inferUiComponents(source: string): Array<{ kind: string; evidence: string }> {
  const checks: Array<[string, RegExp, string]> = [
    ['shell', /app-shell|router-outlet|page-header|toolbar|sidenav/i, 'shell/chrome markup'],
    ['forms', /form|ReactiveFormsModule|FormBuilder|formControlName/i, 'form controls'],
    ['table', /mat-table|<table|dataSource|MatTableModule/i, 'table-like data view'],
    ['dashboard', /kpi|metric|stat-card/i, 'dashboard metrics'],
    ['charts', /chart|canvas|svg|trend/i, 'chart-like visualization'],
    ['feedback', /error|empty|snackbar|dialog|banner|skeleton/i, 'feedback state'],
  ];
  return checks
    .filter(([, regex]) => regex.test(source))
    .map(([kind, , evidence]) => ({ kind, evidence }));
}

function seamReason(source: string): string {
  if (/HttpClient/i.test(source)) return 'HttpClient-backed data access must be adapted behind a generated facade.';
  if (/Store|Effects|signalStore/i.test(source)) return 'Store/effects data flow needs manual review before porting.';
  return 'Source service imported by target page; preserve behavior behind generated tests before wiring.';
}

function buildManualReviewItems(
  source: string,
  seams: Array<{ file: string; status: 'manual-review'; reason: string }>,
): string[] {
  const importedServices = [...source.matchAll(/import \{ ([^}]*Service[^}]*) \}/g)].map((match) => match[1]);
  const items = seams.map((seam) => `Review ${seam.file}: ${seam.reason}`);
  for (const service of importedServices) {
    items.push(`Port ${service.trim()} behind generated facade tests before replacing the original page.`);
  }
  if (items.length === 0) {
    items.push('No obvious data-access seam found; verify inputs, outputs, and UI states manually.');
  }
  return items;
}

function writeAnalysisPacket(tree: Tree, outputDir: string, analysis: PortingAnalysis, scope: string): void {
  writeJson(tree, joinPathFragments(outputDir, 'analysis.json'), analysis);
  tree.write(joinPathFragments(outputDir, 'porting-plan.md'), portingPlan(analysis, scope));
  tree.write(joinPathFragments(outputDir, 'component-inventory.md'), componentInventory(analysis));
  tree.write(joinPathFragments(outputDir, 'data-access-map.md'), dataAccessMap(analysis));
  tree.write(joinPathFragments(outputDir, 'test-plan.md'), testPlan(analysis));
}

function portingPlan(analysis: PortingAnalysis, scope: string): string {
  const liftLibs = analysis.inferredM3kitLibs.filter((lib) => !['core', 'theme'].includes(lib)).join(',');
  return `# m3kit Porting Plan: ${analysis.domain}/${analysis.page}\n\n` +
    `Target: \`${analysis.target}\`\n\n` +
    `Project: \`${analysis.projectName}\`\n\n` +
    `Recommended lift command:\n\n\`\`\`sh\nnpx nx g @m3kit/plugin:lift --libs=${liftLibs} --scope=${scope}\n\`\`\`\n\n` +
    `Generate side-by-side scaffold only; do not delete or rewrite the source page.\n`;
}

function componentInventory(analysis: PortingAnalysis): string {
  return `# Component Inventory\n\n${analysis.uiComponents.map((item) => `- ${item.kind}: ${item.evidence}`).join('\n')}\n`;
}

function dataAccessMap(analysis: PortingAnalysis): string {
  return `# Data Access Map\n\n${analysis.dataAccessSeams.map((item) => `- ${item.file}: ${item.status} — ${item.reason}`).join('\n')}\n`;
}

function testPlan(analysis: PortingAnalysis): string {
  return `# Test Plan\n\n- RED first: write failing specs for ${analysis.page} facade/component behavior before filling business logic.\n- Compare old and new routes side-by-side before replacement.\n- Keep all source files unchanged until human approval.\n`;
}

export default portAnalyzeGenerator;
