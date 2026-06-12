import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MenuActionItem } from './overflow-menu-model';
import { OverflowMenuComponent } from './overflow-menu.component';

const INVOICE_ACTIONS: readonly MenuActionItem[] = [
  { id: 'view', label: 'View invoice', icon: 'visibility' },
  { id: 'duplicate', label: 'Duplicate as draft', icon: 'content_copy' },
  { id: 'record-payment', label: 'Record payment', icon: 'payments', disabled: true },
  { id: 'void', label: 'Void invoice', icon: 'block', destructive: true, divider: true },
];

@Component({
  imports: [OverflowMenuComponent],
  template: `
    <m3k-overflow-menu
      [items]="items"
      [icon]="icon"
      [ariaLabel]="ariaLabel"
      [disabled]="disabled"
      (action)="onAction($event)"
    />
  `,
})
class HostComponent {
  items: readonly MenuActionItem[] = INVOICE_ACTIONS;
  icon = 'more_vert';
  ariaLabel = 'More actions';
  disabled = false;
  readonly emitted: string[] = [];

  onAction(id: string): void {
    this.emitted.push(id);
  }
}

describe('OverflowMenuComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const trigger = (): HTMLButtonElement => {
    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button.m3k-overflow-menu__trigger',
    );
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('trigger button not rendered');
    }
    return button;
  };

  const overlay = (): HTMLElement =>
    TestBed.inject(OverlayContainer).getContainerElement();

  const openMenu = (): void => {
    trigger().click();
    fixture.detectChanges();
  };

  const menuItems = (): HTMLButtonElement[] =>
    Array.from(overlay().querySelectorAll('button.m3k-overflow-menu__item'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders an icon-button trigger with the default icon and aria-label', () => {
    expect(trigger().getAttribute('aria-label')).toBe('More actions');
    expect(trigger().querySelector('mat-icon')?.textContent?.trim()).toBe('more_vert');
  });

  it('reflects custom icon and ariaLabel inputs on the trigger', () => {
    host.icon = 'settings';
    host.ariaLabel = 'Invoice INV-2026-0042 actions';
    fixture.detectChanges();

    expect(trigger().getAttribute('aria-label')).toBe('Invoice INV-2026-0042 actions');
    expect(trigger().querySelector('mat-icon')?.textContent?.trim()).toBe('settings');
  });

  it('opens a menu rendering every item with its label and icon', () => {
    openMenu();

    const items = menuItems();
    expect(items).toHaveLength(4);
    expect(
      items.map((item) => item.querySelector('span')?.textContent?.trim()),
    ).toEqual(['View invoice', 'Duplicate as draft', 'Record payment', 'Void invoice']);
    expect(items[0].querySelector('mat-icon')?.textContent?.trim()).toBe('visibility');
  });

  it('renders a divider before an item flagged with divider', () => {
    openMenu();

    const dividers = overlay().querySelectorAll('mat-divider');
    expect(dividers).toHaveLength(1);
    expect(dividers[0].nextElementSibling?.textContent).toContain('Void invoice');
  });

  it('emits the selected item id through action and only once', () => {
    openMenu();

    menuItems()[0].click();
    fixture.detectChanges();

    expect(host.emitted).toEqual(['view']);
  });

  it('renders disabled items as disabled and never emits for them', () => {
    openMenu();

    const disabledItem = menuItems()[2];
    expect(disabledItem.disabled).toBe(true);

    disabledItem.click();
    fixture.detectChanges();

    expect(host.emitted).toEqual([]);
  });

  it('marks destructive items with the destructive class', () => {
    openMenu();

    const items = menuItems();
    expect(
      items.map((item) =>
        item.classList.contains('m3k-overflow-menu__item--destructive'),
      ),
    ).toEqual([false, false, false, true]);
  });

  it('disables the trigger when disabled is set', () => {
    host.disabled = true;
    fixture.detectChanges();

    expect(trigger().disabled).toBe(true);
  });
});
