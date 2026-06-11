import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeBrand, ThemeService } from './core/theme.service';

@Component({
  imports: [
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
})
export class AppComponent {
  protected readonly themeService = inject(ThemeService);

  protected readonly brands: readonly { value: ThemeBrand; label: string }[] = [
    { value: 'instruments', label: 'Instruments' },
    { value: 'terminal', label: 'Terminal' },
    { value: 'ledger', label: 'Ledger' },
    { value: 'field-guide', label: 'Field Guide' },
  ];

  title = 'demo-reporting';
}
