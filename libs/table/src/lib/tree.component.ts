import {
  ChangeDetectionStrategy,
  Component,
  afterRenderEffect,
  computed,
  input,
  model,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTree, MatTreeModule } from '@angular/material/tree';

/**
 * One node in an `m3k-tree` hierarchy. Ids must be unique across the whole
 * tree: they key expansion state, selection, and node identity tracking.
 */
export interface TreeNode<T = unknown> {
  id: string;
  label: string;
  /** Optional leading Material Symbols icon (e.g. `folder`). */
  icon?: string;
  children?: readonly TreeNode<T>[];
  /** Arbitrary consumer payload carried alongside the node. */
  data?: T;
}

/**
 * Typed tree over hierarchical {@link TreeNode} data — a thin wrapper around
 * Material's `childrenAccessor`-based `mat-tree`, which renders lazily:
 * children mount only while their parent is expanded, at any depth.
 *
 * Expansion is id-based and two-way (`[(expandedIds)]`): parent writes
 * expand/collapse the tree, and user toggles (chevron click or arrow keys)
 * write back. Collapsing a parent keeps its descendants' ids in the model,
 * so re-expanding restores the previous shape.
 *
 * Selection is opt-in (`selectable`) and likewise two-way
 * (`[(selectedId)]`): clicking or activating a row (Enter/Space) selects
 * it. While `selectable` is unbound the tree is presentation-only and
 * row clicks are inert.
 *
 * Keyboard navigation (arrow keys, typeahead, Home/End) comes from the CDK
 * tree's key manager; the toggle buttons and `aria-expanded`/`aria-level`
 * attributes are wired through the CDK as well.
 */
@Component({
  selector: 'm3k-tree',
  imports: [MatButtonModule, MatIconModule, MatTreeModule],
  templateUrl: './tree.component.html',
  styleUrl: './tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeComponent<T = unknown> {
  /** Root nodes of the hierarchy, in render order. */
  readonly nodes = input.required<readonly TreeNode<T>[]>();

  /**
   * Two-way set of expanded node ids. User toggles update the model;
   * parent writes are applied to the tree and not re-emitted
   * (`model()` semantics, as in `m3k-tabs-page`'s `activeTabId`).
   */
  readonly expandedIds = model<readonly string[]>([]);

  /** Whether rows are selectable; when `false`, clicks are inert. */
  readonly selectable = input<boolean>(false);

  /** Two-way id of the selected node; only written while `selectable`. */
  readonly selectedId = model<string | undefined>(undefined);

  private readonly tree = viewChild<MatTree<TreeNode<T>, string>>(MatTree);

  /** Mutable copy for `mat-tree`'s `dataSource`, which wants `T[]`. */
  protected readonly roots = computed(() => [...this.nodes()]);

  /** Every node in the hierarchy, depth-first, for applying expansion. */
  private readonly flatNodes = computed(() => flattenNodes(this.nodes()));

  protected readonly childrenAccessor = (node: TreeNode<T>): TreeNode<T>[] => [
    ...(node.children ?? []),
  ];

  /** Expansion state is keyed by id, not object identity. */
  protected readonly expansionKey = (node: TreeNode<T>): string => node.id;

  protected readonly trackBy = (_: number, node: TreeNode<T>): string => node.id;

  constructor() {
    // Apply the expandedIds model to the tree's expansion state. User
    // toggles round-trip through here too: the expansion change writes the
    // model (onExpandedChange), the effect re-runs, and every expand/
    // collapse below is a no-op because the tree already matches.
    //
    // This must be an *after-render* effect: CdkTree creates its internal
    // expansion model lazily while subscribing to data changes
    // (ngAfterContentChecked), and expand()/collapse() silently no-op
    // before that. A plain effect() can flush first and drop a
    // parent-preset expandedIds on mount.
    afterRenderEffect(() => {
      const tree = this.tree();
      if (!tree) {
        return;
      }
      const expanded = new Set(this.expandedIds());
      for (const node of this.flatNodes()) {
        if (expanded.has(node.id)) {
          tree.expand(node);
        } else {
          tree.collapse(node);
        }
      }
    });
  }

  protected hasChildren(node: TreeNode<T>): boolean {
    return (node.children?.length ?? 0) > 0;
  }

  protected isExpanded(node: TreeNode<T>): boolean {
    return this.expandedIds().includes(node.id);
  }

  protected isSelected(node: TreeNode<T>): boolean {
    return this.selectable() && this.selectedId() === node.id;
  }

  /**
   * Writes the tree's expansion change back to the model. Membership is
   * checked first so the echo of a parent-initiated write (the effect
   * expanding a node this model already lists) never re-emits.
   */
  protected onExpandedChange(node: TreeNode<T>, expanded: boolean): void {
    const ids = this.expandedIds();
    const has = ids.includes(node.id);
    if (expanded && !has) {
      this.expandedIds.set([...ids, node.id]);
    } else if (!expanded && has) {
      this.expandedIds.set(ids.filter((id) => id !== node.id));
    }
  }

  /** Row click / keyboard activation; inert unless `selectable`. */
  protected select(node: TreeNode<T>): void {
    if (!this.selectable()) {
      return;
    }
    this.selectedId.set(node.id);
  }
}

function flattenNodes<T>(nodes: readonly TreeNode<T>[]): readonly TreeNode<T>[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children ?? [])]);
}
