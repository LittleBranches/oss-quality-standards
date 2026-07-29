---
id: typescript-conventions
title: TypeScript Conventions
sidebar_position: 14
---

# §T — TypeScript Type Ownership

Applies to all LittleBranches TypeScript projects: `_scripts/lib/` modules, giselle-mui component layers, and any future TypeScript library or tooling project under the org.

---

## T.1 — Companion types file

Every TypeScript module that declares types owns them in a companion `<module>.types.ts` file co-located with the module:

```
lib/
  backfill-issue-ref.ts        ← implementation
  backfill-issue-ref.types.ts  ← types owned by this module
  backfill-issue-ref.test.ts   ← tests
```

For component-based projects (e.g. giselle-mui), each component folder follows the same shape — types live in `types.ts` alongside the component file:

```
stat/
  stat-card.tsx
  types.ts                     ← types owned by this component
  stat-card.test.ts
```

---

## T.2 — Promotion rule

When a type is imported by a **second** module, move it to the nearest shared `types.ts` one level up and update both importers:

```
lib/
  types.ts                     ← promoted: used by 2+ lib modules
  backfill-issue-ref.types.ts  ← local to backfill-issue-ref only
  github-to-asana.types.ts     ← local to github-to-asana only
```

Promotion is driven by **actual reuse** — not anticipated reuse. Do not pre-populate `lib/types.ts`; it grows only through promotion.

---

## T.3 — Entry points define no types

CLI entry-point files and top-level orchestrators import types — they never declare them:

```ts
// ✅ correct — entry point imports types, defines none
import type { BackfillTask, BackfillResult } from './lib/backfill-issue-ref.types';

// ❌ wrong — types defined inline in entry point
interface BackfillTask {
  gid: string;
  notes: string;
}
```

---

## T.4 — Enums follow T.1–T.3

Enums are not special — the same ownership and promotion rules apply. A module-owned enum lives in `<module>.types.ts` alongside its interface siblings and is promoted to the shared `types.ts` only on second use.

---

## Anti-patterns this standard prevents

| Anti-pattern                                         | Problem                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Dumping all types into a flat `lib/types.ts` upfront | Breaks ownership; makes it impossible to tell which module a type belongs to                |
| Defining interfaces inline in entry-point scripts    | Entry points become implicit type owners; types get duplicated when other modules need them |
| Duplicating the same interface in sibling modules    | Divergence over time; no single source of truth                                             |
| Pre-promoting types speculatively                    | `lib/types.ts` fills with unused types; harder to find the right file                       |
