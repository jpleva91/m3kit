import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { TreeComponent, TreeNode } from './tree.component';

interface CategoryMeta {
  readonly reportCount: number;
}

const CATEGORIES: readonly TreeNode<CategoryMeta>[] = [
  {
    id: 'orders',
    label: 'Orders',
    icon: 'folder',
    data: { reportCount: 4 },
    children: [
      { id: 'orders-open', label: 'Open orders', icon: 'table_chart' },
      {
        id: 'orders-archive',
        label: 'Archive',
        icon: 'folder',
        children: [{ id: 'orders-2025', label: 'Orders 2025', icon: 'table_chart' }],
      },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: 'folder',
    children: [{ id: 'customers-active', label: 'Active customers', icon: 'table_chart' }],
  },
  { id: 'readme', label: 'Read me', icon: 'description' },
];

@Component({
  imports: [TreeComponent],
  template: `
    <m3k-tree
      [nodes]="nodes"
      [(expandedIds)]="expandedIds"
      [selectable]="selectable"
      [(selectedId)]="selectedId"
    />
  `,
})
class HostComponent {
  nodes = CATEGORIES;
  expandedIds: readonly string[] = [];
  selectable = false;
  selectedId: string | undefined = undefined;
}

describe('TreeComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const labels = (): string[] =>
    Array.from(element().querySelectorAll('.m3k-tree__label')).map(
      (label) => label.textContent?.trim() ?? '',
    );

  const nodeByLabel = (label: string): HTMLElement => {
    const node = Array.from(
      element().querySelectorAll<HTMLElement>('.m3k-tree__node'),
    ).find((candidate) =>
      candidate.querySelector('.m3k-tree__label')?.textContent?.includes(label),
    );
    if (!node) {
      throw new Error(`No rendered tree node labelled "${label}"`);
    }
    return node;
  };

  const toggleFor = (label: string): HTMLButtonElement =>
    element().querySelector(
      `button[aria-label="Toggle ${label}"]`,
    ) as HTMLButtonElement;

  // The expansion effect runs during the first pass and the tree then
  // stamps node views; a second pass settles their bindings.
  const detect = (): void => {
    fixture.detectChanges();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    detect();
  });

  it('renders root nodes and keeps collapsed children unrendered', () => {
    expect(labels()).toEqual(['Orders', 'Customers', 'Read me']);
    expect(labels()).not.toContain('Open orders');
  });

  it('expands nodes written into expandedIds by the parent, lazily per level', () => {
    host.expandedIds = ['orders'];
    detect();

    expect(labels()).toContain('Open orders');
    expect(labels()).toContain('Archive');
    // The grandchild stays unrendered until its own parent is expanded.
    expect(labels()).not.toContain('Orders 2025');

    host.expandedIds = ['orders', 'orders-archive'];
    detect();

    expect(labels()).toContain('Orders 2025');
  });

  it('collapses nodes removed from expandedIds by the parent', () => {
    host.expandedIds = ['orders'];
    detect();
    expect(labels()).toContain('Open orders');

    host.expandedIds = [];
    detect();
    expect(labels()).not.toContain('Open orders');
  });

  it('writes toggle clicks back into expandedIds (two-way)', () => {
    toggleFor('Orders').click();
    detect();

    expect(host.expandedIds).toContain('orders');
    expect(labels()).toContain('Open orders');

    toggleFor('Orders').click();
    detect();

    expect(host.expandedIds).not.toContain('orders');
    expect(labels()).not.toContain('Open orders');
  });

  it('selects a clicked node and writes selectedId (two-way)', () => {
    host.selectable = true;
    detect();

    nodeByLabel('Read me').click();
    detect();

    expect(host.selectedId).toBe('readme');
    const node = nodeByLabel('Read me');
    expect(node.classList).toContain('m3k-tree__node--selected');
    expect(node.getAttribute('aria-selected')).toBe('true');
  });

  it('styles the node named by a parent-written selectedId', () => {
    host.selectable = true;
    host.selectedId = 'customers';
    detect();

    expect(nodeByLabel('Customers').classList).toContain(
      'm3k-tree__node--selected',
    );
  });

  it('ignores clicks while not selectable', () => {
    nodeByLabel('Read me').click();
    detect();

    expect(host.selectedId).toBeUndefined();
    const node = nodeByLabel('Read me');
    expect(node.classList).not.toContain('m3k-tree__node--selected');
    expect(node.getAttribute('aria-selected')).toBeNull();
  });
});
