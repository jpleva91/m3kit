import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BreadcrumbItem } from './breadcrumb-item';

/**
 * Accessible breadcrumb trail: a `nav[aria-label="Breadcrumb"]` wrapping an
 * ordered list. Items with a `path` (all but the last) render as router
 * links; the last item renders as plain text marked `aria-current="page"`;
 * separators are hidden from assistive technology.
 *
 * ```html
 * <m3k-breadcrumbs [items]="[
 *   { label: 'Reports', path: '/reports' },
 *   { label: 'Customers', path: '/reports/customers' },
 *   { label: 'Acme Manufacturing' },
 * ]" />
 * ```
 */
@Component({
  selector: 'm3k-breadcrumbs',
  imports: [RouterLink],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsComponent {
  /** Trail entries, root first; the last entry is the current page. */
  readonly items = input<readonly BreadcrumbItem[]>([]);
}
