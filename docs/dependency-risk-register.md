# Dependency Risk Register

**Project:** Prompt Pilot

Related documents: [Application Foundation](application-foundation.md) · [Implementation Checklist](implementation-checklist.md)

This register records dependency vulnerability review decisions. It does not replace npm audit; it documents why accepted risks remain and when they must be rechecked.

---

## Current review date

**2026-07-04**

---

## Reviewed findings

### Finding 1 — PostCSS (transitive via Next.js)

| Field | Value |
|---|---|
| Package | `postcss` |
| Severity | Moderate (GHSA-qx2v-qp2m-jg93) |
| Type | Transitive |
| Dependency path | `next@16.2.10` → `postcss@8.4.31` |
| Affected version range | `<8.5.10` |
| Patched version | `>=8.5.10` |
| Affected functionality | PostCSS CSS stringify output (XSS via unescaped `</style>`) |
| Production path exposure | Bundled with Next.js build tooling; this repository does not invoke PostCSS stringify on untrusted user CSS in Phase 2. Risk is primarily in build-time CSS processing within Next.js internals. |
| Available safe fix | No. `npm audit fix --force` proposes `next@9.3.3` (breaking major downgrade). No official Next.js 16.x patch that bumps bundled PostCSS to `>=8.5.10` was available at review time. |
| **Decision** | `ACCEPTED_TEMPORARILY` |
| Reason | No non-breaking, non-forced remediation exists. Forced fix would violate dependency-correction policy by requiring `--force` and a major Next.js downgrade incompatible with the current App Router foundation. |
| Required follow-up trigger | Recheck when Next.js releases a compatible security update bundling PostCSS `>=8.5.10`; see review triggers below. |

### Finding 2 — Next.js (via PostCSS advisory)

| Field | Value |
|---|---|
| Package | `next` |
| Severity | Moderate (reported through PostCSS dependency) |
| Type | Direct |
| Dependency path | `prompt-pilot` → `next@16.2.10` → `postcss@8.4.31` |
| Affected version range | `9.3.4-canary.0 - 16.3.0-canary.5` (per npm audit) |
| Available safe fix | No non-breaking fix at review time (audit suggests breaking downgrade only). |
| **Decision** | `ACCEPTED_TEMPORARILY` |
| Reason | Current version `16.2.10` is the installed stable release. Remediation depends on a future Next.js patch release, not a safe in-place npm update today. |
| Required follow-up trigger | Same as Finding 1. |

---

## Summary

| Severity | Count | Status |
|---|---|---|
| Critical | 0 | — |
| High | 0 | — |
| Moderate | 2 | `ACCEPTED_TEMPORARILY` |
| Low | 0 | — |

- No high or critical vulnerability is accepted.
- Both moderate findings share the same transitive PostCSS chain through Next.js.
- `npm audit fix --force` was **not** used.
- No package overrides were added.

---

## Review triggers

Recheck this register:

1. Before Phase 25 — Quality Evaluation System
2. Before Phase 26 — Security Hardening
3. Before Phase 30 — Controlled Private Beta Preparation
4. Before Phase 31 — Public Launch Readiness
5. Whenever Next.js releases a compatible security update for the installed major version
6. After any Next.js, PostCSS, or build-tool dependency upgrade

---

## Decision statuses reference

| Status | Meaning |
|---|---|
| `RESOLVED` | A safe update removed the vulnerability |
| `ACCEPTED_TEMPORARILY` | No safe fix; risk documented with follow-up triggers |
| `BLOCKED` | Work cannot continue until resolved |
