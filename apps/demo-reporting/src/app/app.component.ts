import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import {
  AppShellComponent,
  ShellNavItem,
  ShellToolbarActionsDirective,
} from '@m3kit/shell';

import { BRAND_LAYOUT_PRESETS } from './core/layout-presets';
import { ThemeBrand, ThemeService } from './core/theme.service';

/**
 * App root: the chrome is delegated to `rpt-app-shell` (`@m3kit/shell`).
 * The app keeps only its policy — which shell preset each brand gets
 * (BRAND_LAYOUT_PRESETS), the navigation model, and the theme controls
 * projected into the shell's toolbar-actions slot.
 */
@Component({
  imports: [
    RouterOutlet,
    AppShellComponent,
    ShellToolbarActionsDirective,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly themeService = inject(ThemeService);

  /** Shell layout for the active brand (see BRAND_LAYOUT_PRESETS). */
  protected readonly layoutPreset = computed(
    () => BRAND_LAYOUT_PRESETS[this.themeService.brand()],
  );

  protected readonly brands: readonly { value: ThemeBrand; label: string }[] = [
    { value: 'instruments', label: 'Instruments' },
    { value: 'terminal', label: 'Terminal' },
    { value: 'ledger', label: 'Ledger' },
    { value: 'field-guide', label: 'Field Guide' },
  ];

  protected readonly navLinks: readonly ShellNavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', exact: false },
    { path: '/reports', label: 'Invoices', icon: 'table_chart', exact: true },
    {
      path: '/reports/customers',
      label: 'Customers',
      icon: 'group',
      exact: false,
    },
  ];

  title = 'demo-reporting';
}
