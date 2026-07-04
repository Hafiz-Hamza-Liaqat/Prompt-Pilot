# MVP Scope

**Project:** ScenePilot

Related documents: [Product Contract](product-contract.md) · [User Journey](user-journey.md) · [Domain Glossary](domain-glossary.md) · [Phase Roadmap](phase-roadmap.md)

This document locks MVP scope. Items listed under "postponed" are explicitly out of MVP unless a future phase reopens them.

---

## Supported source inputs

| Input | MVP status |
|---|---|
| User-entered idea | ✅ In scope |
| Pasted script | ✅ In scope |
| Product-page URL | ✅ In scope |
| Article or blog URL | ✅ In scope |
| Start from template | ✅ In scope |

### Explicitly postponed inputs

| Input | Status |
|---|---|
| Uploaded video analysis | ❌ Post-MVP |
| Social-video downloading | ❌ Post-MVP |
| Direct YouTube video ingestion | ❌ Post-MVP |
| Automatic transcript scraping from unsupported platforms | ❌ Post-MVP |
| Uploaded image analysis | ❌ Post-MVP |
| Uploaded document analysis | ❌ Post-MVP |

---

## Supported publishing destinations

| Destination | MVP status |
|---|---|
| YouTube | ✅ |
| YouTube Shorts | ✅ |
| Instagram Reels | ✅ |
| Instagram Feed | ✅ |
| Facebook Reels | ✅ |
| Facebook Feed | ✅ |
| TikTok | ✅ |
| Website or landing page | ✅ |
| Custom destination | ✅ |

Publishing destinations define where the finished video will be published. They are distinct from AI video providers (see [Domain Glossary](domain-glossary.md)).

---

## Initial video categories

The MVP supports exactly these 12 categories:

1. Product advertisement
2. UGC-style advertisement
3. Cinematic short
4. Faceless educational video
5. Explainer video
6. Product demonstration
7. Story or narrative video
8. Realistic social scene
9. YouTube introduction or trailer
10. Real-estate showcase
11. News or informational recap
12. App or software promotion

---

## Initial duration presets

| Preset | Value |
|---|---|
| Micro | 5 seconds |
| Short | 8 seconds |
| Short | 10 seconds |
| Standard short | 15 seconds |
| Standard short | 20 seconds |
| Standard | 30 seconds |
| Extended | 45 seconds |
| Extended | 60 seconds |
| Long | 90 seconds |
| Long | 2 minutes |
| Long | 3 minutes |
| Custom | User-defined duration |

Total plan duration must equal the sum of individual scene durations.

---

## Initial AI-video provider catalogue

The MVP catalogues exactly these five providers:

| Provider | Notes |
|---|---|
| Google Veo | Documented capabilities only; no universal "best" claim |
| OpenAI Sora | Documented capabilities only |
| Runway | Documented capabilities only |
| Kling | Documented capabilities only |
| Adobe Firefly | Documented capabilities only |

Provider information is versioned via **Capability Version** records. Rankings are contextual and explainable, not hard-coded.

No additional providers are in MVP scope.

---

## MVP modules

| # | Module | Description |
|---|---|---|
| 1 | Public landing page | Product introduction and sign-in entry |
| 2 | Authentication | User sign-up, sign-in, sign-out |
| 3 | User dashboard | Project list and quick actions |
| 4 | Project management | Create, rename, archive, delete projects |
| 5 | Guided creation wizard | Step-by-step brief collection |
| 6 | Deterministic complexity scoring | Rule-based complexity rating |
| 7 | Deterministic risk scoring | Rule-based production-risk rating |
| 8 | Provider recommendation engine | Fit-based provider selection with explanation |
| 9 | Duration and scene decomposition | Break target duration into scenes |
| 10 | Storyboard and shot roadmap | Scene and shot structure per timeline |
| 11 | Provider-specific prompt compiler | Generate **Compiled Prompts** per provider |
| 12 | Continuity Bible | Character, product, world, and style locks |
| 13 | Voiceover and audio guidance | Script and audio direction |
| 14 | Editing roadmap | Assembly and post-production steps |
| 15 | Prompt quality warnings | **Prompt Quality Audit** output |
| 16 | Platform adaptation | Destination-specific adjustments |
| 17 | Project history | Persisted plans and revision access |
| 18 | Copy and export | Export structured plan content |
| 19 | Basic admin provider catalogue | Manage provider capability records |
| 20 | Usage limits | Enforce per-user plan limits |

---

## Explicitly postponed modules

| Module | Status |
|---|---|
| Video generation | ❌ Post-MVP |
| Image generation | ❌ Post-MVP |
| Full video editor | ❌ Post-MVP |
| Mobile application | ❌ Post-MVP |
| Browser extension | ❌ Post-MVP |
| Direct social publishing | ❌ Post-MVP |
| Real-time collaboration | ❌ Post-MVP |
| Marketplace | ❌ Post-MVP |
| Community prompt feed | ❌ Post-MVP |
| Multiple planning-LLM providers | ❌ Post-MVP |
| Direct billing implementation | ❌ Post-MVP |
| Advanced agency workspaces | ❌ Post-MVP |

---

## MVP completion criteria

The MVP is complete when all of the following are true:

| Criterion | Verification |
|---|---|
| User can create and save a project | Manual + Playwright |
| Refresh restores the project | Persistence test |
| User can complete the creation wizard | End-to-end journey |
| System creates a structured video plan | Output schema validation |
| Duration equals sum of scene durations | Deterministic check |
| Provider recommendations are explainable | Every recommendation includes rationale |
| Every scene has a provider-specific prompt | Prompt package completeness |
| Every critical action has loading, success, error, and disabled states | UI state audit |
| User cannot access another user's project | Authorization test |
| Complete plan can be copied or exported | Export flow test |
| Critical Playwright journeys pass | CI green |
