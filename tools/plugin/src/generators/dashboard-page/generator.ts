import {
  Tree,
  formatFiles,
  joinPathFragments,
  logger,
  names,
  readProjectConfiguration,
} from '@nx/devkit';

import { detectScope } from '../utils/detect-scope';
import type { DashboardPageGeneratorSchema } from './schema';

/**
 * Scaffolds an app-side dashboard page composing m3kit components —
 * `m3k-page-header` + `m3k-dashboard-grid` with `m3k-kpi-card`s and
 * `m3k-chart-card`s (line + bar) — wired to KPI / chart series stubs.
 */
export async function dashboardPageGenerator(
  tree: Tree,
  options: DashboardPageGeneratorSchema,
): Promise<void> {
  const project = readProjectConfiguration(tree, options.project);
  const sourceRoot = project.sourceRoot ?? joinPathFragments(project.root, 'src');
  const { fileName, className, constantName } = names(options.name);
  const title = options.title ?? className.replace(/([a-z])([A-Z])/g, '$1 $2');
  const scope = options.scope ?? detectScope(tree);
  const dir = joinPathFragments(sourceRoot, 'app', fileName);

  tree.write(joinPathFragments(dir, `${fileName}-page.data.ts`), dataTs(className, constantName, scope));
  tree.write(joinPathFragments(dir, `${fileName}-page.component.ts`), componentTs(className, constantName, fileName, title, scope));
  tree.write(joinPathFragments(dir, `${fileName}-page.component.html`), componentHtml(fileName));
  tree.write(joinPathFragments(dir, `${fileName}-page.component.scss`), componentScss(fileName));
  tree.write(joinPathFragments(dir, `${fileName}-page.component.spec.ts`), componentSpec(className, fileName, title));

  logger.info(`dashboard-page: add a route — { path: '${fileName}', loadComponent: () => import('./${fileName}/${fileName}-page.component').then((m) => m.${className}PageComponent) }`);

  await formatFiles(tree);
}

function dataTs(className: string, constantName: string, scope: string): string {
  return `import { BarChartSeries, LineChartSeries } from '@${scope}/charts';
import { KpiValueFormat } from '@${scope}/dashboard';

/** One KPI tile on the ${className} dashboard. */
export interface ${className}Kpi {
  readonly label: string;
  readonly value: number;
  readonly format: KpiValueFormat;
  readonly delta: number | null;
  readonly icon: string | null;
}

/** Stub KPIs so the scaffold renders; replace with real metrics. */
export const ${constantName}_KPIS: readonly ${className}Kpi[] = [
  { label: 'Total revenue', value: 384200, format: 'currency', delta: 12, icon: 'payments' },
  { label: 'Open items', value: 38, format: 'number', delta: 6, icon: 'inbox' },
  { label: 'Overdue', value: 12, format: 'number', delta: -3, icon: 'schedule' },
  { label: 'Collection rate', value: 0.92, format: 'percent', delta: 1.5, icon: 'trending_up' },
];

/** Stub trend series; replace with a real query result. */
export const ${constantName}_TREND_SERIES: readonly LineChartSeries[] = [
  {
    name: 'Revenue',
    points: [
      { x: 'Jan', y: 4200 },
      { x: 'Feb', y: 5100 },
      { x: 'Mar', y: 4800 },
      { x: 'Apr', y: 6200 },
      { x: 'May', y: 5900 },
      { x: 'Jun', y: 7400 },
    ],
  },
];

/** Stub breakdown categories + series; replace with a real query result. */
export const ${constantName}_BREAKDOWN_CATEGORIES: readonly string[] = ['Q1', 'Q2', 'Q3', 'Q4'];

export const ${constantName}_BREAKDOWN_SERIES: readonly BarChartSeries[] = [
  { name: 'Paid', values: [42, 51, 48, 62] },
  { name: 'Sent', values: [18, 22, 19, 24] },
];
`;
}

function componentTs(
  className: string,
  constantName: string,
  fileName: string,
  title: string,
  scope: string,
): string {
  return `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BarChartComponent, ChartCardComponent, LineChartComponent } from '@${scope}/charts';
import { DashboardGridComponent, GridSpanDirective, KpiCardComponent } from '@${scope}/dashboard';
import { PageHeaderComponent } from '@${scope}/shell';

import {
  ${constantName}_BREAKDOWN_CATEGORIES,
  ${constantName}_BREAKDOWN_SERIES,
  ${constantName}_KPIS,
  ${constantName}_TREND_SERIES,
} from './${fileName}-page.data';

/**
 * ${className} dashboard page: m3k-page-header + m3k-dashboard-grid of
 * KPI cards and chart cards over stubbed series data.
 */
@Component({
  selector: 'app-${fileName}-page',
  imports: [
    PageHeaderComponent,
    DashboardGridComponent,
    GridSpanDirective,
    KpiCardComponent,
    ChartCardComponent,
    LineChartComponent,
    BarChartComponent,
  ],
  templateUrl: './${fileName}-page.component.html',
  styleUrl: './${fileName}-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${className}PageComponent {
  protected readonly title = '${title}';

  protected readonly kpis = ${constantName}_KPIS;

  protected readonly trendSeries = ${constantName}_TREND_SERIES;

  protected readonly breakdownCategories = ${constantName}_BREAKDOWN_CATEGORIES;

  protected readonly breakdownSeries = ${constantName}_BREAKDOWN_SERIES;
}
`;
}

function componentHtml(fileName: string): string {
  return `<section class="${fileName}-page">
  <m3k-page-header [title]="title" />

  <m3k-dashboard-grid>
    @for (kpi of kpis; track kpi.label) {
      <m3k-kpi-card
        [label]="kpi.label"
        [value]="kpi.value"
        [format]="kpi.format"
        [delta]="kpi.delta"
        [icon]="kpi.icon"
      />
    }

    <m3k-chart-card title="Trend" subtitle="Stub series" m3kGridSpan="full">
      <m3k-line-chart [series]="trendSeries" ariaLabel="Trend over time" />
    </m3k-chart-card>

    <m3k-chart-card title="Breakdown" subtitle="Stub series" m3kGridSpan="full">
      <m3k-bar-chart
        [categories]="breakdownCategories"
        [series]="breakdownSeries"
        ariaLabel="Breakdown by category"
      />
    </m3k-chart-card>
  </m3k-dashboard-grid>
</section>
`;
}

function componentScss(fileName: string): string {
  return `// Token-only styling: layout owns spacing; colors come from the theme.
.${fileName}-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
`;
}

function componentSpec(className: string, fileName: string, title: string): string {
  return `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ${className}PageComponent } from './${fileName}-page.component';

describe('${className}PageComponent', () => {
  let fixture: ComponentFixture<${className}PageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [${className}PageComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(${className}PageComponent);
    fixture.detectChanges();
  });

  it('renders the page header with the dashboard title', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('${title}');
  });

  it('renders one KPI card per stub metric plus the two chart cards', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('m3k-kpi-card').length).toBe(4);
    expect(element.querySelectorAll('m3k-chart-card').length).toBe(2);
  });
});
`;
}

export default dashboardPageGenerator;
