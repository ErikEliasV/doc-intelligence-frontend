/**
 * The design system's public surface. Screens import from here, never from a
 * component file directly — the same rule the source project's
 * `_adherence.oxlintrc.json` enforces.
 *
 * Components are ported as the screens need them, not all 24 at once. See
 * docs/adr/ADR-0009.md.
 */
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from "./core/Button";
export { Card, type CardProps, type CardTone } from "./core/Card";
export { Icon, type IconName, type IconProps } from "./core/Icon";
export { IconButton, type IconButtonProps, type IconButtonVariant } from "./core/IconButton";
export { DocumentRow, type DocumentRowProps } from "./documents/DocumentRow";
export { DropZone, type DropZoneProps } from "./documents/DropZone";
export { FileThumb, type FileThumbProps, type FileThumbState } from "./documents/FileThumb";
export { ConfidenceMeter, type ConfidenceMeterProps } from "./feedback/ConfidenceMeter";
export { EmptyState, type EmptyStateProps } from "./feedback/EmptyState";
export { ProgressBar, type ProgressBarProps } from "./feedback/ProgressBar";
export { StatusPill, rotuloDoStatus, type StatusPillProps } from "./feedback/StatusPill";
export { Toast, type ToastProps, type ToastTone } from "./feedback/Toast";
export { Pagination, type PaginationProps } from "./navigation/Pagination";
export { Tabs, type TabItem, type TabsProps } from "./navigation/Tabs";
