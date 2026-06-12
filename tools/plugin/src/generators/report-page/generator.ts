import {
  Tree,
  formatFiles,
  joinPathFragments,
  logger,
  names,
  readProjectConfiguration,
} from '@nx/devkit';

import { detectScope } from '../utils/detect-scope';
import type { ReportPageGeneratorSchema } from './schema';

/**
 * Scaffolds an app-side report page composing m3kit components —
 * `m3k-page-header` + `m3k-filter-form` + `m3k-data-table` — wired to a
 * `TableDefinition` and an `InMemoryTableDataSource` stub to replace
 * with a real datasource.
 */
export async function reportPageGenerator(
  tree: Tree,
  options: ReportPageGeneratorSchema,
): Promise<void> {
  const project = readProjectConfiguration(tree, options.project);
  const sourceRoot = project.sourceRoot ?? joinPathFragments(project.root, 'src');
  const { fileName, className, constantName } = names(options.name);
  const title = options.title ?? className.replace(/([a-z])([A-Z])/g, '$1 $2');
  const scope = options.scope ?? detectScope(tree);
  const dir = joinPathFragments(sourceRoot, 'app', fileName);

  tree.write(joinPathFragments(dir, `${fileName}-page.data.ts`), dataTs(className, constantName, fileName, title, scope));
  tree.write(joinPathFragments(dir, `${fileName}-page.component.ts`), componentTs(className, constantName, fileName, scope));
  tree.write(joinPathFragments(dir, `${fileName}-page.component.html`), componentHtml(fileName));
  tree.write(joinPathFragments(dir, `${fileName}-page.component.scss`), componentScss(fileName));
  tree.write(joinPathFragments(dir, `${fileName}-page.component.spec.ts`), componentSpec(className, fileName, title));

  logger.info(`report-page: add a route — { path: '${fileName}', loadComponent: () => import('./${fileName}/${fileName}-page.component').then((m) => m.${className}PageComponent) }`);

  await formatFiles(tree);
}

function dataTs(
  className: string,
  constantName: string,
  fileName: string,
  title: string,
  scope: string,
): string {
  return `import { InMemoryTableDataSource, TableDefinition } from '@${scope}/core';

/** Synthetic row shape for the ${title} report — replace with your domain row. */
export interface ${className}Row {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly amount: number;
  readonly updatedAt: string;
}

/** Declarative report definition driving the table and the filter form. */
export const ${constantName}_TABLE_DEFINITION: TableDefinition<${className}Row> = {
  id: '${fileName}',
  title: '${title}',
  description: 'Scaffolded report page — replace the stub rows with a real datasource.',
  columns: [
    { key: 'id', header: 'ID', type: 'text', sortable: true, width: '8rem' },
    { key: 'name', header: 'Name', type: 'text', sortable: true, filterable: true },
    { key: 'status', header: 'Status', type: 'badge', filterable: true },
    { key: 'amount', header: 'Amount', type: 'currency', sortable: true, align: 'end' },
    { key: 'updatedAt', header: 'Updated', type: 'date', sortable: true },
  ],
  defaultSort: { key: 'updatedAt', direction: 'desc' },
  defaultPageSize: 10,
};

/** Stub rows so the scaffold renders; swap for real data. */
const STUB_ROWS: readonly ${className}Row[] = [
  { id: 'ROW-001', name: 'First row', status: 'draft', amount: 1200, updatedAt: '2026-06-01' },
  { id: 'ROW-002', name: 'Second row', status: 'sent', amount: 860.5, updatedAt: '2026-06-05' },
  { id: 'ROW-003', name: 'Third row', status: 'paid', amount: 2400, updatedAt: '2026-06-09' },
];

/**
 * Datasource stub. Replace \`InMemoryTableDataSource\` with your own
 * \`TableDataSource<${className}Row>\` implementation (e.g. HTTP-backed)
 * once the page is wired to a backend.
 */
export function create${className}DataSource(): InMemoryTableDataSource<${className}Row> {
  return new InMemoryTableDataSource<${className}Row>(STUB_ROWS);
}
`;
}

function componentTs(className: string, constantName: string, fileName: string, scope: string): string {
  return `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FilterFormComponent, FilterFormValues } from '@${scope}/forms';
import { PageHeaderComponent } from '@${scope}/shell';
import { DataTableComponent } from '@${scope}/table';

import {
  ${constantName}_TABLE_DEFINITION,
  ${className}Row,
  create${className}DataSource,
} from './${fileName}-page.data';

/**
 * ${className} report page: m3k-page-header + m3k-filter-form +
 * m3k-data-table over a TableDefinition and a datasource stub.
 */
@Component({
  selector: 'app-${fileName}-page',
  imports: [PageHeaderComponent, FilterFormComponent, DataTableComponent],
  templateUrl: './${fileName}-page.component.html',
  styleUrl: './${fileName}-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${className}PageComponent {
  protected readonly definition = ${constantName}_TABLE_DEFINITION;

  protected readonly dataSource = create${className}DataSource();

  /** Debounced per-field filters from the filter form, fed to the table. */
  protected readonly fieldFilters = signal<FilterFormValues>({});

  /** Last row the user clicked. */
  protected readonly selectedRow = signal<${className}Row | null>(null);

  protected onFiltersChange(filters: FilterFormValues): void {
    this.fieldFilters.set(filters);
  }

  protected onRowClicked(row: ${className}Row): void {
    this.selectedRow.set(row);
  }
}
`;
}

function componentHtml(fileName: string): string {
  return `<section class="${fileName}-page">
  <m3k-page-header [title]="definition.title" [subtitle]="definition.description ?? ''" />

  <m3k-filter-form [definition]="definition" (filtersChange)="onFiltersChange($event)" />

  <m3k-data-table
    [definition]="definition"
    [dataSource]="dataSource"
    [fieldFilters]="fieldFilters()"
    (rowClicked)="onRowClicked($event)"
  />
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

  it('renders the page header with the report title', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('${title}');
  });

  it('renders the data table and the filter form', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('m3k-data-table')).not.toBeNull();
    expect(element.querySelector('m3k-filter-form')).not.toBeNull();
  });
});
`;
}

export default reportPageGenerator;
