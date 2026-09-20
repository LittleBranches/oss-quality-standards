---
id: component-structure
title: Component Structure
sidebar_position: 6
---

# Component Structure — Expanded Guide

> The rules are in [AGENTS.md §5](./AGENTS.md#5-component-structure-rules). This page covers the rationale, migration steps, and common mistakes.

---

## Deciding whether a component is standalone or a sub-component

> The rule is in [AGENTS.md §5.6](./AGENTS.md#56--standalone-vs-sub-component-test).

Before creating any folder, decide whether a component is **independently usable by a consumer**, or whether it **only makes sense inside one specific parent**. Get this wrong and the rest of this guide — folder depth, barrel exports, required companion files — targets the wrong scenario.

Use this table of signals:

| Signal                                                          | Role                                          |
| --------------------------------------------------------------- | --------------------------------------------- |
| Exported from the package's public barrel                       | Standalone — needs its own subfolder          |
| Marked "shipped" in a component inventory/tracking doc          | Standalone                                    |
| Marked "internal" in a component inventory/tracking doc         | Sub-component                                 |
| Lives inside a parent component's own subfolder                 | Sub-component — needs its own named subfolder |
| Only imported by one sibling file in the same folder            | Sub-component                                 |
| Has its own props type but is never consumed outside its folder | Sub-component                                 |

Don't skip this test. Confusing the two roles leads to the wrong folder structure and the wrong barrel exports for every step that follows.

### A second question: should a standalone component be exported from the public barrel?

Folder structure and barrel export are two separate decisions. A standalone component living in its own subfolder is not automatically exported from the package's top-level public barrel — it has to earn that.

Answer these four questions in order. Stop at the first "yes":

1. **Could a second project use this exactly as-is?** If another consuming app — present or future — would want to import this component directly, it belongs in the public barrel.
2. **Is it used in more than one place in the consuming app?** Multiple independent usages signal it encodes something reusable, not something app-specific.
3. **Is it already marked "shipped" or as a public entry point in the component inventory/tracking doc?** If so, the decision was already made — add it to the barrel. ("Internal" means the opposite: it was deliberately kept private.)
4. **Does it encode an accessibility or design rule that's non-trivial to get right?** Correct ARIA wiring, style-merge safety, minimum touch targets, alignment invariants — anything a developer would silently get wrong without this component.

If any answer is yes, export the component from the public barrel. If all four are no, keep it private: it's still exported from its own folder's `index.ts` (so the parent can import it cleanly), but it does not appear in the package's public barrel. A false export implies the component is independently useful when it isn't.

A sub-component should almost never be exported from the public barrel. The only exception is a sub-component that answers "yes" to all four questions above, and that a consumer would realistically import on its own. When in doubt, keep it private.

---

## Promotion trigger — wait for a second real caller

> The rule is in [AGENTS.md §5.7](./AGENTS.md#57--promotion-trigger).

When you extract a duplicated JSX pattern into its own component, resist promoting it up the component tree speculatively. Keep the extracted component at the narrowest level it actually serves until a **second concrete caller** actually appears somewhere else in the codebase.

Two signals make early promotion tempting, and both are wrong to act on:

- **The styles are specific to the current use case.** A second caller would need to override them to undo that specificity — net zero benefit today, and a false promise of reuse.
- **The logic is simple enough that any developer would write it correctly without help.** The rule underneath every component-library convention in this guide is that a component earns its place by saving other developers from rediscovering something non-obvious. A component with no non-obvious logic hasn't earned a shared home yet.

When a second caller does appear, that's the correct moment to rename the component for its wider scope, generalize any style props, promote it up the tree, and re-export it. Not before.

---

## Why one component per folder?

Three problems with flat component files:

**1. No obvious home for related files.** A flat `metric-card.tsx` has no natural place for its test, its story, or its CSS module. Each developer makes their own decision and the folder becomes inconsistent.

**2. Barrel maintenance breaks down.** With one folder per component, the layer's `index.ts` can use a predictable pattern to re-export everything. Flat files require manual additions to the barrel every time.

**3. Rename friction.** Renaming a component that lives in its own folder is one operation (rename the folder). Renaming a flat component requires updating four separate filenames scattered across the layer.

---

## What the folder looks like

```
metric-card/
├── metric-card.tsx              ← component source (required)
├── index.ts                     ← barrel export (required)
├── metric-card.test.ts          ← unit tests
├── metric-card.styles.ts        ← styles
├── metric-card.styles.test.ts   ← style tests
├── metric-card.stories.tsx      ← Storybook story
├── metric-card.const.ts         ← constants
├── metric-card.defaults.tsx     ← default prop values (with JSX)
├── metric-card.utils.ts         ← utilities
└── metric-card.animations.ts    ← animation definitions
```

Only `<name>.tsx` and `index.ts` are required. Add the others as the component grows.

---

## What the barrel export looks like

```ts
// metric-card/index.ts
export { MetricCard } from './metric-card';
export type { MetricCardProps } from './metric-card';
```

Consumers import from the folder, not from the internal file:

```ts
// ✅ correct
import { MetricCard } from '@littlebranches/giselle-mui/components/material/surfaces/card/metric-card';

// ❌ wrong — reaching into internals
import { MetricCard } from '.../metric-card/metric-card';
```

---

## Migrating a flat component

If you find a flat component that violates the rule (e.g. `src/components/material/surfaces/card/metric-card.tsx`):

1. Create the folder: `mkdir src/components/material/surfaces/card/metric-card`
2. Move the file: `git mv metric-card.tsx metric-card/metric-card.tsx`
3. Create `metric-card/index.ts` with the barrel export.
4. Update any imports in the codebase that referenced the old path.
5. Run the quality gate — the structure check should now pass, and TypeScript will catch any broken imports.

Do this in a dedicated `chore/` commit so the move is easy to identify in git history.

---

## File naming conventions

All files inside a component folder use the component's kebab-case name as a prefix, followed by a dot-separated suffix:

| File                  | Suffix                      | Notes                                   |
| --------------------- | --------------------------- | --------------------------------------- |
| Main component        | `<name>.tsx` or `<name>.ts` | `.ts` for non-JSX                       |
| Barrel                | `index.ts`                  | Always present                          |
| Unit tests            | `<name>.test.ts`            |                                         |
| Styles                | `<name>.styles.ts`          |                                         |
| Style tests           | `<name>.styles.test.ts`     |                                         |
| Stories               | `<name>.stories.tsx`        |                                         |
| Constants             | `<name>.const.ts`           | Not `.constants.ts`                     |
| Defaults              | `<name>.defaults.tsx`       | `.tsx` because defaults can include JSX |
| Utilities             | `<name>.utils.ts`           | Not `.utilities.ts`                     |
| Animations            | `<name>.animations.ts`      |                                         |
| Story-specific styles | `<name>.stories.styles.ts`  | Rare                                    |

---

## Common mistakes

| Mistake                                                            | Why it fails the structure check                     |
| ------------------------------------------------------------------ | ---------------------------------------------------- |
| `src/components/material/surfaces/metric-card.tsx`                 | Flat in a layer folder                               |
| `src/components/material/surfaces/card/MetricCard.tsx`             | PascalCase filename — must be kebab-case             |
| `src/components/material/surfaces/card/metric-card/MetricCard.tsx` | Main file must match folder name: `metric-card.tsx`  |
| `src/components/material/surfaces/card/metric-card/index.tsx`      | Main file must be `metric-card.tsx`, not `index.tsx` |

`index.tsx` (with JSX) is only permitted as a flat file at the layer level — not as the main component file inside a component folder.

---

## Allowed flat files — full reference

These are **never** flagged as violations, regardless of where they appear:

| Pattern                          | Purpose                                                   |
| -------------------------------- | --------------------------------------------------------- |
| `index.ts`                       | Barrel export for the layer or category                   |
| `index.tsx`                      | Barrel export with JSX (rare, e.g. a context provider)    |
| `types.ts`                       | Shared type definitions for the layer                     |
| `use-*.ts`                       | Shared hooks used across multiple components in the layer |
| `*.stories.tsx` (at layer level) | Cross-component Storybook stories                         |

---

## Scaffolding a new component

When adding a new component, create the full folder structure before writing any code:

```sh
mkdir -p src/components/<layer>/<category>/<name>
touch src/components/<layer>/<category>/<name>/<name>.tsx
touch src/components/<layer>/<category>/<name>/index.ts
```

Then add the barrel export to the category's `index.ts`:

```ts
export * from './<name>';
```

Running the structure check immediately after scaffolding confirms the new component is correctly placed before any code is written.
