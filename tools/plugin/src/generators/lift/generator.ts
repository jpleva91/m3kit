import {
  Tree,
  formatFiles,
  getProjects,
  joinPathFragments,
  logger,
  updateJson,
  updateProjectConfiguration,
  writeJson,
} from '@nx/devkit';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { LiftGeneratorSchema } from './schema';

/**
 * Internal dependency closure of each liftable lib. Mirrors the boundary
 * table in AGENTS.md: table/dashboard/charts/forms/shell/testing sit on
 * core + theme; state sits on core; core and theme sit on nothing.
 */
const LIB_DEPS: Record<string, readonly string[]> = {
  core: [],
  theme: [],
  state: ['core'],
  table: ['core', 'theme'],
  testing: ['core', 'theme'],
  dashboard: ['core', 'theme'],
  charts: ['core', 'theme'],
  forms: ['core', 'theme'],
  shell: ['core', 'theme'],
};

/**
 * Targets that reference m3kit's demo app or single Storybook host
 * (`demo-reporting:build`, `libs/table/.storybook`); they cannot run in a
 * consumer workspace, so lift strips them and the consumer re-creates
 * their own equivalents.
 */
const DEMO_ONLY_TARGETS = [
  'storybook',
  'build-storybook',
  'test-storybook',
  'static-storybook',
  'component-test',
] as const;

/** File extensions treated as text and subject to `@m3kit/` alias rewrites. */
const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.html',
  '.scss',
  '.css',
  '.json',
  '.md',
  '.mdx',
  '.js',
  '.cjs',
  '.mjs',
  '.txt',
]);

/** Expands the requested libs to their full internal dependency closure. */
export function dependencyClosure(libs: readonly string[]): string[] {
  const seen = new Set<string>();
  const queue = [...libs];
  while (queue.length > 0) {
    const lib = queue.shift() as string;
    if (seen.has(lib)) {
      continue;
    }
    const deps = LIB_DEPS[lib];
    if (!deps) {
      throw new Error(
        `lift: unknown m3kit lib '${lib}'. Known libs: ${Object.keys(LIB_DEPS).join(', ')}.`,
      );
    }
    seen.add(lib);
    queue.push(...deps);
  }
  return Object.keys(LIB_DEPS).filter((lib) => seen.has(lib));
}

/**
 * Downloads the repo tarball (degit-style, no git required) and extracts
 * it into a temp dir. Returns the extracted workspace root.
 */
async function downloadWorkspaceSource(repo: string, ref: string): Promise<string> {
  const url = `https://codeload.github.com/${repo}/tar.gz/${ref}`;
  logger.info(`lift: downloading ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`lift: download failed (${response.status} ${response.statusText}): ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'm3kit-lift-'));
  const tarball = path.join(tmp, 'source.tar.gz');
  fs.writeFileSync(tarball, buffer);
  const extracted = path.join(tmp, 'repo');
  fs.mkdirSync(extracted);
  execFileSync('tar', ['-xzf', tarball, '-C', extracted, '--strip-components=1']);
  return extracted;
}

/** Recursively copies a disk dir into the tree, rewriting `@m3kit/` aliases. */
function copyDirIntoTree(tree: Tree, sourceDir: string, destPath: string, scope: string): void {
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourceEntry = path.join(sourceDir, entry.name);
    const destEntry = joinPathFragments(destPath, entry.name);
    if (entry.isDirectory()) {
      copyDirIntoTree(tree, sourceEntry, destEntry, scope);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const raw = fs.readFileSync(sourceEntry);
    if (scope !== 'm3kit' && TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      tree.write(destEntry, raw.toString('utf-8').replace(/@m3kit\//g, `@${scope}/`));
    } else {
      tree.write(destEntry, raw);
    }
  }
}

/** Renames the lifted project, remaps its tags, and strips demo-only targets. */
function rewireProjectJson(tree: Tree, lib: string, scope: string): void {
  const projectJsonPath = `libs/${lib}/project.json`;
  if (!tree.exists(projectJsonPath)) {
    return;
  }
  updateJson(tree, projectJsonPath, (project) => {
    if (typeof project.name === 'string') {
      project.name = project.name.replace(/^m3kit-/, `${scope}-`);
    }
    if (Array.isArray(project.tags)) {
      project.tags = project.tags.map((tag: string) => tag.replace(/^scope:m3kit-/, `scope:${scope}-`));
    }
    if (Array.isArray(project.implicitDependencies)) {
      project.implicitDependencies = project.implicitDependencies.map((dep: string) =>
        dep.replace(/^m3kit-/, `${scope}-`),
      );
    }
    if (project.targets) {
      for (const target of DEMO_ONLY_TARGETS) {
        delete project.targets[target];
      }
    }
    return project;
  });
}

/** Adds `@<scope>/<lib>` path aliases (theme stays SCSS-only, no alias). */
function ensureTsconfigPaths(tree: Tree, libs: readonly string[], scope: string): void {
  if (!tree.exists('tsconfig.base.json')) {
    writeJson(tree, 'tsconfig.base.json', { compilerOptions: { baseUrl: '.', paths: {} } });
  }
  updateJson(tree, 'tsconfig.base.json', (tsconfig) => {
    tsconfig.compilerOptions = tsconfig.compilerOptions ?? {};
    tsconfig.compilerOptions.paths = tsconfig.compilerOptions.paths ?? {};
    for (const lib of libs) {
      if (lib === 'theme') {
        continue;
      }
      tsconfig.compilerOptions.paths[`@${scope}/${lib}`] = [`libs/${lib}/src/index.ts`];
    }
    return tsconfig;
  });
}

/** Executors whose `build` options accept stylePreprocessorOptions. */
const ANGULAR_BUILD_EXECUTORS = new Set([
  '@angular-devkit/build-angular:application',
  '@angular-devkit/build-angular:browser',
  '@angular/build:application',
  '@nx/angular:application',
  '@nx/angular:browser-esbuild',
]);

/**
 * Attempts to wire `libs/theme/src` into the SCSS includePaths of every
 * detectable Angular application build target (project.json or
 * angular.json based). Returns the patched `project:target` names.
 */
function patchThemeIncludePaths(tree: Tree): string[] {
  const patched: string[] = [];
  for (const [name, project] of getProjects(tree)) {
    for (const [targetName, target] of Object.entries(project.targets ?? {})) {
      if (!ANGULAR_BUILD_EXECUTORS.has(target.executor ?? '')) {
        continue;
      }
      const options = (target.options = target.options ?? {});
      const preprocessor = (options.stylePreprocessorOptions =
        options.stylePreprocessorOptions ?? {});
      const includePaths: string[] = (preprocessor.includePaths = preprocessor.includePaths ?? []);
      if (!includePaths.includes('libs/theme/src')) {
        includePaths.push('libs/theme/src');
        updateProjectConfiguration(tree, name, project);
        patched.push(`${name}:${targetName}`);
      }
    }
  }
  return patched;
}

/** Prints the manual rewiring steps lift deliberately does not automate. */
function printGuidance(scope: string, libs: readonly string[], patchedTargets: readonly string[]): void {
  const scopes = libs
    .map((lib) => `'scope:${scope}-${lib}'`)
    .join(', ');
  logger.info(`
lift: manual follow-ups ────────────────────────────────────────────────

1. ESLint module boundaries (your eslint config is NOT rewritten — add
   depConstraints for the lifted scopes to @nx/enforce-module-boundaries
   in your flat config, then re-prove with a deliberate violation):

     // lifted m3kit libs — tags: ${scopes}
     // ${scope}-core/${scope}-theme depend on nothing; table/dashboard/charts/
     // forms/shell/testing -> [core, theme]; state -> [core].
     { sourceTag: 'scope:${scope}-table',
       onlyDependOnLibsWithTags: ['scope:${scope}-core', 'scope:${scope}-theme'] },
     // ...repeat per lifted lib.

2. Theme includePaths (so \`@use 'm3kit-theme'\` resolves): every Angular
   build/Storybook target that compiles component SCSS needs
     stylePreprocessorOptions.includePaths: ['libs/theme/src']
   ${
     patchedTargets.length > 0
       ? `Applied automatically to: ${patchedTargets.join(', ')}.`
       : 'No Angular application build target was detected — apply it by hand (angular.json or project.json).'
   }

3. Tests: the lifted libs use @nx/vite:test — make sure your vitest
   workspace globs include libs/** (see m3kit's vitest.workspace.ts).

4. Demo-only Storybook/Cypress targets were stripped from the lifted
   project.json files; re-create them against your own Storybook host.
`);
}

export async function liftGenerator(tree: Tree, options: LiftGeneratorSchema): Promise<void> {
  if (!options.libs || options.libs.length === 0) {
    throw new Error('lift: pass at least one lib, e.g. --libs=table');
  }
  const scope = options.scope ?? 'ui';
  const repo = options.repo ?? 'jpleva91/m3kit';
  const ref = options.ref ?? 'main';

  const libs = dependencyClosure(options.libs);
  // Idempotent re-runs: a lib already present in the workspace is left
  // untouched (its content may have diverged — it is owned now).
  const missing = libs.filter((lib) => !tree.exists(`libs/${lib}/project.json`));

  if (missing.length > 0) {
    const sourceRoot = options.sourceDir ?? (await downloadWorkspaceSource(repo, ref));
    for (const lib of missing) {
      const sourceLib = path.join(sourceRoot, 'libs', lib);
      if (!fs.existsSync(sourceLib)) {
        throw new Error(`lift: '${repo}@${ref}' has no libs/${lib} directory.`);
      }
      copyDirIntoTree(tree, sourceLib, `libs/${lib}`, scope);
      rewireProjectJson(tree, lib, scope);
      logger.info(`lift: copied libs/${lib} (project ${scope}-${lib})`);
    }
  } else {
    logger.info('lift: all requested libs already present — re-running rewiring only.');
  }

  ensureTsconfigPaths(tree, libs, scope);
  const patchedTargets = patchThemeIncludePaths(tree);
  printGuidance(scope, libs, patchedTargets);

  await formatFiles(tree);
}

export default liftGenerator;
