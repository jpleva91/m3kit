import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Marks an `ng-template` projected into `rpt-app-shell` as the toolbar
 * actions slot. The shell stamps the template at each preset's controls
 * position (toolbar end for `sidenav`/`pill-tabs`, bordered controls cell
 * for `command-bar`, rail foot for `contents-rail`).
 *
 * ```html
 * <rpt-app-shell …>
 *   <ng-template rptShellToolbarActions>
 *     <!-- consumer controls, e.g. a theme toggle -->
 *   </ng-template>
 * </rpt-app-shell>
 * ```
 */
@Directive({
  selector: '[rptShellToolbarActions]',
})
export class ShellToolbarActionsDirective {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * Optional override for the rail foot of the `contents-rail` preset. When
 * absent, the shell falls back to stamping the toolbar-actions template in
 * the rail foot (its preset-appropriate home).
 */
@Directive({
  selector: '[rptShellRailFooter]',
})
export class ShellRailFooterDirective {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}
