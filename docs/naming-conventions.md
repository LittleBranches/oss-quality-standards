---
id: naming-conventions
title: Naming Conventions
sidebar_position: 8
---

# Naming Conventions — Expanded Guide

> The baseline rules are in [AGENTS.md §5.4](./AGENTS.md#54--naming-conventions). This page covers the full rationale, suffix vocabulary, category patterns, and the 4-criterion test for naming a new component.

---

## The 4-criterion naming test

Before settling on a name, apply all four questions:

1. **Does the name describe what it renders, not what it does?** Components are nouns, not verbs. `MetricCard` ✅ — `ShowMetric` ❌.
2. **Does the name include the MUI base component it extends?** A card that shows a metric is a `MetricCard`, not a `Metric`.
3. **Is the suffix the most specific one that fits?** Prefer `Row` over `Strip` when the element is a true horizontal sequence. Prefer `Card` over `Surface`.
4. **Does it avoid a generic prefix?** Prohibited prefixes: `Base*`, `Custom*`, `Common*`, `Generic*`, `My*`, `New*`, `Advanced*`. These describe nothing — find the specific noun instead (`CardShell` not `BaseCard`, `StatCard` not `CustomCard`).

If any answer is "no", revise the name before writing a single line of code. Names that pass the gate now save rename churn later.

---

## Suffix vocabulary

| Suffix    | What it signals                                                   | Example                              |
| --------- | ----------------------------------------------------------------- | ------------------------------------ |
| `Card`    | A contained surface with elevation and a defined content region   | `MetricCard`, `AvatarCard`           |
| `Row`     | A horizontal sequence of related items                            | `HeroButtonsRow`, `ActionRow`        |
| `List`    | A vertical sequence with implicit ordering or repetition          | `FeatureList`, `NotificationList`    |
| `Table`   | Columnar data with headers                                        | `PricingTable`, `ComparisonTable`    |
| `Section` | A full-width, self-contained page section                         | `HeroSection`, `TestimonialsSection` |
| `Layout`  | A structural wrapper with no visible appearance                   | `PageLayout`, `SidebarLayout`        |
| `Label`   | A small inline element that annotates another element             | `StatusLabel`, `BadgeLabel`          |
| `Sheet`   | A panel or drawer-like surface anchored to an edge                | `FilterSheet`, `DetailSheet`         |
| `Strip`   | A thin, full-width horizontal band (less structured than a `Row`) | `AnnouncementStrip`, `PromoBanner`   |
| `Dialog`  | A modal overlay requiring user action                             | `ConfirmDialog`, `UploadDialog`      |
| `Drawer`  | A slide-in panel (non-modal or modal)                             | `NavigationDrawer`, `CartDrawer`     |
| `Form`    | A grouping of form controls with submit logic                     | `LoginForm`, `ProfileForm`           |
| `Field`   | A single form control + label + error                             | `EmailField`, `PasswordField`        |
| `Icon`    | An SVG icon wrapper                                               | `HomeIcon`, `ChevronIcon`            |
| `Avatar`  | A circular user or entity representation                          | `UserAvatar`, `TeamAvatar`           |
| `Chip`    | A small, pill-shaped label with optional action                   | `TagChip`, `FilterChip`              |
| `Tab`     | A single tab in a `Tabs` group                                    | `DashboardTab`, `SettingsTab`        |

Adding a new suffix requires a team decision — do not introduce ad-hoc suffixes. When in doubt, pick the closest existing one.

---

## Category-specific patterns

### `material/` components

Follow MUI's naming model: the suffix matches the underlying MUI component extended or composed.

```
material/surfaces/card/       → *Card
material/inputs/select/       → *Select, *Picker
material/navigation/tabs/     → *Tabs, *Tab
material/feedback/alert/      → *Alert, *Banner
```

### `sections/` components

Every sections component is a full-page-width block. The suffix is always `Section`.

```
sections/hero/hero-section/               → HeroSection
sections/testimonials/testimonials-section/ → TestimonialsSection
```

Exception: helper components that are not standalone sections use a more specific suffix (`HeroButtonsRow`, `HeroTagline`).

### `icons/` components

Icon components are named `<Concept>Icon` in PascalCase. The file is `<concept>-icon.tsx`.

### Hook naming

Custom hooks must start with `use-` (file) and `use` (export name):

```
use-disclosure.ts → export function useDisclosure
use-breakpoint.ts → export function useBreakpoint
```

---

## No-generic-prefix rule

These prefixes are banned because they say nothing about the component:

| Banned prefix | Why banned                      | Instead          |
| ------------- | ------------------------------- | ---------------- |
| `Base*`       | Everything is a base            | Name the concept |
| `Custom*`     | All components are custom       | Name the concept |
| `Common*`     | Vague — belongs to a layer      | Name the concept |
| `Generic*`    | Contradicts specificity goal    | Name the concept |
| `My*`         | Personal — not a library name   | Name the concept |
| `New*`        | Temporal — will be old tomorrow | Name the concept |
| `Advanced*`   | Marketing adjective             | Name the concept |

---

## Folder and file names vs export names

| Thing                    | Convention                   | Example                    |
| ------------------------ | ---------------------------- | -------------------------- |
| Component folder         | kebab-case                   | `metric-card/`             |
| Main component file      | `<name>.tsx`                 | `metric-card.tsx`          |
| Barrel                   | `index.ts`                   | `index.ts`                 |
| Exported React component | PascalCase                   | `MetricCard`               |
| Exported props type      | `<Name>Props`                | `MetricCardProps`          |
| Exported hook            | camelCase, starts with `use` | `useMetricCard`            |
| Exported constant        | SCREAMING_SNAKE_CASE         | `METRIC_CARD_DEFAULT_SIZE` |

---

## Component folder file naming

Every file inside a component folder uses the component's kebab-case name as a prefix, followed by a dot-separated suffix. The full list:

| File                  | Suffix                      | Notes                                                     |
| --------------------- | --------------------------- | --------------------------------------------------------- |
| Main component        | `<name>.tsx` or `<name>.ts` | `.ts` for non-JSX                                         |
| Barrel                | `index.ts`                  | Always present                                            |
| Unit tests            | `<name>.test.ts`            |                                                           |
| Styles                | `<name>.styles.ts`          |                                                           |
| Style tests           | `<name>.styles.test.ts`     |                                                           |
| Stories               | `<name>.stories.tsx`        |                                                           |
| Constants             | `<name>.const.ts`           | Not `.constants.ts`                                       |
| Defaults              | `<name>.defaults.tsx`       | `.tsx` (not `.ts`) because default values can include JSX |
| Utilities             | `<name>.utils.ts`           | Not `.utilities.ts`                                       |
| Animations            | `<name>.animations.ts`      |                                                           |
| Story-specific styles | `<name>.stories.styles.ts`  | Rare                                                      |

The `.defaults.tsx` extension is a common mistake — it must end in `.tsx`, not `.ts`, because default prop values frequently contain JSX (e.g. a default icon node or a default slot component).

---

## Casing rules at a glance

| Context                    | Case                 | Notes                                     |
| -------------------------- | -------------------- | ----------------------------------------- |
| Folder names               | kebab-case           | All lowercase, hyphens only               |
| File names                 | kebab-case           | Must match folder name for main component |
| React component identifier | PascalCase           |                                           |
| Props interface            | PascalCase           | Always ends in `Props`                    |
| Hook function              | camelCase            | Must start with `use`                     |
| Utility function           | camelCase            |                                           |
| Constant                   | SCREAMING_SNAKE_CASE | Module-level constants only               |
| CSS class (if used)        | kebab-case           |                                           |
| Storybook story name       | PascalCase           | Matches component name                    |

---

## Renaming a component

When a component is renamed, update all of these in one commit:

1. The folder name
2. The main file name (`<name>.tsx`)
3. All other files in the folder (`<name>.test.ts`, `<name>.styles.ts`, etc.)
4. The `export` identifiers inside those files
5. The barrel `index.ts` (the export names, not just the path)
6. Any imports in consuming files
7. The Storybook story title and component field
8. Any `displayName` set on the component

Use `git mv` for the folder rename so git tracks the history.

---

## Element-first handler naming

> The baseline rule is in [AGENTS.md §7.5](./AGENTS.md#75--element-first-handler-naming).

A function assigned directly to a JSX prop is named `<Element><Event>` — `Element` is the component or DOM node it's bound to, `Event` is the prop name with `on` dropped. A function bound to `MetricCard`'s `onExpand` prop is named `metricCardExpand`; a function bound to a row's `onClick` is named `rowClick`.

A `handle*`-prefixed or bare name (`handleExpand`, `handler`) tells you this is _a_ handler, not _which_ element it's bound to or what fires it. Reading `metricCardExpand` at its declaration and at its JSX call site both tell you the same thing without tracing the wiring back through the file.

### Shared core function vs. thin, element-first wrapper

A function used by more than one call site keeps a plain, non-element-prefixed name describing the business logic it performs (`toggleExpanded`, `dismissNotification`). Each call site that binds that shared function to a specific JSX prop gets its own thin, element-first wrapper:

```tsx
// shared core function — plain name, used by more than one caller
function toggleExpanded(key: string) {
  /* ... */
}

// call-site wrappers — thin, element-first
const cardExpandToggle = () => toggleExpanded(card.key);
const rowExpandToggle = () => toggleExpanded(row.key);
```

Do not element-prefix the shared function itself — that would make it read as belonging to whichever element happened to be renamed first, when it's actually shared logic.

### Documented exception: action-first naming for non-JSX-bound listeners

A callback with no single bound JSX element — most commonly a `document.addEventListener` or `window.addEventListener` callback — is named action-first instead, describing what it does when it fires. This is a deliberate, documented carve-out from element-first naming, not a violation of it: there is no single element to put first.

```tsx
// Named action-first (not element-first): this is a global document listener, not
// a callback bound to one specific JSX element/prop, so there's no single "element"
// to put first — a deliberate, named exception to element-first naming.
useEffect(() => {
  const collapseAllOnOutsideClick = () => setExpandedKey(null);
  document.addEventListener('click', collapseAllOnOutsideClick);
  return () => document.removeEventListener('click', collapseAllOnOutsideClick);
}, []);
```

Carry the same one-line comment (or equivalent) at the declaration whenever this exception is invoked, so a future reader doesn't mistake it for an inconsistency in the element-first rule.

---

## Inputs prop-bag naming

> The baseline rule is in [AGENTS.md §7.6](./AGENTS.md#76--inputs-prop-bag-naming).

A prop-bag type holding everything a row or item needs, computed once by its parent, is named `<Component>Inputs` — never `Ctx` or `Context`. Its prop on the receiving component is named `inputs`. Every local variable holding one of these objects is the exact camelCase of its type name, with no shortening, ever: a `MetricCardInputs` value is always a `metricCardInputs` variable, never `ctx`, `mci`, or `inputs` outside the destructured prop itself.

`ctx`/`Ctx` reads as React's own Context API to anyone skimming the file, when this is a plain, explicitly-threaded prop — no `Provider`, no `useContext`, no implicit distant coupling. `Inputs` removes that ambiguity, and the variable-name lockstep removes any per-file judgment call about how much to abbreviate.

```tsx
// types.ts
export interface MetricCardInputs {
  value: number;
  trend: 'up' | 'down' | 'flat';
  onExpand: () => void;
}

// parent.tsx
const metricCardInputs: MetricCardInputs = { value, trend, onExpand: cardExpandToggle };
<MetricCard inputs={metricCardInputs} />;

// metric-card.tsx
function MetricCard({ inputs }: { inputs: MetricCardInputs }) {
  /* ... */
}
```

### Measure-chain naming: one name at every layer

When a single concept crosses several component layers — a prop passed down, transformed, and passed down again — use the same name at every layer. Don't relabel it per hop. If a measurement callback is named `onMeasure` at the top of the chain, it stays `onMeasure` in every intermediate `Inputs` type it passes through, all the way down to the ref callback that finally uses it; only the local function bound to it at each call site is renamed per element-first naming (see above). This is the same principle as the `Inputs` variable-name lockstep, applied to a value that threads through more than one prop bag.
