/**
 * Knobs for the fake extraction pipeline. Every number here exists to imitate a
 * slow, unreliable third-party model — none of it is part of the API contract.
 */
export interface SimulationConfig {
  /** How long a document sits in `recebido` before it reads as `processando`. */
  handoffMs: number;
  /** Lower bound for time from upload to a terminal status. */
  minProcessingMs: number;
  /** Upper bound for time from upload to a terminal status. */
  maxProcessingMs: number;
  /** Share of uploads that end in `erro`. 0..1. */
  errorRate: number;
  /**
   * Share of *successfully processed* documents that come out with at least one
   * low-confidence field, and therefore land in `em_conferencia`. 0..1.
   * Applied after the error roll, not to the whole population.
   */
  lowConfidenceRate: number;
}

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  handoffMs: 2_000,
  minProcessingMs: 5_000,
  maxProcessingMs: 40_000,
  errorRate: 0.15,
  lowConfidenceRate: 0.3,
};

/**
 * Confidence is drawn from two bands with a gap around
 * `CONFIDENCE_REVIEW_THRESHOLD` (0.75). The gap is deliberate: values are
 * rounded to two decimals for readability, and a value drawn at 0.749 would
 * round to 0.75 and silently flip a document out of `em_conferencia`.
 */
export const CONFIDENCE_BANDS = {
  low: { min: 0.35, max: 0.7 },
  high: { min: 0.8, max: 0.99 },
} as const;
