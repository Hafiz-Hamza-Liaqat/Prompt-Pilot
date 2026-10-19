# ADR-004: SourceAnalysis deprecation path

**Status:** Accepted  
**Date:** 2026-07-05  
**Phase:** PP-03

## Context

`SourceAnalysisSchema` is embedded in `VideoBriefSchema` and `VideoPlanSchema`. PP-02 maps it to a subset of `ReferenceVideoAnalysis`. Removing it now would break the brief wizard and 1000+ tests.

## Decision

1. Add **`@deprecated`** JSDoc on `SourceAnalysisSchema` pointing to `ReferenceVideoAnalysisSchema`
2. Do **not** remove or weaken `VideoBriefSchema` in PP-03
3. Follow PP-02 Migration Phases A–E for runtime switchover
4. Document field mapping in [compatibility.md](../pp-03/compatibility.md)

## Consequences

- Brief wizard continues unchanged
- Glossary distinguishes **Source Analysis** (legacy) from **Reference Video Analysis** (canonical)
- PP-04 may introduce `references` + `analyses` tables without altering `video_briefs` initially

## Human approval needed

Confirm MVP continues to support brief-only path while Reference intake is built (PP-05+).
