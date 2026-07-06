import { Tree, addProjectConfiguration, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { portAnalyzeGenerator } from './generator';

const TARGET = 'apps/demo/src/app/orders/orders-page.component.ts';

function seedWorkspace(): Tree {
  const tree = createTreeWithEmptyWorkspace();
  addProjectConfiguration(tree, 'demo', {
    root: 'apps/demo',
    sourceRoot: 'apps/demo/src',
    projectType: 'application',
  });
  tree.write(
    TARGET,
    `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { OrdersService } from './orders.service';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatTableModule],
  template: ` + '`' + `
    <app-shell>
      <form [formGroup]="filters"><input formControlName="query" /></form>
      <table mat-table [dataSource]="rows"><tr *ngFor="let row of rows">{{ row.status }}</tr></table>
      <canvas data-chart="orders"></canvas>
      <div class="error">{{ error }}</div>
    </app-shell>
  ` + '`' + `,
})
export class OrdersPageComponent {
  private readonly orders = inject(OrdersService);
  private readonly fb = inject(FormBuilder);
  readonly filters = this.fb.group({ query: [''] });
  readonly rows = this.orders.list();
  readonly error = '';
}
`,
  );
  tree.write(
    'apps/demo/src/app/orders/orders.service.ts',
    `import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  list() {
    return this.http.get('/api/orders');
  }
}
`,
  );
  tree.write(
    'apps/demo/src/app/app.routes.ts',
    `export const routes = [
  { path: 'orders', loadComponent: () => import('./orders/orders-page.component').then((m) => m.OrdersPageComponent) },
];
`,
  );
  return tree;
}

describe('port-analyze generator', () => {
  it('resolves a target path, infers m3kit libs, data seams, and route context', async () => {
    const tree = seedWorkspace();

    await portAnalyzeGenerator(tree, {
      target: TARGET,
      domain: 'orders',
      page: 'orders-list',
      outputDir: 'm3kit-porting/orders/orders-list',
    });

    const analysis = readJson(tree, 'm3kit-porting/orders/orders-list/analysis.json') as {
      projectName: string;
      sourceFiles: string[];
      inferredM3kitLibs: string[];
      dataAccessSeams: Array<{ file: string; status: string; reason: string }>;
      uiComponents: Array<{ kind: string; evidence: string }>;
      routeSnippets: string[];
      manualReviewItems: string[];
    };

    expect(analysis.projectName).toBe('demo');
    expect(analysis.sourceFiles).toContain(TARGET);
    expect(analysis.sourceFiles).toContain('apps/demo/src/app/orders/orders.service.ts');
    expect(analysis.inferredM3kitLibs).toEqual([
      'core',
      'theme',
      'shell',
      'forms',
      'table',
      'charts',
      'feedback',
      'state',
    ]);
    expect(analysis.dataAccessSeams).toEqual([
      expect.objectContaining({ file: 'apps/demo/src/app/orders/orders.service.ts', status: 'manual-review' }),
    ]);
    expect(analysis.uiComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'shell' }),
        expect.objectContaining({ kind: 'forms' }),
        expect.objectContaining({ kind: 'table' }),
        expect.objectContaining({ kind: 'charts' }),
        expect.objectContaining({ kind: 'feedback' }),
      ]),
    );
    expect(analysis.routeSnippets[0]).toContain("path: 'orders'");
    expect(analysis.manualReviewItems).toEqual(
      expect.arrayContaining([expect.stringContaining('OrdersService')]),
    );
  });

  it('writes the analysis packet and does not mutate source files', async () => {
    const tree = seedWorkspace();
    const beforeTarget = tree.read(TARGET, 'utf-8');
    const beforeRoutes = tree.read('apps/demo/src/app/app.routes.ts', 'utf-8');

    await portAnalyzeGenerator(tree, {
      target: TARGET,
      domain: 'orders',
      page: 'orders-list',
      outputDir: 'm3kit-porting/orders/orders-list',
    });

    for (const file of [
      'analysis.json',
      'porting-plan.md',
      'component-inventory.md',
      'data-access-map.md',
      'test-plan.md',
    ]) {
      expect(tree.exists(`m3kit-porting/orders/orders-list/${file}`)).toBe(true);
    }
    expect(tree.read(TARGET, 'utf-8')).toBe(beforeTarget);
    expect(tree.read('apps/demo/src/app/app.routes.ts', 'utf-8')).toBe(beforeRoutes);
  });

  it('fails with an actionable error and no output for an ambiguous target', async () => {
    const tree = seedWorkspace();

    await expect(
      portAnalyzeGenerator(tree, { target: 'orders-page.component.ts', domain: 'orders' }),
    ).rejects.toThrow(/Unable to resolve target/);
    expect(tree.exists('m3kit-porting/orders/orders-page/analysis.json')).toBe(false);
  });
});
