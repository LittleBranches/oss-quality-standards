---
id: component-api-contract
title: Component API Contract
sidebar_position: 10
---

# Component API Contract — Expanded Guide

> This page defines the mandatory API shape every LittleBranches component must expose. These rules ensure consumers can use any component predictably, without reading its internals.

---

## Props interface shape

Every component's props interface must:

1. Extend the MUI root component's props (or `React.HTMLAttributes` for non-MUI components)
2. Place custom props before the spread
3. Export the props type from the barrel `index.ts`

```ts
// ✅ correct
export interface MetricCardProps extends CardProps {
  value: number;
  label: string;
  trend?: 'up' | 'down' | 'flat';
}

// ❌ wrong — doesn't extend MUI props
export interface MetricCardProps {
  value: number;
}
```

The `sx` prop is inherited automatically when extending MUI component props. Do not redeclare it.

---

## `sx` array-safety rule

When forwarding the `sx` prop to an MUI component, always merge it using array syntax so consumers can chain multiple `sx` values:

```ts
// ✅ correct — sx from parent is merged, not overwritten
<Card sx={[{ p: 2 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other} />

// ❌ wrong — consumer's sx is silently dropped
<Card sx={{ p: 2, ...sx }} {...other} />
```

This is required on every component that exposes `sx`.

---

## `...other` passthrough

Every component must spread remaining props onto its root element. This forwards `data-*` attributes, event handlers, `aria-*` attributes, and any future MUI props the component doesn't know about.

```ts
export function MetricCard({ value, label, trend, sx, ...other }: MetricCardProps) {
  return (
    <Card sx={[{ p: 2 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
      ...
    </Card>
  );
}
```

Do not selectively forward only known props. If a prop is not used internally, it must pass through.

---

## No hardcoded colours

Components must never use hardcoded hex values, RGB values, or colour names. Use the MUI theme:

```ts
// ✅ correct
sx={{ color: 'text.primary', bgcolor: 'background.paper' }}

// ✅ correct — theme callback when you need token arithmetic
sx={(theme) => ({ borderColor: theme.palette.divider })}

// ❌ wrong
sx={{ color: '#1A2027', bgcolor: '#fff' }}
```

This ensures components work across light and dark mode without modification.

---

## ThemeProvider requirement

All LittleBranches components require MUI's `ThemeProvider` (with a custom theme) to be present in the React tree. Components must NOT wrap themselves in a `ThemeProvider` — that is the consumer's responsibility.

If a component has a theme dependency that is non-obvious, document it in the props JSDoc:

```ts
/**
 * Requires a custom MUI theme with `palette.brand` defined.
 * If the brand colour is absent, falls back to `primary.main`.
 */
export function BrandedCard(...) { ... }
```

---

## Icon slot convention

When a component accepts an icon, type it as `React.ReactNode`, not as a specific icon component type. This keeps the API open to any icon library.

```ts
export interface StatusLabelProps {
  /** Icon rendered before the label text. Any React node is accepted. */
  icon?: React.ReactNode;
  label: string;
}
```

Icons that are purely decorative (carry no meaning beyond visual reinforcement) must be wrapped with `aria-hidden="true"`:

```tsx
{icon && <span aria-hidden="true">{icon}</span>}
```

Icons that carry meaning (e.g. a visibility toggle, a close button) must have an accessible label on the interactive element, not on the icon itself.

---

## `color` prop convention

When a component accepts a `color` prop, it must use MUI palette keys — not CSS colour values:

```ts
// ✅ correct
color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

// ❌ wrong
color?: string;
```

Map the colour prop to the theme inside the component:

```ts
const paletteColor = theme.palette[color ?? 'primary'];
```

---

## No `React.FC`

Do not use `React.FC` or `React.FunctionComponent`. It adds nothing and historically included implicit `children` in all versions before React 18.

```ts
// ✅ correct
export function MetricCard({ value }: MetricCardProps) { ... }

// ❌ wrong
export const MetricCard: React.FC<MetricCardProps> = ({ value }) => { ... };
```

---

## No bare `<Box>`

`<Box>` is a layout primitive. Never render `<Box>` as a visible element with a semantic meaning. If a `<Box>` has `role`, `aria-*`, or meaningful visual styling, it should be a named component instead.

```tsx
// ✅ correct — Box as invisible layout container
<Box sx={{ display: 'flex', gap: 2 }}>
  <MetricCard ... />
  <MetricCard ... />
</Box>

// ❌ wrong — Box with semantic meaning
<Box role="status" sx={{ p: 2, bgcolor: 'success.light' }}>
  Saved
</Box>
// → Replace with a named component, e.g. <StatusBanner>
```

---

## `shouldForwardProp` on styled components

When using MUI's `styled()`, always add `shouldForwardProp` for any custom prop that must not reach the DOM:

```ts
const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({ active, theme }) => ({
  borderColor: active ? theme.palette.primary.main : theme.palette.divider,
}));
```

Without `shouldForwardProp`, React will emit an unknown-prop warning and the prop may appear as an HTML attribute on the DOM node.

---

## `displayName`

Set `displayName` on every component so React DevTools and error stack traces show a meaningful name:

```ts
MetricCard.displayName = 'MetricCard';
```

This is especially important for components returned from `forwardRef` or `memo`, where the inferred name may be lost.

---

## `ref` forwarding

Components that wrap a DOM element or a MUI component must forward refs using `React.forwardRef`:

```ts
export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  function MetricCard({ value, label, ...other }, ref) {
    return <Card ref={ref} {...other}>...</Card>;
  }
);

MetricCard.displayName = 'MetricCard';
```

Do not use `forwardRef` for components that have no DOM root to forward to (e.g. pure context providers).
