# Cost and Business Model Audit — Phase 1-E

**Project:** Prompt Pilot — AI Content Intelligence Platform  
**Status:** Documentation only — no billing implementation  
**Related:** [PRS — Credits](02-product-requirements-specification.md#8-credits-concept) · [MVP Definition](06-mvp-definition.md)

---

## 1. Budget constraint

| Parameter | Value |
|---|---|
| **Total budget** | **$100–120 USD** for first **3–5 months** |
| Scope | Hosting + AI API + tooling combined |
| Implication | MVP must be mock-first, BYOK-friendly, and heavily cost-gated |

This budget **cannot** support always-on GPU, large-scale video processing, or unlimited multimodal AI at launch.

---

## 2. Hosting strategy

| Option | Cost profile | MVP recommendation |
|---|---|---|
| **Vercel (Next.js)** | Free/hobby tier likely sufficient for dev/preview | Use for app shell; watch serverless execution limits |
| **Supabase local** | $0 during development | Continue local-first (existing pattern) |
| **Supabase hosted** | ~$25/mo Pro when needed | Defer until explicit deploy approval |
| **Background workers** | Extra compute (Railway, Fly, VPS, or Supabase Edge Functions) | **Defer paid worker** until job volume justifies; use mock sync path in early phases |
| **Object storage** | Supabase Storage included in tier | Temp uploads only; aggressive TTL |

**Strategy:** Local development through Phase 5–8; single small hosted stack only after acceptance — stay within budget envelope.

---

## 3. AI strategy

| Approach | Description | Budget fit |
|---|---|---|
| **Mock-first** | Deterministic fixtures for analysis and Prompt Studio | **Required** for Phases 5–7 |
| **Small real calls** | Limited dev testing with caps | Optional within budget |
| **BYOK** | Users supply OpenAI/Google/etc. keys | **Recommended** to shift variable cost to user |
| **Model selection** | Cheapest viable models for structured JSON extraction | Required when real AI enabled |
| **No video generation APIs** | Analysis/transcription only | Product boundary |

Estimated variable cost drivers (when real AI enabled):

- Transcription (audio/video)
- Multimodal analysis (frames + transcript)
- Prompt compilation (text-only, lower cost)

**Rule:** Every AI call must have token/size ceiling and per-user daily cap before production.

---

## 4. BYOK strategy

| Principle | Implementation direction (future) |
|---|---|
| Storage | Encrypted at rest; server-only decryption |
| Scope | Per-provider keys (OpenAI, Google, etc.) |
| UI | Settings page; never echo full key |
| Fallback | Platform-managed keys disabled when BYOK absent and budget exhausted |
| Audit | Log provider used, not key material |

BYOK is **not implemented**. Documented for Phase 15+ in master roadmap.

---

## 5. Credits strategy

| Element | Direction |
|---|---|
| Unit | 1 credit ≈ one base analysis job (adjust by duration multiplier) |
| Free tier | e.g. 3–5 analyses/month (human approval required) |
| Compilation | Fractional credits per Prompt Studio run |
| Display | Estimates before submit |
| Enforcement | Soft block when exhausted; no payment flow in MVP |

Credits decouple **user limits** from **actual API spend** for early validation.

---

## 6. Future monetization (not implemented)

| Tier | Indicative direction |
|---|---|
| Free | Limited credits, BYOK optional |
| Pro ($) | Higher limits, all Prompt Studio providers, repurposing |
| Agency ($$) | Teams, priority queue — **deferred** |

Payment processor (Stripe), tax, and refunds: **explicitly deferred** until product-market validation and budget recovery path exist.

---

## 7. Cost controls (required before real AI)

- Per-job max duration (e.g. 3–10 minutes video)
- Per-job max file size (e.g. 100–500 MB upload)
- Daily user job cap
- Duplicate URL detection (cache hit = no re-bill)
- Mock mode default in development
- Environment gate: `PROMPT_PILOT_AI_ENABLED=true` required for spend

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| Budget overrun on transcription | BYOK + duration caps + mock-first |
| Worker hosting cost | Defer; batch small jobs in serverless initially |
| Scope creep (SEO, repurposing, 4 platforms) | MVP freeze in Phase 1-F |
| Hidden Next.js/Vercel bandwidth | Monitor; static export where possible |

---

## 9. Phase 1-E acceptance criteria

- [x] Budget documented ($100–120 / 3–5 months)
- [x] Hosting, AI, BYOK, credits, monetization directions documented
- [x] No implementation performed
- [ ] Human approval of budget assumptions and BYOK priority
