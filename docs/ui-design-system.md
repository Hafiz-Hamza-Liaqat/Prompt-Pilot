# UI Design System

**Project:** Prompt Pilot

Related documents: [Application Foundation](application-foundation.md) · [Implementation Checklist](implementation-checklist.md)

Phase 3 establishes the public UI design system and application shell.

---

## Technology

| Layer | Choice |
|---|---|
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (repository-owned source) |
| Primitives | Radix UI via unified `radix-ui` package |
| Icons | Lucide React |
| Theming | CSS variables (OKLCH) |
| Class composition | `cn()` in `src/lib/utils.ts` |

---

## Stability decision

**Radix was selected deliberately** as the shadcn base primitive library (`--base radix`).

- Do not mix Radix and Base UI primitives in the same project.
- Install new shadcn components through the existing `components.json` configuration.
- Generated UI files live in the repository as owned source code, not as opaque npm component packages.

---

## Design principles

- Clarity and scannable hierarchy
- Product honesty — no fake generation controls or media claims
- Accessibility — skip link, landmarks, focus visibility, semantic headings
- Consistent spacing via Tailwind utilities and layout components
- Semantic colour tokens — one indigo/violet brand family
- Responsive layouts without JavaScript navigation
- Minimal motion with `prefers-reduced-motion` respect
- Functional controls only — every link and button performs a real action

---

## Tokens

Semantic CSS variables in `src/app/globals.css`:

| Category | Examples |
|---|---|
| Surfaces | `background`, `foreground`, `card`, `surface-raised`, `surface-subtle` |
| Brand | `brand`, `brand-foreground`, `brand-muted` |
| Actions | `primary`, `secondary`, `accent`, `destructive` |
| Structure | `border`, `input`, `ring`, `radius` |
| Popovers | `popover`, `muted` |

Values use OKLCH. A `.dark` token block exists for future compatibility but no theme toggle is implemented.

---

## Installed shadcn components

Exactly these foundation components are installed:

- Button
- Badge
- Card
- Separator

---

## Layout components

| Component | Path | Purpose |
|---|---|---|
| PageContainer | `src/components/layout/page-container.tsx` | Responsive max-width wrapper |
| SiteHeader | `src/components/layout/site-header.tsx` | Brand, badge, in-page navigation |
| SiteFooter | `src/components/layout/site-footer.tsx` | Copyright and product honesty |
| SectionHeading | `src/components/layout/section-heading.tsx` | Reusable section titles |

---

## Accessibility baseline

- Skip link to `#main-content`
- Visible keyboard focus via `focus-visible` and ring tokens
- Semantic landmarks: `header`, `main`, `footer`, `nav`
- Ordered heading hierarchy on the landing page
- Sufficient contrast on brand and text tokens
- Reduced-motion protection in global CSS
- No empty links or placeholder `href="#"` navigation

---

## Current limitations

- No authentication or user accounts
- No dashboard or project workspace
- No theme toggle or dark-mode UI
- No forms, dialogs, drawers, or dropdowns
- No mobile drawer navigation
- No live AI provider connections
- No video or image generation

---

## Future component policy

Before adding any new shadcn component:

1. Confirm it belongs to an approved future phase.
2. Use the existing Radix base via `npx shadcn@latest add <component> -y`.
3. Review generated dependencies.
4. Add focused tests for any new product behavior.
5. Re-run lint, typecheck, tests, build, and audit review.
