import { ShellPreset } from '@m3kit/shell';
import { ThemeBrand } from './theme.service';

/**
 * The shell's preset union, re-exported under the app's historical name.
 * Layout stays brand-agnostic in the libs (`@m3kit/shell` owns the presets);
 * the app layer merely picks a default shell per brand.
 */
export type LayoutPreset = ShellPreset;

/** Default shell layout for each brand theme. */
export const BRAND_LAYOUT_PRESETS: Record<ThemeBrand, ShellPreset> = {
  instruments: 'sidenav',
  terminal: 'command-bar',
  ledger: 'contents-rail',
  'field-guide': 'pill-tabs',
};
