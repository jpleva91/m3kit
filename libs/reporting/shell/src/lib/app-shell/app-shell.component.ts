import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  inject,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { ShellNavItem, ShellPreset } from './shell-model';
import {
  ShellRailFooterDirective,
  ShellToolbarActionsDirective,
} from './shell-slots';

/**
 * Preset-driven application shell: renders one of four complete chrome
 * arrangements (`sidenav`, `command-bar`, `contents-rail`, `pill-tabs`)
 * from a navigation model and a title.
 *
 * The shell owns 100% of the chrome — nav links, active-route marking
 * (`aria-current="page"`), titles, footline/folio/pill decorations, and the
 * ≤959px handset adaptations. The consumer owns routing and policy: it
 * projects its own `<router-outlet />` (or any content) as the default slot
 * and optionally provides controls via the template slots.
 *
 * ```html
 * <rpt-app-shell preset="sidenav" [nav]="navItems" title="demo-reporting">
 *   <ng-template rptShellToolbarActions>
 *     <!-- consumer controls (theme toggle, …) -->
 *   </ng-template>
 *   <router-outlet />
 * </rpt-app-shell>
 * ```
 */
@Component({
  selector: 'rpt-app-shell',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  /** Which of the four chrome arrangements to render. */
  readonly preset = input<ShellPreset>('sidenav');

  /** Primary navigation destinations rendered by every preset. */
  readonly nav = input<readonly ShellNavItem[]>([]);

  /** Application title shown in each preset's masthead position. */
  readonly title = input<string>('');

  /** Consumer controls stamped at the preset's controls position. */
  private readonly toolbarActions = contentChild(ShellToolbarActionsDirective);

  /** Optional rail-foot override used by the `contents-rail` preset. */
  private readonly railFooter = contentChild(ShellRailFooterDirective);

  /** Template stamped at the toolbar-actions position, if provided. */
  protected readonly toolbarActionsTemplate = computed<TemplateRef<unknown> | null>(
    () => this.toolbarActions()?.templateRef ?? null,
  );

  /** Rail-foot template: rail-footer slot, falling back to toolbar actions. */
  protected readonly railFooterTemplate = computed<TemplateRef<unknown> | null>(
    () => this.railFooter()?.templateRef ?? this.toolbarActionsTemplate(),
  );

  /** Below this width the sidenav/rail overlay instead of docking. */
  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 959px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );
}
