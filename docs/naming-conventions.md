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

| Suffix | What it signals | Example |
|---|---|---|
| `Card` | A contained surface with elevation and a defined content region | `MetricCard`, `AvatarCard` |
| `Row` | A horizontal sequence of related items | `HeroButtonsRow`, `ActionRow` |
| `List` | A vertical sequence with implicit ordering or repetition | `FeatureList`, `NotificationList` |
| `Table` | Columnar data with headers | `PricingTable`, `ComparisonTable` |
| `Section` | A full-width, self-contained page section | `HeroSection`, `TestimonialsSection` |
| `Layout` | A structural wrapper with no visible appearance | `PageLayout`, `SidebarLayout` |
| `Label` | A small inline element that annotates another element | `StatusLabel`, `BadgeLabel` |
| `Sheet` | A panel or drawer-like surface anchored to an edge | `FilterSheet`, `DetailSheet` |
| `Strip` | A thin, full-width horizontal band (less structured than a `Row`) | `AnnouncementStrip`, `PromoBanner` |
| `Dialog` | A modal overlay requiring user action | `ConfirmDialog`, `UploadDialog` |
| `Drawer` | A slide-in panel (non-modal or modal) | `NavigationDrawer`, `CartDrawer` |
| `Form` | A grouping of form controls with submit logic | `LoginForm`, `ProfileForm` |
| `Field` | A single form control + label + error | `EmailField`, `PasswordField` |
| `Icon` | An SVG icon wrapper | `HomeIcon`, `ChevronIcon` |
| `Avatar` | A circular user or entity representation | `UserAvatar`, `TeamAvatar` |
| `Chip` | A small, pill-shaped label with optional action | `TagChip`, `FilterChip` |
| `Tab` | A single tab in a `Tabs` group | `DashboardTab`, `SettingsTab` |

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

| Banned prefix | Why banned | Instead |
|---|---|---|
| `Base*` | Everything is a base | Name the concept |
| `Custom*` | All components are custom | Name the concept |
| `Common*` | Vague — belongs to a layer | Name the concept |
| `Generic*` | Contradicts specificity goal | Name the concept |
| `My*` | Personal — not a library name | Name the concept |
| `New*` | Temporal — will be old tomorrow | Name the concept |
| `Advanced*` | Marketing adjective | Name the concept |

---

## Folder and file names vs export names

| Thing | Convention | Example |
|---|---|---|
| Component folder | kebab-case | `metric-card/` |
| Main component file | `<name>.tsx` | `metric-card.tsx` |
| Barrel | `index.ts` | `index.ts` |
| Exported React component | PascalCase | `MetricCard` |
| Exported props type | `<Name>Props` | `MetricCardProps` |
| Exported hook | camelCase, starts with `use` | `useMetricCard` |
| Exported constant | SCREAMING_SNAKE_CASE | `METRIC_CARD_DEFAULT_SIZE` |

---

## Component folder file naming

Every file inside a component folder uses the component's kebab-case name as a prefix, followed by a dot-separated suffix. The full list:

| File | Suffix | Notes |
|---|---|---|
| Main component | `<name>.tsx` or `<name>.ts` | `.ts` for non-JSX |
| Barrel | `index.ts` | Always present |
| Unit tests | `<name>.test.ts` | |
| Styles | `<name>.styles.ts` | |
| Style tests | `<name>.styles.test.ts` | |
| Stories | `<name>.stories.tsx` | |
| Constants | `<name>.const.ts` | Not `.constants.ts` |
| Defaults | `<name>.defaults.tsx` | `.tsx` (not `.ts`) because default values can include JSX |
| Utilities | `<name>.utils.ts` | Not `.utilities.ts` |
| Animations | `<name>.animations.ts` | |
| Story-specific styles | `<name>.stories.styles.ts` | Rare |

The `.defaults.tsx` extension is a common mistake — it must end in `.tsx`, not `.ts`, because default prop values frequently contain JSX (e.g. a default icon node or a default slot component).

---

## Casing rules at a glance

| Context | Case | Notes |
|---|---|---|
| Folder names | kebab-case | All lowercase, hyphens only |
| File names | kebab-case | Must match folder name for main component |
| React component identifier | PascalCase | |
| Props interface | PascalCase | Always ends in `Props` |
| Hook function | camelCase | Must start with `use` |
| Utility function | camelCase | |
| Constant | SCREAMING_SNAKE_CASE | Module-level constants only |
| CSS class (if used) | kebab-case | |
| Storybook story name | PascalCase | Matches component name |

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
