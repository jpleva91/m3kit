import { ThemeBrand } from './theme.service';

/**
 * Shell layout presets the app can render. Layout stays brand-agnostic in
 * the libs; the app layer merely picks a default shell per brand.
 *
 * - `sidenav`        toolbar + responsive side navigation (default shell)
 * - `command-bar`    single top command bar with inline nav + status footline
 * - `contents-rail`  editorial left rail with a contents-style nav list
 * - `pill-tabs`      top toolbar with centered pill-shaped tab navigation
 */
export type LayoutPreset =
  | 'sidenav'
  | 'command-bar'
  | 'contents-rail'
  | 'pill-tabs';

/** Default shell layout for each brand theme. */
export const BRAND_LAYOUT_PRESETS: Record<ThemeBrand, LayoutPreset> = {
  instruments: 'sidenav',
  terminal: 'command-bar',
  ledger: 'contents-rail',
  'field-guide': 'pill-tabs',
};
