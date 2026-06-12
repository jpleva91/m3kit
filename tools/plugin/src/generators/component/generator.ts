import {
  Tree,
  formatFiles,
  joinPathFragments,
  names,
  readProjectConfiguration,
} from '@nx/devkit';

import type { ComponentGeneratorSchema } from './schema';

/**
 * Scaffolds a component that satisfies THE CONTRACT and THE COVERAGE BAR
 * (AGENTS.md): standalone, signal inputs, OnPush, `m3k-` selector,
 * token-only SCSS, plus `.spec.ts`, `.stories.ts`, and `.cy.ts` beside it,
 * exported from the lib barrel.
 */
export async function componentGenerator(
  tree: Tree,
  options: ComponentGeneratorSchema,
): Promise<void> {
  const project = readProjectConfiguration(tree, options.project);
  const sourceRoot = project.sourceRoot ?? joinPathFragments(project.root, 'src');
  const { fileName, className } = names(options.name);
  const dir = joinPathFragments(sourceRoot, 'lib');
  const base = joinPathFragments(dir, `${fileName}.component`);

  tree.write(`${base}.ts`, componentTs(fileName, className));
  tree.write(`${base}.html`, componentHtml(fileName));
  tree.write(`${base}.scss`, componentScss(fileName));
  tree.write(`${base}.spec.ts`, componentSpec(fileName, className));
  tree.write(`${base}.stories.ts`, componentStories(fileName, className));
  tree.write(`${base}.cy.ts`, componentCy(fileName, className));

  addBarrelExport(tree, joinPathFragments(sourceRoot, 'index.ts'), fileName);

  await formatFiles(tree);
}

/** Appends the component export to the lib barrel (idempotent). */
function addBarrelExport(tree: Tree, barrelPath: string, fileName: string): void {
  const exportLine = `export * from './lib/${fileName}.component';`;
  const current = tree.exists(barrelPath) ? (tree.read(barrelPath, 'utf-8') ?? '') : '';
  if (current.includes(exportLine)) {
    return;
  }
  const content = current.length > 0 && !current.endsWith('\n') ? `${current}\n` : current;
  tree.write(barrelPath, `${content}${exportLine}\n`);
}

function componentTs(fileName: string, className: string): string {
  return `import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * ${className} — scaffolded m3kit component. Standalone, signal inputs,
 * OnPush, token-only styling (\`--mat-sys-*\` + the \`--app-*\` contract).
 *
 * \`\`\`html
 * <m3k-${fileName} label="Label" description="Supporting text" />
 * \`\`\`
 */
@Component({
  selector: 'm3k-${fileName}',
  templateUrl: './${fileName}.component.html',
  styleUrl: './${fileName}.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${className}Component {
  /** Short label rendered as the component heading. */
  readonly label = input.required<string>();

  /** Optional supporting line beneath the label. */
  readonly description = input<string | null>(null);

  /** Whether the supporting line renders. */
  protected readonly hasDescription = computed(() => this.description() !== null);
}
`;
}

function componentHtml(fileName: string): string {
  return `<section class="m3k-${fileName}">
  <span class="m3k-${fileName}__label">{{ label() }}</span>
  @if (hasDescription()) {
    <p class="m3k-${fileName}__description">{{ description() }}</p>
  }
</section>
`;
}

function componentScss(fileName: string): string {
  return `// Token-only styling per THE CONTRACT: \`var(--mat-sys-*)\` system tokens
// and the closed \`--app-*\` contract (libs/theme/src/m3kit-theme/
// _contract.scss). No raw hex, no per-brand selectors.
.m3k-${fileName} {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--app-radius-card);
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);

  &__label {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--mat-sys-on-surface-variant);
  }

  &__description {
    margin: 0;
    font-size: 0.875rem;
    color: var(--mat-sys-on-surface-variant);
  }
}
`;
}

function componentSpec(fileName: string, className: string): string {
  return `import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ${className}Component } from './${fileName}.component';

describe('${className}Component', () => {
  let fixture: ComponentFixture<${className}Component>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [${className}Component],
    }).compileComponents();

    fixture = TestBed.createComponent(${className}Component);
    fixture.componentRef.setInput('label', 'Label');
    fixture.detectChanges();
  });

  it('renders the label', () => {
    expect(element().querySelector('.m3k-${fileName}__label')?.textContent?.trim()).toBe('Label');
  });

  it('hides the description until one is provided', () => {
    expect(element().querySelector('.m3k-${fileName}__description')).toBeNull();

    fixture.componentRef.setInput('description', 'Supporting text');
    fixture.detectChanges();

    expect(element().querySelector('.m3k-${fileName}__description')?.textContent?.trim()).toBe(
      'Supporting text',
    );
  });
});
`;
}

function componentStories(fileName: string, className: string): string {
  return `import type { Meta, StoryObj } from '@storybook/angular';

import { ${className}Component } from './${fileName}.component';

const meta: Meta<${className}Component> = {
  component: ${className}Component,
  title: 'Components/${className}',
};
export default meta;
type Story = StoryObj<${className}Component>;

export const Default: Story = {
  args: {
    label: 'Label',
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Label',
    description: 'Supporting text beneath the label.',
  },
};
`;
}

function componentCy(fileName: string, className: string): string {
  return `import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ${className}Component } from './${fileName}.component';

describe(${className}Component.name, () => {
  it('renders the label', () => {
    cy.mount(${className}Component, {
      componentProperties: { label: 'Label' },
      providers: [provideNoopAnimations()],
    });
    cy.get('.m3k-${fileName}__label').should('have.text', 'Label');
  });

  it('renders the description when provided', () => {
    cy.mount(${className}Component, {
      componentProperties: { label: 'Label', description: 'Supporting text' },
      providers: [provideNoopAnimations()],
    });
    cy.get('.m3k-${fileName}__description').should('have.text', 'Supporting text');
  });
});
`;
}

export default componentGenerator;
