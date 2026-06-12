import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { BreadcrumbItem } from '../breadcrumbs/breadcrumb-item';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { PageHeaderComponent } from '../page-header/page-header.component';

/**
 * The list page's single primary action — rendered as the header's filled
 * button (with an optional leading Material Symbols icon). Clicking it
 * emits the `(primaryActionClick)` output; the host owns what the action
 * does.
 */
export interface ListPagePrimaryAction {
  label: string;
  icon?: string;
}

/**
 * Canonical list/index page template: composes the kit's page chrome —
 * an optional breadcrumb trail above an `m3k-page-header` — over three
 * content regions:
 *
 * - `[m3kListPageToolbar]` — filter bars / secondary controls, directly
 *   beneath the header (same attribute-select slot mechanism as
 *   `m3kPageHeaderActions`);
 * - the default slot — the table or list itself;
 * - `[m3kListPageEmpty]` — shown *instead of* the default slot while
 *   `empty` is true, so a feedback empty-state component drops in without
 *   this library depending on it.
 *
 * An optional `primaryAction` renders as the header's filled button and
 * emits `(primaryActionClick)` on click.
 *
 * ```html
 * <m3k-list-page
 *   title="Invoices"
 *   description="Billing period June 2026"
 *   [breadcrumbs]="[{ label: 'Reports', path: '/reports' }, { label: 'Invoices' }]"
 *   [primaryAction]="{ label: 'New invoice', icon: 'add' }"
 *   [empty]="invoices().length === 0"
 *   (primaryActionClick)="createInvoice()"
 * >
 *   <div m3kListPageToolbar><!-- filter bar --></div>
 *   <table><!-- invoice rows --></table>
 *   <div m3kListPageEmpty><!-- empty state --></div>
 * </m3k-list-page>
 * ```
 */
@Component({
  selector: 'm3k-list-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    BreadcrumbsComponent,
    PageHeaderComponent,
  ],
  templateUrl: './list-page.component.html',
  styleUrl: './list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPageComponent {
  /** Page title — forwarded to the header's only `h1`. */
  readonly title = input.required<string>();

  /** Optional supporting line beneath the title (header subtitle). */
  readonly description = input<string>('');

  /** Breadcrumb trail above the header; omitted when empty. */
  readonly breadcrumbs = input<readonly BreadcrumbItem[]>([]);

  /** Primary action button in the header; omitted when `undefined`. */
  readonly primaryAction = input<ListPagePrimaryAction | undefined>(undefined);

  /**
   * When true, the default content slot is removed and the
   * `[m3kListPageEmpty]` slot renders in its place.
   */
  readonly empty = input<boolean>(false);

  /**
   * Emits when the primary-action button is clicked. Named with the
   * `Click` suffix because the Angular style guide (enforced via
   * `no-output-rename`) forbids an output aliased to the `primaryAction`
   * input's name.
   */
  readonly primaryActionClick = output<void>();
}
