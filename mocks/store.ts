import { DocumentSimulation } from "./simulation/engine";

/**
 * The one simulation instance the route handlers share.
 *
 * It hangs off `globalThis` rather than a module-level `const` because Next
 * re-evaluates modules on hot reload in development; a plain module binding
 * would silently empty the store on every edit, and a document uploaded a
 * moment earlier would 404.
 *
 * State is in-memory and per-process, so it resets when the server restarts.
 * That is acceptable — and expected — for a mock. A real backend persists.
 */
declare global {
  // `var` is required here: it is the only declaration form that augments
  // globalThis. `no-var` does not apply to ambient declarations.
  var __docIntelligenceSimulation: DocumentSimulation | undefined;
}

export function getSimulation(): DocumentSimulation {
  globalThis.__docIntelligenceSimulation ??= new DocumentSimulation();
  return globalThis.__docIntelligenceSimulation;
}
