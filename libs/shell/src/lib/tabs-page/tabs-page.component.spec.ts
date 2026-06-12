import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { TabsPageComponent, TabsPagePanelDirective, TabsPageTab } from './tabs-page.component';

const TABS: readonly TabsPageTab[] = [
  { id: 'overview', label: 'Overview', icon: 'receipt_long' },
  { id: 'line-items', label: 'Line items' },
  { id: 'activity', label: 'Activity', badge: 3 },
];

@Component({
  imports: [TabsPageComponent, TabsPagePanelDirective],
  template: `
    <m3k-tabs-page
      [tabs]="tabs"
      [activeTabId]="activeTabId"
      (activeTabIdChange)="onActiveTabIdChange($event)"
    >
      <ng-template m3kTabPanel="overview" let-tab>
        <p class="probe-overview">{{ tab.label }}: INV-2041 · Acme Manufacturing · USD 12,480.00</p>
      </ng-template>
      <ng-template m3kTabPanel="line-items">
        <p class="probe-line-items">14 line items</p>
      </ng-template>
      <ng-template m3kTabPanel="activity" let-tab>
        <p class="probe-activity">{{ tab.badge }} new events</p>
      </ng-template>
    </m3k-tabs-page>
  `,
})
class HostComponent {
  tabs: readonly TabsPageTab[] = TABS;
  activeTabId: string | undefined = undefined;
  emitted: (string | undefined)[] = [];

  /** Manual two-way: records the emission, then writes back like `[(activeTabId)]`. */
  onActiveTabIdChange(id: string | undefined): void {
    this.emitted.push(id);
    this.activeTabId = id;
  }
}

/** Event-only usage: listens to `activeTabIdChange` without binding `activeTabId`. */
@Component({
  imports: [TabsPageComponent, TabsPagePanelDirective],
  template: `
    <m3k-tabs-page [tabs]="tabs" (activeTabIdChange)="emitted.push($event)">
      <ng-template m3kTabPanel="overview">
        <p class="probe-overview">INV-2041</p>
      </ng-template>
      <ng-template m3kTabPanel="line-items">
        <p class="probe-line-items">14 line items</p>
      </ng-template>
      <ng-template m3kTabPanel="activity">
        <p class="probe-activity">3 new events</p>
      </ng-template>
    </m3k-tabs-page>
  `,
})
class EventOnlyHostComponent {
  tabs: readonly TabsPageTab[] = TABS;
  emitted: (string | undefined)[] = [];
}

describe('TabsPageComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const tabHeaders = (): HTMLElement[] =>
    Array.from(element().querySelectorAll<HTMLElement>('[role="tab"]'));

  /** Run change detection and let the lazy tab body attach its portal. */
  const settle = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, EventOnlyHostComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  it('renders one Material tab per entry, in order, with labels and icons', async () => {
    await settle();

    const headers = tabHeaders();
    expect(headers).toHaveLength(3);
    expect(headers.map((h) => h.textContent?.trim())).toEqual([
      'receipt_longOverview',
      'Line items',
      'Activity3',
    ]);
    expect(headers[0].querySelector('mat-icon')?.textContent?.trim()).toBe(
      'receipt_long',
    );
  });

  it('selects the first tab and stamps its projected panel when activeTabId is unbound', async () => {
    await settle();

    expect(tabHeaders()[0].getAttribute('aria-selected')).toBe('true');
    expect(element().querySelector('.probe-overview')?.textContent).toContain(
      'INV-2041',
    );
    // Lazy panels: inactive tab content is not instantiated.
    expect(element().querySelector('.probe-line-items')).toBeNull();
  });

  it('provides the tab definition as the implicit template context (let-tab)', async () => {
    await settle();

    // `let-tab` resolves to the TabsPageTab whose id keys the panel.
    expect(
      element().querySelector('.probe-overview')?.textContent?.trim(),
    ).toBe('Overview: INV-2041 · Acme Manufacturing · USD 12,480.00');

    host.activeTabId = 'activity';
    await settle();

    expect(
      element().querySelector('.probe-activity')?.textContent?.trim(),
    ).toBe('3 new events');
  });

  it('syncs selection in from activeTabId and renders the matching panel', async () => {
    host.activeTabId = 'line-items';
    await settle();

    expect(tabHeaders()[1].getAttribute('aria-selected')).toBe('true');
    expect(
      element().querySelector('.probe-line-items')?.textContent?.trim(),
    ).toBe('14 line items');

    host.activeTabId = 'activity';
    await settle();

    expect(tabHeaders()[2].getAttribute('aria-selected')).toBe('true');
    expect(element().querySelector('.probe-activity')).not.toBeNull();
    // Parent writes are not re-emitted (model() semantics).
    expect(host.emitted).toEqual([]);
  });

  it('falls back to the first tab for an unknown activeTabId', async () => {
    host.activeTabId = 'missing';
    await settle();

    expect(tabHeaders()[0].getAttribute('aria-selected')).toBe('true');
    expect(element().querySelector('.probe-overview')).not.toBeNull();
  });

  it('emits the clicked tab id and syncs the binding back (two-way out)', async () => {
    await settle();

    tabHeaders()[2].click();
    await settle();

    expect(host.emitted).toEqual(['activity']);
    expect(host.activeTabId).toBe('activity');
    expect(tabHeaders()[2].getAttribute('aria-selected')).toBe('true');
    expect(element().querySelector('.probe-activity')).not.toBeNull();
  });

  it('renders a badge on the tab label via MatBadge', async () => {
    await settle();

    const badge = tabHeaders()[2].querySelector('.mat-badge-content');
    expect(badge?.textContent?.trim()).toBe('3');
    expect(tabHeaders()[0].querySelector('.mat-badge-content')).toBeNull();
  });

  it('renders an empty panel body for a tab without a projected template', async () => {
    host.tabs = [{ id: 'notes', label: 'Notes' }];
    await settle();

    expect(tabHeaders()).toHaveLength(1);
    expect(
      element().querySelector('.m3k-tabs-page__panel')?.children,
    ).toHaveLength(0);
  });

  describe('event-only usage (no [activeTabId] binding)', () => {
    let eventFixture: ComponentFixture<EventOnlyHostComponent>;
    let eventHost: EventOnlyHostComponent;

    const eventElement = (): HTMLElement =>
      eventFixture.nativeElement as HTMLElement;
    const eventTabHeaders = (): HTMLElement[] =>
      Array.from(eventElement().querySelectorAll<HTMLElement>('[role="tab"]'));

    const settleEvent = async (): Promise<void> => {
      eventFixture.detectChanges();
      await eventFixture.whenStable();
      eventFixture.detectChanges();
    };

    beforeEach(() => {
      eventFixture = TestBed.createComponent(EventOnlyHostComponent);
      eventHost = eventFixture.componentInstance;
    });

    it('defaults to the first tab when unbound', async () => {
      await settleEvent();

      expect(eventTabHeaders()[0].getAttribute('aria-selected')).toBe('true');
      expect(eventElement().querySelector('.probe-overview')).not.toBeNull();
      expect(eventHost.emitted).toEqual([]);
    });

    it('reliably emits every user selection, including back to the first tab', async () => {
      await settleEvent();

      eventTabHeaders()[2].click();
      await settleEvent();

      expect(eventHost.emitted).toEqual(['activity']);
      expect(eventElement().querySelector('.probe-activity')).not.toBeNull();

      // Selecting the first tab again must also emit (the old hand-rolled
      // echo guard swallowed this in event-only usage).
      eventTabHeaders()[0].click();
      await settleEvent();

      expect(eventHost.emitted).toEqual(['activity', 'overview']);
      expect(eventTabHeaders()[0].getAttribute('aria-selected')).toBe('true');
      expect(eventElement().querySelector('.probe-overview')).not.toBeNull();
    });
  });
});
