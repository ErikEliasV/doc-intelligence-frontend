/**
 * Joins class names, dropping falsy entries.
 *
 * Deliberately not `clsx` + `tailwind-merge`: that pair exists to resolve
 * conflicts when a caller's class fights a component's own (`p-4` over `p-6`),
 * and CSS source order — not string order — decides those. The components here
 * avoid the problem instead of paying two dependencies to fix it: none of them
 * sets a default a caller is expected to override. Padding and layout are the
 * caller's, always.
 *
 * If a component ever does need overridable defaults, that is the moment to
 * reopen `tailwind-merge` in an ADR — not before.
 */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
