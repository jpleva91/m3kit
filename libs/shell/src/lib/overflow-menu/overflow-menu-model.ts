/** One action entry in a `m3k-overflow-menu`. */
export interface MenuActionItem {
  /** Stable identifier emitted through the `action` output when selected. */
  id: string;

  /** Visible menu-item text. */
  label: string;

  /** Optional leading Material Symbol name. */
  icon?: string;

  /** When true, the item renders disabled and never emits. */
  disabled?: boolean;

  /** When true, label and icon render in the error role. */
  destructive?: boolean;

  /** When true, a divider renders before this item. */
  divider?: boolean;
}
