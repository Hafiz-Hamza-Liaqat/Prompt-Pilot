# Provider Catalogue

## Scope

Prompt Pilot Phase 7 introduces a read-only, source-backed catalogue for five approved AI video providers:

- Google Veo
- OpenAI Sora
- Runway
- Kling
- Adobe Firefly

The catalogue separates **providers** from **offerings**. Offerings may be models, model families, API services, or platform services. Each offering records whether it is **first-party** or **third-party hosted**.

Capability facts are stored with explicit evidence, lifecycle status, API-access status, verification dates, and review due dates. The catalogue is a snapshot — not a live synchronization with provider APIs.

## Official-source policy

- Only official developer documentation, API references, help centers, release notes, model docs, and pricing pages (when needed for access verification) are permitted.
- Blogs, aggregators, social posts, and unofficial mirrors are excluded.
- Every supported, limited, or unsupported fact links to an official source.
- Missing evidence is recorded as **unknown**, not **unsupported**.
- Facts are reviewed on a default **30-day** interval.

## Current taxonomy considerations

- Google’s official Gemini API video documentation distinguishes **Veo** from **Gemini Omni Flash** video generation. Prompt Pilot records Google Veo as one catalogue provider; other Google video models are out of Phase 7 scope.
- Runway and similar platforms may expose hosted third-party models. Platform access does not transfer model ownership; Runway-owned offerings are marked `first_party` only.
- Adobe Firefly Services documents multiple video-related **services** rather than a single universal model identifier.
- Sunsetting offerings (such as OpenAI Sora API) remain visible but are not normal recommendation candidates.

## Security

- Public `SELECT` only for `anon` and `authenticated` roles.
- No public or authenticated catalogue writes.
- No service-role application path for catalogue reads.
- No provider API keys, runtime provider calls, or runtime source scraping.

## Workspace integration (Phase 9)

The hybrid result workspace displays five catalogue references in alphabetical order without brief-specific evaluation, ranking, or recommendation. Deterministic scene timing is calculated separately from the completed brief duration and does not use provider catalogue data.

## Deferred work

- Provider recommendation engine
- Risk, pricing, and match scoring
- Automated source refresh
- Provider credentials and execution
- Admin catalogue editing
- Cloud deployment
