import type { ReactNode } from "react";
import { Shell } from "@/features/shell/Shell";

/**
 * Route group, so the three screens share the navigation shell without `(shell)`
 * appearing in any URL.
 *
 * `/` stays outside it — it only redirects — and so does `app/api/`.
 */
export default function ShellLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}
