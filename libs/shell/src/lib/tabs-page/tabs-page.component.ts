import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  computed,
  contentChildren,
  inject,
  input,
  model,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

/**
 * One tab in `m3k-tabs-page`: a stable id (panel-matching key and the value
 * carried by `activeTabIdChange`), a visible label, an optional leading
 * Material Symbols icon, and an optional count/text badge on the label.
 */
export interface TabsPageTab {
  id: string;
  label: string;
  icon?: string;
  badge?: number | string;
}

/**
 * Marks an `ng-template` projected into `m3k-tabs-page` as the panel for one
 * tab; the attribute value is the matching `TabsPageTab.id`. Same
 * template-slot mechanism as the shell's `m3kShellToolbarActions` /
 * `m3kShellRailFooter` directives, keyed by id because the tab set is
 * data-driven. The tab definition is exposed as the template's implicit
 * context.
 *
 * ```html
 * <m3k-tabs-page [tabs]="tabs">
 *   <ng-template m3kTabPanel="overview" let-tab>{{ tab.label }}…</ng-template>
 * </m3k-tabs-page>
 * ```
 */
@Directive({
  selector: 'ng-template[m3kTabPanel]',
})
export class TabsPagePanelDirective {
  /** Id of the tab this template renders the panel for. */
  readonly tabId = input.required<string>({ alias: 'm3kTabPanel' });

  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * Page-level tabbed template: wraps a Material tab group in the kit's page
 * chrome so report and detail pages get consistent tab navigation from a
 * data-driven tab model. Panels are projected as `ng-template[m3kTabPanel]`
 * slots matched by tab id and stamped lazily (`matTabContent`) — a panel
 * instantiates on first activation. Keyboard interaction (arrow keys,
 * Home/End, focus management) comes from the Material tab header.
 *
 * Selection is id-based and supports two-way binding:
 *
 * ```html
 * <m3k-tabs-page [tabs]="tabs" [(activeTabId)]="active">
 *   <ng-template m3kTabPanel="overview">Invoice summary…</ng-template>
 *   <ng-template m3kTabPanel="activity">Event feed…</ng-template>
 * </m3k-tabs-page>
 * ```
 */
@Component({
  selector: 'm3k-tabs-page',
  imports: [NgTemplateOutlet, MatBadgeModule, MatIconModule, MatTabsModule],
  templateUrl: './tabs-page.component.html',
  styleUrl: './tabs-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsPageComponent {
  /** Tabs to render, in order. Ids must be unique within the page. */
  readonly tabs = input.required<readonly TabsPageTab[]>();

  /**
   * Two-way id of the selected tab; unknown or absent ids select the first
   * tab. Emits on tab selection inside the component (header clicks);
   * parent writes are not re-emitted (`model()` semantics, same mechanism
   * as `m3k-stepper-flow`'s `activeStepIndex`).
   */
  readonly activeTabId = model<string | undefined>(undefined);

  /** Projected panel templates, matched to tabs by id. */
  private readonly panels = contentChildren(TabsPagePanelDirective);

  /** Active id with the unbound default resolved to the first tab's id. */
  private readonly effectiveActiveTabId = computed(
    () => this.activeTabId() ?? this.tabs()[0]?.id,
  );

  /** Material tab-group index for the active id (first tab fallback). */
  protected readonly selectedIndex = computed(() => {
    const index = this.tabs().findIndex(
      (tab) => tab.id === this.effectiveActiveTabId(),
    );
    return index === -1 ? 0 : index;
  });

  private readonly panelsById = computed(
    () =>
      new Map(
        this.panels().map((panel) => [panel.tabId(), panel.templateRef]),
      ),
  );

  protected panelTemplate(id: string): TemplateRef<unknown> | null {
    return this.panelsById().get(id) ?? null;
  }

  /**
   * Writes Material's index change back to the model as an id. The echo
   * Material fires after `activeTabId` itself moved the selection sets the
   * value it already holds, which `model()` drops by signal equality — so
   * only user-initiated changes reach the consumer.
   */
  protected onSelectedIndexChange(index: number): void {
    const tab = this.tabs()[index];
    if (tab) {
      this.activeTabId.set(tab.id);
    }
  }
}
