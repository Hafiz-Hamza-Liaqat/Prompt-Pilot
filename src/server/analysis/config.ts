/** Core Analysis operational defaults — PP-10 design. */
export const CORE_ANALYSIS_CONFIG = {
  /** Semantic version persisted on ReferenceVideoAnalysis.pipelineVersion. */
  pipelineVersion: '1.0.0',
  stageTimeoutMs: 60_000,
  defaultCacheTtlDays: 90,
} as const;
