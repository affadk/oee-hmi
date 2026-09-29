// /src/domain/simulation/types.ts
// Simulation contracts. Pure domain: no I/O, no wall-clock, no unseeded RNG.
// Algorithms in ./algorithms and models in ./models consume/produce these.

/** Deterministic seed — same seed + same input ⇒ same output. */
export type SimulationSeed = number;

export interface SimulationRun<TInput, TResult> {
  readonly seed: SimulationSeed;
  readonly input: TInput;
  readonly result: TResult;
  /** ISO timestamp of when the run was produced (set by caller, not Date.now here). */
  readonly producedAt: string;
}
