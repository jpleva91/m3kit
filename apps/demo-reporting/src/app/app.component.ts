import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { BRAND_LAYOUT_PRESETS } from './core/layout-presets';
import { ThemeBrand, ThemeService } from './core/theme.service';

/** A primary navigation destination rendered by every layout preset. */
interface NavLink {
  path: string;
  label: string;
  icon: string;
  exact: boolean;
}

@Component({
  imports: [
    NgTemplateOutlet,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly themeService = inject(ThemeService);

  /** Shell layout for the active brand (see BRAND_LAYOUT_PRESETS). */
  protected readonly layoutPreset = computed(
    () => BRAND_LAYOUT_PRESETS[this.themeService.brand()],
  );

  /** Below this width the sidenav overlays instead of docking. */
  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 959px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  protected readonly brands: readonly { value: ThemeBrand; label: string }[] = [
    { value: 'instruments', label: 'Instruments' },
    { value: 'terminal', label: 'Terminal' },
    { value: 'ledger', label: 'Ledger' },
    { value: 'field-guide', label: 'Field Guide' },
  ];

  protected readonly navLinks: readonly NavLink[] = [
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
