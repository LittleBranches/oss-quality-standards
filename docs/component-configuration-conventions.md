---
id: component-configuration-conventions
title: Component Configuration Conventions
sidebar_position: 17
---

# Component Configuration Conventions — Expanded Guide

> The baseline rules are in [AGENTS.md §16](./AGENTS.md#16-component-configuration-conventions). This page covers the full methodology for extracting inline configuration literals — Grid/layout props, motion `variants`/`animate`/`transition`/`style` objects, and single scalar/enum-token prop values — to named, explicitly-typed constants in a component's own configuration files (`<name>.const.ts` for Grid/layout and scalar props, `<name>.animations.ts` / `<name>.styles.ts` for motion — see each section below for exactly which).

**What counts as configuration, not content:** a configuration literal shapes _how_ a rendered element behaves or is laid out — a breakpoint object, an animation curve, a heading level. It is a different axis from the _content_ a component renders — copy, images, hrefs, lists of real data — which is covered by [§8.4](./AGENTS.md#84--demo-and-fixture-content-extraction) and [§15.3](./AGENTS.md#153--extracting-demo-and-fixture-data-to-a-dedicated-module) and is out of scope here. A prop passed a component reference rather than a literal (e.g. `component={m.div}`, pointing at an imported value) is exempt from every rule below too — there is no literal there to name.

This guide covers three shapes of the same underlying pattern, all converging on one shared requirement: [the extracted constant must be explicitly typed](#the-shared-explicit-typing-requirement), never left to bare inference.

---

## Grid and layout literal extraction

> The baseline rule is in [AGENTS.md §16.1](./AGENTS.md#161--grid-and-layout-literal-extraction).

**Rule:** an inline layout-shaping literal — a responsive breakpoint object, a spacing value — passed directly to a layout prop (`size`, `rowSpacing`, `columnSpacing`, `spacing`, or any other prop that shapes an element's position or dimensions rather than its content) must be extracted to a named constant in the component's own `<name>.const.ts`.

**Why:** a layout literal buried in JSX is invisible to a reviewer scanning for the component's tunable settings, can't be reused by a sibling that wants the same breakpoints, and gives no single place to see every layout knob a component exposes at a glance.

**Example:**

```tsx
// metric-card.tsx  ❌
<Grid size={{ xs: 12, md: 6, lg: 4 }} rowSpacing={{ xs: 2, md: 3 }}>
  <MetricSummary metric={metric} />
</Grid>
```

```ts
// metric-card.const.ts  ✅
import type { GridProps } from '@mui/material/Grid';

export const METRIC_CARD_GRID_SIZE: GridProps['size'] = { xs: 12, md: 6, lg: 4 };
export const METRIC_CARD_ROW_SPACING: GridProps['rowSpacing'] = { xs: 2, md: 3 };
```

```tsx
// metric-card.tsx  ✅
<Grid size={METRIC_CARD_GRID_SIZE} rowSpacing={METRIC_CARD_ROW_SPACING}>
  <MetricSummary metric={metric} />
</Grid>
```

This is a distinct axis from a component's `sx` prop (already zero-tolerance for inline objects, see [§6.2](./AGENTS.md#62--sx-array-safety) and [`component-api-contract.md`](./component-api-contract.md)) — layout props like `size`, `rowSpacing`, and `columnSpacing` aren't resolved through the `sx` theme resolver, so they need their own named constants in `<name>.const.ts` rather than folding into a `.styles.ts` export. The underlying principle — no inline object literal shaping layout in the component file — is identical.

---

## Motion configuration extraction

> The baseline rule is in [AGENTS.md §16.2](./AGENTS.md#162--motion-configuration-extraction).

Framer-motion-style `motion.*` elements carry several distinct configuration props — `variants`, `animate`, `transition`, and `style` — and each is held to its own threshold, not one blanket rule.

**`variants` — zero tolerance.** A `variants` object is always a named export, regardless of key count. Define it once with an explicit `Variants` type and reference it by name in JSX:

```ts
// callout-banner.animations.ts  ✅
import type { Variants } from 'framer-motion';

export const CALLOUT_BANNER_VARIANTS: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};
```

```tsx
// callout-banner.tsx  ✅
<motion.div variants={CALLOUT_BANNER_VARIANTS} initial="initial" animate="animate" exit="exit">
```

**`animate` / `transition` — a one-key/two-key threshold.** A single-key object may stay inline only if it is trivially obvious at a glance (e.g. `animate={{ opacity: 1 }}`). Two or more keys must be extracted to a named constant, the same way a `variants` object is:

```tsx
// ok inline — one trivially obvious key
<motion.span animate={{ backgroundPosition: '200% center' }} />
```

```tsx
// callout-banner.tsx  ❌ — two keys, left inline
<motion.div animate={{ opacity: 1, scale: 1.02 }} transition={{ duration: 0.3, ease: 'easeOut' }} />
```

```ts
// callout-banner.animations.ts  ✅
import type { TargetAndTransition, Transition } from 'framer-motion';

export const CALLOUT_BANNER_EMPHASIS_ANIMATE: TargetAndTransition = { opacity: 1, scale: 1.02 };
export const CALLOUT_BANNER_EMPHASIS_TRANSITION: Transition = { duration: 0.3, ease: 'easeOut' };
```

```tsx
// callout-banner.tsx  ✅
<motion.div
  animate={CALLOUT_BANNER_EMPHASIS_ANIMATE}
  transition={CALLOUT_BANNER_EMPHASIS_TRANSITION}
/>
```

**`style` on a `motion.*` element — zero tolerance, no inline object literal ever, regardless of property count.** `style` isn't resolved through MUI's `sx` theme resolver (a `MotionValue` can't resolve through it), so it needs its own named exports in `<name>.styles.ts` rather than folding into an `sx` export — but the underlying principle is identical to `sx`'s own zero-tolerance rule.

- A **static** `style` object is a module-level constant, same as a static `sx` object.
- A **`MotionValue`-based** `style` object is a factory function that accepts the `MotionValue` argument(s) and returns the style object — the factory is defined in `.styles.ts`; the call happens in JSX, identical to how a dynamic `sx` factory is already called in JSX:

```ts
// scroll-parallax-hero.styles.ts  ✅
import type { MotionValue } from 'framer-motion';

export const parallaxYStyle = (y: MotionValue<number>) => ({ y });
```

```tsx
// scroll-parallax-hero.tsx  ✅
<motion.div style={parallaxYStyle(y1)}>
```

This keeps every `style` object creation in one place, auditable and grep-findable, the same way `.styles.ts` already centralizes every `sx` object.

---

## Single scalar and enum-token prop extraction

> The baseline rule is in [AGENTS.md §16.3](./AGENTS.md#163--single-scalar-and-enum-token-prop-extraction).

**Rule:** a single hardcoded scalar or enum-token value handed straight to a prop — not only a multi-field object — is the same shape of violation as the Grid/layout and motion cases above, just smaller, and gets the same treatment: a named, explicitly-typed constant in the component's own `<name>.const.ts`.

**Example:**

```tsx
// section-heading.tsx  ❌
<SectionTitle titleComponent="h3" titleVariant="h3" />
```

```ts
// section-heading.const.ts  ✅
import type { SectionTitleProps } from './section-title';

export const SECTION_HEADING_COMPONENT: SectionTitleProps['titleComponent'] = 'h3';
export const SECTION_HEADING_VARIANT: SectionTitleProps['titleVariant'] = 'h3';
```

```tsx
// section-heading.tsx  ✅
<SectionTitle titleComponent={SECTION_HEADING_COMPONENT} titleVariant={SECTION_HEADING_VARIANT} />
```

A value doesn't have to be multi-field to qualify: a single hardcoded string, number, or boolean handed straight to a prop carries the same discoverability problem as a larger literal, just at a smaller scale — every tunable setting for a component belongs in one file a reader can scan, not scattered across individual JSX attributes.

**Why extract a single value at all, if it's only used once?** Naming it in `<name>.const.ts` makes every tunable setting for the component visible in one place, and it means the constant can later become a real, caller-overridable prop (with the extracted constant demoted to just its default value) without a rename.

This is not about `children` or any other content prop — see "What counts as configuration, not content" above for that boundary.

---

## The shared explicit-typing requirement

> The baseline rule is in [AGENTS.md §16](./AGENTS.md#16-component-configuration-conventions).

Every constant extracted under any of the three sections above — regardless of which file it lands in (`<name>.const.ts`, `<name>.animations.ts`, or `<name>.styles.ts`) — must carry an **explicit type annotation** naming the exact prop type it configures — never left to bare inference, even when the right-hand side is a call whose own return type already happens to match:

```ts
// ✅ explicit — the annotation names the exact prop type
const HERO_ENTRANCE_VARIANTS: Variants = fadeInFrom('bottom', { distance: 24 });

// ❌ inferred — typechecks today, but only because fadeInFrom happens to return Variants
const HERO_ENTRANCE_VARIANTS = fadeInFrom('bottom', { distance: 24 });
```

**Why this matters, in all three cases:**

1. **Inference alone only checks the value against the real prop type at its JSX usage site.** A copy-paste into the wrong prop, or a shape that's valid TypeScript but wrong for this specific prop, still typechecks at the declaration and only surfaces — if at all — somewhere else in the file. An explicit annotation catches the mismatch at the declaration itself.
2. **The constant becomes self-documenting.** A reader of the configuration file alone, without cross-referencing the component's JSX, can already see which prop's shape this value has to satisfy.
3. **A future editor shouldn't have to trace a helper function's own return type to learn what shape they're allowed to produce.** A call like `fadeInFrom(...)` returning the right type today is an implementation detail of that call, not something the next person editing the constant should need to go verify — the file's own annotation is the one place that answer lives, consistently, for every constant in it.

**Factory functions carry the annotation on their parameter, not a separate return-type or variable annotation.** The `MotionValue`-based `style` factory above (`parallaxYStyle`) is exempt from adding a redundant variable-level type: `(y: MotionValue<number>) => ({ y })` already names the exact type the factory accepts on its parameter, which is what determines the shape of the object it returns. There is no separate literal value being declared to annotate the way there is for `HERO_ENTRANCE_VARIANTS` above — the parameter's own type is the explicit annotation this rule asks for.

Name each extracted constant in `SCREAMING_SNAKE_CASE`, per the existing constant-casing convention ([§7.3](./AGENTS.md#73--casing-rules)) — this applies to every constant covered by this guide the same way it already applies to every other exported constant, regardless of which of the three configuration files it lives in.

---

## Related

- [AGENTS.md §6.2 — `sx` array-safety](./AGENTS.md#62--sx-array-safety) and [`component-api-contract.md`](./component-api-contract.md) — the equivalent zero-tolerance extraction rule for `sx`, which this guide's `style`-on-`motion.*` rule mirrors.
- [AGENTS.md §7.3 — Casing rules](./AGENTS.md#73--casing-rules) — the `SCREAMING_SNAKE_CASE` constant convention this guide's extracted constants follow.
- [AGENTS.md §8.4 — Demo and fixture content extraction](./AGENTS.md#84--demo-and-fixture-content-extraction) and [`component-refactor-conventions.md`](./component-refactor-conventions.md#extracting-demo-and-fixture-data-to-a-dedicated-module) — the content axis this guide's configuration axis is deliberately distinct from.
- [`component-structure.md`](./component-structure.md) — the folder-per-component layout and `<name>.const.ts` / `<name>.styles.ts` naming conventions this guide assumes are already in place.
