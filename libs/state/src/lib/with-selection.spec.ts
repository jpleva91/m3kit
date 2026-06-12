import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';

import { withSelection } from './with-selection';

interface Order {
  id: string;
  total: number;
}

const orderA: Order = { id: 'a', total: 10 };
const orderB: Order = { id: 'b', total: 20 };
const orderC: Order = { id: 'c', total: 30 };

const OrderStore = signalStore(
  { providedIn: 'root' },
  withSelection<Order>((order) => order.id)
);

function createStore(): InstanceType<typeof OrderStore> {
  TestBed.configureTestingModule({});
  return TestBed.inject(OrderStore);
}

describe('withSelection', () => {
  it('starts empty', () => {
    const store = createStore();
    expect(store.selectedIds().size).toBe(0);
    expect(store.selectedCount()).toBe(0);
    expect(store.hasSelection()).toBe(false);
    expect(store.isSelected()(orderA)).toBe(false);
  });

  it('toggle() selects an unselected row and deselects a selected one', () => {
    const store = createStore();

    store.toggle(orderA);
    expect(store.isSelected()(orderA)).toBe(true);
    expect(store.selectedCount()).toBe(1);
    expect(store.hasSelection()).toBe(true);

    store.toggle(orderA);
    expect(store.isSelected()(orderA)).toBe(false);
    expect(store.selectedCount()).toBe(0);
    expect(store.hasSelection()).toBe(false);
  });

  it('select() accepts a single row or an array, idempotently', () => {
    const store = createStore();

    store.select(orderA);
    store.select([orderA, orderB, orderC]);

    expect(store.selectedCount()).toBe(3);
    expect(store.isSelected()(orderB)).toBe(true);

    store.select(orderB);
    expect(store.selectedCount()).toBe(3);
  });

  it('deselect() removes a single row or an array, ignoring unselected rows', () => {
    const store = createStore();
    store.select([orderA, orderB, orderC]);

    store.deselect(orderB);
    expect(store.isSelected()(orderB)).toBe(false);
    expect(store.selectedCount()).toBe(2);

    store.deselect([orderA, orderC, orderB]);
    expect(store.selectedCount()).toBe(0);
  });

  it('clear() empties the selection', () => {
    const store = createStore();
    store.select([orderA, orderB]);

    store.clear();

    expect(store.selectedCount()).toBe(0);
    expect(store.hasSelection()).toBe(false);
  });

  it('matches by identity, so selection survives row re-instantiation', () => {
    const store = createStore();
    store.select(orderA);

    const refetchedA: Order = { id: 'a', total: 999 };
    expect(store.isSelected()(refetchedA)).toBe(true);
  });

  it('replaces the set immutably on every mutation', () => {
    const store = createStore();
    const before = store.selectedIds();

    store.select(orderA);

    expect(store.selectedIds()).not.toBe(before);
    expect(before.size).toBe(0);
  });
});
