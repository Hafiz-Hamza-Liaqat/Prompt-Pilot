# Feature Inventory — Phase 1-C

**Project:** Prompt Pilot — AI Content Intelligence Platform  
**Status:** Documentation only  
**Related:** [PRS](02-product-requirements-specification.md) · [MVP Definition](06-mvp-definition.md)

Legend: **MVP** = in frozen MVP · **MVP+** = immediately after MVP · **Future** = later phase · **Existing** = already in codebase (may extend)

---

## INPUTS

| Feature | Description | Status |
|---|---|---|
| YouTube URL | Public YouTube / YouTube Shorts reference link | **MVP** |
| Instagram URL | Reel/post reference link | **Future** |
| Facebook URL | Reel/watch reference link | **Future** |
| TikTok URL | Public TikTok video link | **Future** |
| Video upload | User-owned video file intake | **MVP** |
| Audio upload | User-owned audio file intake | **MVP** |
| Transcript | Paste or upload transcript text | **MVP** |
| Script | User script text | **MVP** (Existing brief source) |
| Idea text | Freeform concept | **Existing** (brief wizard) |
| Product URL | Product page link | **Existing** (deferred for pivot MVP) |
| Article URL | Article/blog link | **Existing** (deferred for pivot MVP) |

---

## CORE ANALYSIS

| Feature | Description | Status |
|---|---|---|
| Transcript | Speech-to-text or supplied transcript normalization | **MVP** |
| Timeline | Timecoded segments and duration map | **MVP** |
| Scene detection | Scene boundaries and roles | **MVP** (extend existing decomposition) |
| Story structure | Hook, setup, payoff, CTA beats | **MVP** |
| Objects | Notable objects/products detected or inferred | **MVP+** |
| Characters | Character presence (non-identifying summary) | **MVP+** |
| Camera | Framing, movement, angle language | **MVP** |
| Editing style | Cuts, pacing, transitions | **MVP** |
| Lighting | Lighting mood and setup language | **MVP+** |
| Audience | Inferred target audience | **MVP** |
| Hooks | Hook duration and pattern | **MVP** |
| CTA | Call-to-action structure | **MVP** |
| Emotions | Emotional tone and arc | **MVP+** |
| Locations | Setting/environment summary | **MVP+** |
| Complexity score | Production complexity | **Existing** |
| Execution risk | Execution risk assessment | **Existing** |
| Provider recommendation | Evidence-backed provider fit | **Existing** |

---

## CONTENT BLUEPRINT

| Feature | Description | Status |
|---|---|---|
| Storyboard | Scene-by-scene visual plan | **MVP** |
| Shot list | Shot-level breakdown | **MVP** |
| Camera suggestions | Framing and movement guidance | **MVP** |
| Lens suggestions | Focal length / lens language | **MVP+** |
| Lighting | Scene lighting plan | **MVP+** |
| Character description | Non-cloning character continuity notes | **MVP+** |
| Voice-over | VO structure (not audio generation) | **MVP+** |
| Music mood | Mood/tempo guidance (not reproduction) | **MVP+** |
| Sound effects | SFX placement notes | **Future** |
| Continuity bible | Character/product/world/style locks | **Future** (schema exists) |

---

## MARKETING

| Feature | Description | Status |
|---|---|---|
| Viral analysis | Pattern notes on shareability factors | **Future** |
| Hook analysis | Deep hook breakdown | **MVP+** |
| Audience | Audience persona summary | **MVP** |
| Retention | Pacing/retention risk notes | **MVP+** |
| Competitor style | High-level style comparison language | **Future** |

---

## SEO

| Feature | Description | Status |
|---|---|---|
| SEO title | Suggested title | **Future** |
| Meta description | Suggested meta | **Future** |
| Keywords | Primary keywords | **Future** |
| Semantic keywords | Related terms | **Future** |
| Long-tail keywords | Long-tail suggestions | **Future** |
| Tags | Platform tags | **Future** |
| Hashtags | Hashtag suggestions | **Future** |
| Publishing checklist | Pre-publish checklist | **Future** |

---

## PROMPT STUDIO

| Feature | Description | Status |
|---|---|---|
| Master provider-neutral prompt | Complete scene-aware prompt package | **MVP** |
| GPT prompt | OpenAI/GPT-oriented variant | **MVP+** |
| Gemini prompt | Google Gemini-oriented variant | **MVP+** |
| Veo prompt | Google Veo variant | **MVP** |
| Kling prompt | Kling variant | **MVP** |
| Runway prompt | Runway variant | **MVP** |
| Flux prompt | Flux image prompt variant | **Future** |
| Midjourney prompt | Midjourney variant | **Future** |
| Negative prompt | Negative constraints per scene/provider | **MVP** |
| Provider catalogue integration | Syntax from source-backed facts | **Existing** (extend) |

---

## REPURPOSING

| Feature | Description | Status |
|---|---|---|
| Blog post outline | Long-form repurposing | **Future** |
| Newsletter | Email format | **Future** |
| LinkedIn post | Professional social | **Future** |
| Facebook post | Feed copy | **Future** |
| Instagram carousel | Slide outline | **Future** |
| Reel script | Short-form script | **MVP+** |
| TikTok script | TikTok-native script | **Future** |
| Podcast outline | Episode structure | **Future** |
| Course outline | Module breakdown | **Future** |

---

## PLATFORM / INFRASTRUCTURE (cross-cutting)

| Feature | Description | Status |
|---|---|---|
| Authentication | Email/password, sessions, RLS | **Existing** |
| Projects | CRUD, archive, duplicate, soft delete | **Existing** |
| Workspace | Result preview shell | **Existing** (extend) |
| Jobs / workers | Async analysis queue | **Future** |
| Storage | Temp upload + TTL | **Future** |
| BYOK | User provider API keys | **Future** |
| Credits engine | Usage units | **Future** |
| Cost engine | AI/hosting cost tracking | **Future** |
| Feature flags | Gradual rollout | **Future** |
| Usage tracking | Per-user/job metrics | **Future** |

---

## Phase 1-C acceptance criteria

- [x] All requested sections inventoried
- [x] MVP vs future status assigned per feature
- [x] Existing reusable features identified
- [ ] Human review of MVP cut line (see [06-mvp-definition.md](06-mvp-definition.md))
