import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FlatTreeControl, NestedTreeControl } from '@angular/cdk/tree';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
  MatTreeModule,
  MatTreeNestedDataSource,
} from '@angular/material/tree';

interface CategoryNode {
  readonly name: string;
  readonly children?: readonly CategoryNode[];
}

interface FlatCategoryNode {
  readonly expandable: boolean;
  readonly name: string;
  readonly level: number;
}

const PRODUCT_CATEGORIES: readonly CategoryNode[] = [
  {
    name: 'Subscriptions',
    children: [
      { name: 'Support retainer' },
      { name: 'Analytics add-on' },
      {
        name: 'Storage tiers',
        children: [{ name: '100 GB' }, { name: '1 TB' }, { name: 'Unlimited' }],
      },
    ],
  },
  {
    name: 'Services',
    children: [
      { name: 'Onboarding package' },
      { name: 'Data migration' },
      { name: 'Custom report build' },
    ],
  },
  {
    name: 'Hardware',
    children: [
      {
        name: 'Scanners',
        children: [{ name: 'Desk scanner S2' }, { name: 'Mobile scanner M1' }],
      },
      { name: 'Label printers' },
    ],
  },
];

/**
 * Parity gallery: raw Angular Material trees — a flat tree (FlatTreeControl +
 * MatTreeFlattener) and a nested tree (NestedTreeControl) over the same
 * synthetic product-category fixture.
 */
@Component({
  selector: 'parity-tree-demo',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTreeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="parity-row">
      <section>
        <h3>Flat tree</h3>
        <mat-tree [dataSource]="flatDataSource" [treeControl]="flatTreeControl">
          <mat-tree-node *matTreeNodeDef="let node" matTreeNodePadding>
            <button mat-icon-button disabled aria-hidden="true"></button>
            {{ node.name }}
          </mat-tree-node>
          <mat-tree-node
            *matTreeNodeDef="let node; when: hasChild"
            matTreeNodePadding
          >
            <button
              mat-icon-button
              matTreeNodeToggle
              [attr.aria-label]="'Toggle ' + node.name"
            >
              <mat-icon>
                {{ flatTreeControl.isExpanded(node) ? 'expand_more' : 'chevron_right' }}
              </mat-icon>
            </button>
            {{ node.name }}
          </mat-tree-node>
        </mat-tree>
      </section>

      <section>
        <h3>Nested tree</h3>
        <mat-tree [dataSource]="nestedDataSource" [treeControl]="nestedTreeControl">
          <mat-tree-node *matTreeNodeDef="let node" matTreeNodeToggle>
            <button mat-icon-button disabled aria-hidden="true"></button>
            {{ node.name }}
          </mat-tree-node>
          <mat-nested-tree-node *matTreeNodeDef="let node; when: hasNestedChild">
            <div class="mat-tree-node">
              <button
                mat-icon-button
                matTreeNodeToggle
                [attr.aria-label]="'Toggle ' + node.name"
              >
                <mat-icon>
                  {{ nestedTreeControl.isExpanded(node) ? 'expand_more' : 'chevron_right' }}
                </mat-icon>
              </button>
              {{ node.name }}
            </div>
            <div
              [class.parity-tree-collapsed]="!nestedTreeControl.isExpanded(node)"
              role="group"
            >
              <ng-container matTreeNodeOutlet></ng-container>
            </div>
          </mat-nested-tree-node>
        </mat-tree>
      </section>
    </div>
  `,
  styles: [
    `
      .parity-row {
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        align-items: flex-start;
        padding: 16px;
      }
      section {
        width: 340px;
        border-radius: var(--app-radius-card);
        background: var(--mat-sys-surface-container-low);
        padding: 8px 16px 16px;
      }
      h3 {
        margin: 8px 0;
        font: var(--mat-sys-title-small);
        color: var(--mat-sys-on-surface-variant);
      }
      .parity-tree-collapsed {
        display: none;
      }
      .mat-nested-tree-node div[role='group'] {
        padding-left: 40px;
      }
    `,
  ],
})
class ParityTreeDemoComponent {
  protected readonly flatTreeControl = new FlatTreeControl<FlatCategoryNode>(
    (node) => node.level,
    (node) => node.expandable
  );

  private readonly flatTreeFlattener = new MatTreeFlattener<
    CategoryNode,
    FlatCategoryNode
  >(
    (node, level) => ({
      expandable: (node.children?.length ?? 0) > 0,
      name: node.name,
      level,
    }),
    (node) => node.level,
    (node) => node.expandable,
    (node) => [...(node.children ?? [])]
  );

  protected readonly flatDataSource = new MatTreeFlatDataSource(
    this.flatTreeControl,
    this.flatTreeFlattener,
    [...PRODUCT_CATEGORIES]
  );

  protected readonly nestedTreeControl = new NestedTreeControl<CategoryNode>(
    (node) => [...(node.children ?? [])]
  );

  protected readonly nestedDataSource = new MatTreeNestedDataSource<CategoryNode>();

  constructor() {
    this.nestedDataSource.data = [...PRODUCT_CATEGORIES];
    this.flatTreeControl.expandAll();
    this.nestedTreeControl.dataNodes = [...PRODUCT_CATEGORIES];
    this.nestedTreeControl.expandAll();
  }

  protected readonly hasChild = (_: number, node: FlatCategoryNode): boolean =>
    node.expandable;

  protected readonly hasNestedChild = (_: number, node: CategoryNode): boolean =>
    (node.children?.length ?? 0) > 0;
}

const meta: Meta<ParityTreeDemoComponent> = {
  component: ParityTreeDemoComponent,
  title: 'Atoms/Tree',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<ParityTreeDemoComponent>;

export const FlatAndNested: Story = {};
