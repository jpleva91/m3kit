import { Tree, readJson } from '@nx/devkit';

/**
 * Detects the workspace's m3kit alias prefix from tsconfig.base.json
 * (the path pointing at `libs/core/src/index.ts`, e.g. `@ui/core` after
 * a lift, `@m3kit/core` inside m3kit). Falls back to `m3kit`.
 */
export function detectScope(tree: Tree): string {
  if (!tree.exists('tsconfig.base.json')) {
    return 'm3kit';
  }
  const tsconfig = readJson(tree, 'tsconfig.base.json');
  const paths: Record<string, string[]> = tsconfig?.compilerOptions?.paths ?? {};
  for (const [alias, targets] of Object.entries(paths)) {
    const match = alias.match(/^@(.+)\/core$/);
    if (match && targets.some((target) => target.includes('libs/core/src/index.ts'))) {
      return match[1];
    }
  }
  return 'm3kit';
}
