---
id: component-refactor-conventions
title: Component Refactor Conventions
sidebar_position: 16
---

# Component Refactor Conventions — Expanded Guide

> The baseline rules are in [AGENTS.md §15](./AGENTS.md#15-component-refactor-conventions). This page covers the full methodology for decomposing tangled cascading logic and sequencing a multi-step refactor safely, once a component's folders, types, styles, and tests already exist (see [`docs/component-structure.md`](./component-structure.md)) but naming, decomposition, or data-extraction debt remains.

Use this guide when a component tree already has its sub-component folders, types, styles, and tests in place, but a review has surfaced untested inline cascade logic, a batched refactor pass with no verification checkpoints between steps, or demo/preview data hardcoded instead of sourced from a dedicated module. This is not a scaffolding guide — see [`docs/component-structure.md`](./component-structure.md) for building a component's folder structure from scratch.

---

## Decomposing cascading state-sync logic

> The baseline rule is in [AGENTS.md §15.1](./AGENTS.md#151--decomposing-cascading-state-sync-logic).

**Rule:** when a state update needs to cascade — a child toggle that may also flip its parent's done state, which may itself cascade further up — do not leave that cascade written inline inside the toggle callback. Split it into named, single-purpose functions that each own one direction of one sync step, and back each with pure, independently unit-tested derivation functions.

**Why:** a cascade left inline inside a callback tends to grow long, duplicates the "are all siblings done" check inline at more than one level, reaches for single-letter or generic key variables, and ends up with zero test coverage for the cascade logic itself — only for the callback's externally observable effects. Named sync steps and pure derivation functions can each be tested in isolation, independent of whatever framework renders the component.

**The pattern:**

1. **Named sync steps**, each doing one cascade direction, shared across every caller that needs it. A step reads the current state, derives whether the parent-level value should change, and — only if it actually changed — updates state and cascades one level further if needed.
2. **Pure, independently tested derivation functions**, extracted into a dedicated utilities module — no framework dependency, no rendering, just data in and a value out.
3. **Named state-key variables**, never a single letter or a generic name (`childDoneKey`, not `k`).

Extract the sync steps first, then extract the pure boolean/key-building checks those steps call into the utilities module, then add unit tests for the pure functions before wiring the sync steps back in.

**Worked example** (framework-agnostic; a two-level parent/child done-state cascade):

```ts
// One cascade step, shared by every caller that needs it
function syncParentDoneFromChildren(parentKey, childDoneMap) {
  const children = childrenOf(parentKey);
  if (children.length === 0) return;

  const allChildrenDone = resolveAllChildrenDone(children, childDoneMap, parentKey);
  const currentParentDone = parentDoneMap[parentKey] ?? false;
  if (allChildrenDone === currentParentDone) return;

  setParentDone(parentKey, allChildrenDone);
  // cascades one level further if this parent itself has a parent
  syncGrandparentDoneFromParents(parentKey, parentDoneMap);
}

// Pure, independently tested derivation functions — utils module, no framework dependency
function resolveAllChildrenDone(children, childDoneMap, parentKey) {
  return children.every(
    (child) => childDoneMap[makeChildStateKey(parentKey, child.index)] === true,
  );
}

function makeChildStateKey(parentKey, childIndex) {
  return `${parentKey}:${childIndex}`;
}
```

`syncParentDoneFromChildren` is called from the direct child-toggle handler and, one level further up, from whatever function syncs the next step of the cascade — the same named step, not two copies of the same `.every(...)` check.

**Applying this elsewhere:** look for (a) a toggle/update callback with more than one level of "if this changed, maybe update the parent too" nested inside it, (b) an inline `.every(...)`-style sibling-done check duplicated at more than one call site, and (c) a single-letter or generically-named key variable inside that logic. Any one of these three is a signal this pattern applies.

---

## Sequencing one group at a time

> The baseline rule is in [AGENTS.md §15.2](./AGENTS.md#152--sequencing-one-group-at-a-time).

**Rule:** apply these conventions to one component or tightly-coupled file group at a time — not batched across a whole component tree in one shot. Run the project's full quality gate after each step, and keep it green before moving to the next group.

**Why:** a batched, tree-wide naming/decomposition pass makes it much harder to isolate which change broke a test, a story, or a downstream import — and a broken intermediate state blocks anyone else from touching the same tree. One group at a time with a green gate between each step means every commit in the sequence is independently safe to stop at.

**What counts as one "group":** a component and its own sub-component folder(s) that are only ever consumed together. Don't split a single sub-component's rename across two steps, and don't fold two unrelated sub-component folders into one step just because they're both quick.

**What to re-verify at each step**, in addition to the quality gate itself:

- Every renamed identifier (handler name, prop-bag type, public prop name) traced through its full call chain, including every test file's mocks and fixtures — no test left referencing a name that no longer exists in the source.
- Components under test continue to mock only their immediate dependencies and pass plain, hand-built data — nothing about this pass should require introducing a new form of indirection (a context provider, a global singleton) as a side effect. If it does, that's a signal something in the pass went beyond a pure rename/decomposition.

**Layering:** this sequencing rule applies on top of, not instead of, whatever step-ordering a project's own structural-cleanup doc already specifies for work _within_ one component — see [`docs/component-structure.md`](./component-structure.md) in this repo. This rule sequences _across_ components and groups in a multi-component pass; a project's structural-cleanup doc sequences the steps _within_ one component.

---

## Extracting demo and fixture data to a dedicated module

> The baseline rule is in [AGENTS.md §15.3](./AGENTS.md#153--extracting-demo-and-fixture-data-to-a-dedicated-module). This repo already states a version of this rule for authoring new stories in [AGENTS.md §8.4](./AGENTS.md#84--demo-and-fixture-content-extraction), including the full structure and rationale — this section doesn't restate either; it applies the same principle as a signal to look for during a refactor pass over an _existing_ component, and adds the labeled examples below: a sibling-comparison detection method plus LittleBranches' own real-world implementation of the dedicated-module pattern.

**Rule:** a component's demo or fixture data — Storybook, preview, or whatever a project's equivalent is — lives in a dedicated factory-function module, never hardcoded inline in the story or demo file itself. See §8.4 for the full structure and rationale.

**Signal during a refactor:** a hardcoded content block sitting inside a story or demo file for a component you're otherwise cleaning up is itself a sign the pass isn't finished — extract it the same way §8.4 already requires for newly authored stories.

**Detection method — sibling comparison:** the clearest signal that a piece of content belongs in a dedicated module rarely comes from staring at the target component in isolation — it comes from comparing it against every sibling of similar shape (same layer, same category, the same role in a family of related components). If every sibling already sources the same _kind_ of content — a list, a single string, a media reference — from a dedicated module, and the target component hardcodes that same kind inline instead, the inconsistency itself is the signal to extract, regardless of how large or small the hardcoded value is. A large array of demo cards is the obvious case, but a single hardcoded heading or caption string is the same violation in miniature, and sibling comparison catches it the same way a "does this look like a big block of content" skim never would.

This refines, not contradicts, §8.4's "a single label is fine inline" default: that default is for a genuinely standalone single label with no established pattern among siblings. Once every sibling of the same shape already sources that kind of content from a dedicated module, staying consistent with the siblings takes priority over the size-based default for this component.

**Worked example — a single heading string, not a list:**

Four sibling card components in the same family — `pricing-card`, `feature-card`, `testimonial-card`, `metric-card` — each source their `title` from that card's own fixtures module:

```tsx
// pricing-card/pricing-card.stories.tsx
import { createPricingCardDemoData } from './__fixtures__/pricing-card.fixtures';

const demoData = createPricingCardDemoData();
<PricingCard title={demoData.title} />;
```

A fifth sibling, `testimonial-card`, hardcodes its heading directly in the story instead:

```tsx
// testimonial-card/testimonial-card.stories.tsx  ❌
<TestimonialCard title="What our customers say" />
```

Nothing about `"What our customers say"` looks like a violation on its own — it's a single short string, not a list, and would pass a skim that only flags large content blocks. Comparing `testimonial-card` against its four siblings is what surfaces the gap: every sibling of the same shape sources its heading from a dedicated fixtures module, and this one does not. The fix is the same as for list-shaped content — move the string into `testimonial-card/__fixtures__/testimonial-card.fixtures.ts` behind a `createTestimonialCardDemoData()` factory, and import it the same way the other four siblings already do.

**LittleBranches' own implementation of this pattern** uses a `sections-api/<component-name>/` domain and a companion `giselle-sections-sdk` package — a barrel of factory functions per component, kept separate from any one-off consumer-parity data file. This is our implementation of the general principle above, not a requirement of the principle itself; a project without either of those can satisfy the same rule with a single fixtures file per component, per §8.4's own example.

After extraction, spot-check every affected story or preview to confirm it renders exactly as before the data relocation — this is a pure data move, not a design change, so any visible diff is a bug in the extraction.

---

## Related

- [`docs/component-structure.md`](./component-structure.md) — the folder-structure and Definition of Done work this guide assumes is already in place.
- [`docs/naming-conventions.md`](./naming-conventions.md) — the identifier-naming rules (element-first handlers, `Inputs` prop-bags) this guide doesn't restate.
- [AGENTS.md §8.4](./AGENTS.md#84--demo-and-fixture-content-extraction) — this repo's existing rule on demo and fixture content extraction, which the third principle above applies during a refactor pass.
