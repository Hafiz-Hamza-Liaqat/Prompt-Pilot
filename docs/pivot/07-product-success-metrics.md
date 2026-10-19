# Product Success Metrics — Phase 1-G

**Project:** Prompt Pilot — AI Content Intelligence Platform  
**Status:** Documentation only — instrumentation not implemented  
**Related:** [MVP Definition](06-mvp-definition.md) · [Cost Audit](05-cost-business-model-audit.md)

---

## 1. Purpose

Define **measurable success** for the pivot MVP and early growth. Metrics are grouped by category. Implementation of tracking belongs to Phase 16 (Operations & Metrics) in the master roadmap.

---

## 2. Metric definitions

### Cost and efficiency

| Metric | Definition | MVP target (initial) |
|---|---|---|
| **Cost per analysis** | Total infra + AI spend ÷ completed analyses | Track; no fixed target until real AI enabled |
| **Average AI cost per job** | Provider API spend ÷ AI-backed jobs | < $0.50/job in dev testing (guidance) |
| **Credit burn rate** | Credits consumed per user per month | Monitor distribution |
| **Cache hit rate** | Duplicate URL analyses served from cache | > 20% when cache exists |

### Performance

| Metric | Definition | MVP target |
|---|---|---|
| **Average processing time** | Submit → analysis complete | Mock: < 30s; Real AI: TBD |
| **p95 processing time** | 95th percentile job duration | TBD after worker phase |
| **Processing success rate** | Completed ÷ (completed + failed) | ≥ 95% |
| **Upload success rate** | Valid uploads ÷ attempts | ≥ 98% |

### Product usage

| Metric | Definition | MVP target |
|---|---|---|
| **Most-used features** | Count exports by section (analysis, blueprint, prompt provider) | Track top 3 |
| **Completion rate** | Projects with export ÷ projects with analysis started | ≥ 60% |
| **Prompt Studio usage** | Users copying provider variant ÷ workspace views | Track |
| **Average session duration** | Time in authenticated app | Baseline only |

### Growth (post-MVP)

| Metric | Definition | Notes |
|---|---|---|
| **User retention** | D7 / D30 return rate | Requires hosted deploy |
| **Free → Paid conversion** | Paid ÷ active free users | Requires billing phase |
| **Monthly recurring revenue (MRR)** | Subscription revenue | Deferred |

### Quality and trust

| Metric | Definition | MVP target |
|---|---|---|
| **Analysis error rate** | User-visible failures ÷ jobs | < 5% |
| **Rights attestation completion** | Jobs with attestation ÷ jobs | 100% when required |
| **Support contact rate** | Support page views ÷ DAU | Baseline only |

---

## 3. Instrumentation requirements (future)

| Event | When logged |
|---|---|
| `analysis.started` | Job queued |
| `analysis.completed` | Job success |
| `analysis.failed` | Job failure with reason code |
| `prompt.exported` | User copies/downloads package |
| `credits.consumed` | Credits debited |
| `ai.cost` | Provider call with token estimate |

**Privacy:** No transcript content, API keys, or PII in analytics payloads.

---

## 4. Reporting cadence

| Period | Audience | Content |
|---|---|---|
| Weekly (dev) | Builder | Job success, cost, test pass rate |
| Monthly | Product owner | Completion rate, feature usage, budget burn |
| Per phase | Phase sign-off | Acceptance criteria + metric baseline |

---

## 5. Phase 1-G acceptance criteria

- [x] Metrics defined with initial targets where applicable
- [x] Instrumentation requirements documented
- [x] No tracking code added
- [ ] Human approval of metrics priority for Phase 2 planning
