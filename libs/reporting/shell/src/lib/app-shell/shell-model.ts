/**
 * Shell chrome arrangements `rpt-app-shell` can render. Promoted from the
 * demo app's `LayoutPreset`; layout stays brand-agnostic — consumers pick a
 * preset per brand (or per anything) as app policy.
 *
 * - `sidenav`        toolbar + responsive side navigation (default shell)
 * - `command-bar`    single top command bar with inline nav + status footline
 * - `contents-rail`  editorial left rail with a contents-style nav list
 * - `pill-tabs`      top toolbar with centered pill-shaped tab navigation
 */
export type ShellPreset =
  | 'sidenav'
  | 'command-bar'
  | 'contents-rail'
  | 'pill-tabs';

/**
 * One primary navigation destination rendered by every layout preset.
 *
 * `icon` is consumed only by icon-bearing presets (`sidenav`); `exact`
 * controls active-route matching and defaults to `false`.
 */
export interface ShellNavItem {
  path: string;
  label: string;
  icon?: string;
  exact?: boolean;
}
