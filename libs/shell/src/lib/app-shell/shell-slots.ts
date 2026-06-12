import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Marks an `ng-template` projected into `m3k-app-shell` as the toolbar
 * actions slot. The shell stamps the template at each preset's controls
 * position (toolbar end for `sidenav`/`pill-tabs`, bordered controls cell
 * for `command-bar`, rail foot for `contents-rail`).
 *
 * ```html
 * <m3k-app-shell …>
 *   <ng-template m3kShellToolbarActions>
 *     <!-- consumer controls, e.g. a theme toggle -->
 *   </ng-template>
 * </m3k-app-shell>
 * ```
 */
@Directive({
  selector: '[m3kShellToolbarActions]',
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
  selector: '[m3kShellRailFooter]',
})
export class ShellRailFooterDirective {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}
