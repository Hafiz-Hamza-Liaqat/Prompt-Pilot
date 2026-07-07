import type { AnalyzeReferenceInput, ReferenceVideoAnalysisDraft } from './types.js';

export type ReferenceAnalysisProviderResult =
  | { ok: true; data: ReferenceVideoAnalysisDraft }
  | { ok: false; code: string; message: string };

/** Internal analysis provider — mock or future AI (PP-10). */
export type ReferenceAnalysisProvider = {
  readonly providerId: string;
  analyze(input: AnalyzeReferenceInput): Promise<ReferenceAnalysisProviderResult>;
};
