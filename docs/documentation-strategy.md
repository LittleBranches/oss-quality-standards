---
id: documentation-strategy
title: Documentation Strategy
sidebar_position: 9
---

# Documentation Strategy — Expanded Guide

> This page covers the three-tier documentation architecture, ownership rules, what belongs where, and the zero-personal-data rule.

---

## Three-tier architecture

Documentation lives at three levels. Each tier serves a different audience and must not duplicate the others.

```
Tier 1 — JSDoc (in .tsx / .ts files)
  └── Who reads it: TypeScript IntelliSense, API consumers
  └── What it contains: prop descriptions, usage contract, return types

Tier 2 — Story JSDoc (in .stories.tsx files)
  └── Who reads it: Storybook viewers, designers, QA
  └── What it contains: design decisions, variant rationale, interaction notes

Tier 3 — Docusaurus / README (in docs/ or README.md)
  └── Who reads it: first-time consumers, onboarding devs, external contributors
  └── What it contains: installation, setup, conceptual guides, migration paths
```

If information belongs in Tier 1, it must NOT be copy-pasted into Tier 3. The tiers do not repeat each other; they escalate depth.

---

## Tier 1 — JSDoc in source files

### What to document

Every exported component, hook, and utility must have a JSDoc block. Props interface members get `/** */` line-level comments.

```ts
/**
 * A surface card that displays a single numeric metric with a label and trend indicator.
 * Extends MUI Card; all Card props are forwarded.
 */
export function MetricCard({ value, label, trend, ...other }: MetricCardProps) { ... }

export interface MetricCardProps extends CardProps {
  /** The numeric value to display. Formatted by the component — pass a raw number. */
  value: number;
  /** Short human-readable label rendered below the value. */
  label: string;
  /** Optional trend direction. Renders a coloured arrow. */
  trend?: 'up' | 'down' | 'flat';
}
```

### What NOT to put in JSDoc

- Implementation details (how the component calculates things internally)
- Change history or "added in version X" notes (that's git history)
- Author names
- Task or ticket references ("added for issue #123")

### JSDoc rules for MUI component props

| Situation                           | Rule                                                 |
| ----------------------------------- | ---------------------------------------------------- |
| Prop inherited from MUI             | No JSDoc — never redeclare                           |
| Own prop, purpose obvious from name | No JSDoc                                             |
| Own prop, non-obvious behaviour     | One-line JSDoc max                                   |
| Own prop with a default value       | Add `@default value` tag                             |
| Own prop with a safety constraint   | Add the constraint in the JSDoc                      |
| Component function                  | One-sentence JSDoc explaining what problem it solves |

Never write multi-line JSDoc blocks. One line is almost always enough.
If an explanation takes more than one sentence, the component API is probably wrong.

---

## Tier 2 — Story JSDoc

Storybook stories use `parameters.docs.description` (component level) and story-level JSDoc to explain design decisions that are not obvious from the props alone.

```ts
// Component-level description (appears on Docs tab)
const meta: Meta<typeof MetricCard> = {
  component: MetricCard,
  parameters: {
    docs: {
      description: {
        component:
          'Use MetricCard in dashboard contexts where a single KPI needs visual prominence. ' +
          'For inline metric rows, prefer StatRow instead.',
      },
    },
  },
};

// Story-level description
/**
 * The `trend` prop only appears when a direction is explicitly provided.
 * Omit it (or pass `undefined`) when trend data is unavailable — the card
 * collapses the trend row rather than showing a neutral indicator.
 */
export const WithTrend: Story = { ... };
```

### What stories must NOT contain

- Real personal names (people, clients, employers) — use generic placeholders
- Real company names from current or past clients
- Real email addresses or phone numbers
- Real financial figures linked to a real entity

Use `Jane Doe`, `Acme Corp`, `42`, `hello@example.com` as stand-ins. This is the **zero-personal-data rule** — see below.

---

## Tier 3 — Docusaurus / README

### README.md

Every package in a monorepo must have a `README.md` that covers:

1. **What it is** — one sentence
2. **Install** — exact `npm install` command with peer deps
3. **Usage** — the simplest possible working import and usage snippet
4. **Subpath exports** — table of all available subpaths (if any)
5. **Development** — how to link locally (yalc workflow if applicable)

Do not put API documentation in the README. That belongs in JSDoc (Tier 1).

### Component folder READMEs

A component folder MAY have its own `README.md` when the component has non-obvious setup requirements (e.g. a required context provider, a peer dependency that must be installed separately, or a known accessibility constraint). These are rare. Most components do not need one.

### Docusaurus docs/

Docusaurus docs are for conceptual guides that span multiple components or address the library as a whole: architecture decisions, migration guides, theming guides, onboarding walkthroughs. They are NOT the right place for per-component API documentation.

---

## Ownership rules

| Tier            | Owned by                    | Reviewed in                        |
| --------------- | --------------------------- | ---------------------------------- |
| JSDoc           | Component author            | PR code review                     |
| Story JSDoc     | Component author + designer | PR code review + Storybook preview |
| README          | Repository maintainer       | PR code review                     |
| Docusaurus docs | Repository maintainer       | PR code review                     |

When a PR changes a component's public API (new or removed props, changed prop types), the author must update Tier 1 (JSDoc) in the same PR. Tier 3 updates are required only for breaking changes or significant new features visible to consumers.

---

## Zero-personal-data rule

Stories, tests, JSDoc `@example` blocks, and any documentation file must NEVER contain:

- Real names of people (colleagues, clients, users)
- Real names of employers, clients, or projects (current or past)
- Real email addresses, phone numbers, or other contact data
- Real financial figures tied to a real entity
- Screenshots that show real user data

**Safe placeholders:**

| Category       | Placeholder                             |
| -------------- | --------------------------------------- |
| Person name    | `Jane Doe`, `John Smith`, `Alex K.`     |
| Email          | `jane@example.com`, `hello@example.com` |
| Company        | `Acme Corp`, `Example Inc.`             |
| Currency value | `$1,234`, `€42.00`                      |
| User ID        | `user-001`, `usr_abc123`                |
| Phone          | `+1 555-000-0000`                       |

Violations found in a PR are treated as blocking — same severity as a security finding. They do not ship.

---

## Storybook conventions

### Story file structure

```ts
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './component-name';

const meta = {
  component: ComponentName,
  parameters: { ... },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { ... } };
```

### Required stories

Every component must have at least:

| Story                             | Purpose                                            |
| --------------------------------- | -------------------------------------------------- |
| `Default`                         | The minimal working state with only required props |
| One story per significant variant | Each variant documented in JSDoc must have a story |

Optional but encouraged:

| Story        | Purpose                                    |
| ------------ | ------------------------------------------ |
| `Playground` | All props exposed as controls              |
| `Edge cases` | Empty state, very long text, loading state |

### Story naming rules

- Story export names use PascalCase: `WithTrend`, `LoadingState`, `LongLabel`
- The Storybook title matches the folder path: `Material/Surfaces/Card/MetricCard`
- Do not prefix story names with the component name: `WithTrend` not `MetricCardWithTrend`

### Storybook title convention

The `title` in every `.stories.tsx` file must mirror the `src/components/` folder
path exactly, using `/` as the separator and title-casing each segment.

`src/components/material/surfaces/card/stat/` → `title: 'Material/Surfaces/Card/Stat'`

- Derive the title by reading the file path — never invent a title independently.
- If a `title` disagrees with its folder path, fix the `title`, never move the file.
- The folder path always wins over any verbal convention.
