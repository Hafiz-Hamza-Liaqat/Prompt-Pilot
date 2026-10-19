# ADR-002: ReferenceVideoAnalysis is the single analysis object

**Status:** Accepted  
**Date:** 2026-07-05  
**Phase:** PP-03

## Context

PP-02 established `ReferenceVideoAnalysis` as the heart of Prompt Pilot. Legacy `SourceAnalysis` covers a subset of text fields inside `VideoBrief`.

## Decision

Implement **`ReferenceVideoAnalysisSchema`** as the authoritative analysis contract with all PP-02 sections (Metadata through Fingerprint). Deprecate `SourceAnalysisSchema` for new work. Package Engine inputs must reference `analysisId` + `analysisVersion` — never raw media.

## Consequences

- Analysis snapshots are immutable per `analysisVersion`
- SEO Seeds live inside analysis; SEO Package generates titles/tags from seeds
- Adapter layer required to map legacy brief source fields to Reference entity (deferred to PP-07+)
- Large schema — validated by fixture tests, not runtime generation yet

## Deferred

- Persistence table design (PP-04)
- Mock analysis provider output (PP-09)
