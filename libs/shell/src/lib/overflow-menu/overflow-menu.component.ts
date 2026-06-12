import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { MenuActionItem } from './overflow-menu-model';

/**
 * Canonical row/card action menu: a Material icon-button trigger (default
 * `more_vert`) opening a `MatMenu` built from typed `MenuActionItem`s.
 * Selecting an item emits its `id` through the `action` output; the host
 * owns what each id means. Items with `divider: true` render a divider
 * before them; `destructive` items set label and icon in the error role;
 * `disabled` items render but never emit.
 *
 * ```html
 * <m3k-overflow-menu
 *   ariaLabel="Invoice INV-2026-0042 actions"
 *   [items]="[
 *     { id: 'view', label: 'View invoice', icon: 'visibility' },
 *     { id: 'void', label: 'Void invoice', icon: 'block',
 *       destructive: true, divider: true },
 *   ]"
 *   (action)="onAction($event)"
 * />
 * ```
 */
@Component({
  selector: 'm3k-overflow-menu',
  imports: [MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule],
  templateUrl: './overflow-menu.component.html',
  styleUrl: './overflow-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverflowMenuComponent {
  /** Menu entries, in render order. */
  readonly items = input.required<readonly MenuActionItem[]>();

  /** Material Symbol shown on the trigger button. */
  readonly icon = input<string>('more_vert');

  /** Accessible name for the trigger — name the subject, e.g. "Invoice INV-… actions". */
  readonly ariaLabel = input<string>('More actions');

  /** When true, the trigger is disabled and the menu cannot open. */
  readonly disabled = input<boolean>(false);

  /** Emits the selected item's `id`; never fires for disabled items. */
  readonly action = output<string>();

  /** Emits the clicked item's id unless the item is disabled. */
  protected select(item: MenuActionItem): void {
    if (item.disabled) {
      return;
    }
    this.action.emit(item.id);
  }
}
