---
id: accessibility
title: Accessibility
sidebar_position: 11
---

# Accessibility — Expanded Guide

> All LittleBranches components target **WCAG 2.2 Level AA** compliance. This page covers the mandatory rules, common patterns, and how accessibility failures are handled in review.

---

## The baseline

Every component must:

- Be operable by keyboard alone (no mouse required for any action)
- Have sufficient colour contrast (4.5:1 for normal text, 3:1 for large text and UI components)
- Work with a screen reader (tested with NVDA or VoiceOver)
- Not cause seizures (no content flashing more than 3 times per second)

These are not optional. An accessibility gap found in a PR review is treated as a blocking issue — same severity as a security finding. See [AGENTS.md §4 Phase 2](./AGENTS.md#23--security-and-wcag-comments-are-always-valid).

---

## Keyboard interaction

### Keyboard-first principle

Design the keyboard interaction before the mouse interaction. If you cannot tab to every interactive element and activate it with Enter or Space, the component fails.

Mandatory keyboard bindings:

| Element type | Keys that must work |
|---|---|
| Button / link | `Tab` to focus, `Enter` or `Space` to activate |
| Select / combobox | `↑` / `↓` to navigate options, `Enter` to select, `Escape` to close |
| Dialog | `Tab` cycles within dialog, `Escape` closes |
| Tabs | `←` / `→` to switch tabs |
| Tooltip | `Escape` to dismiss |
| Menu | `↑` / `↓` to navigate, `Enter` to select, `Escape` to close |

### Focus trapping

Dialogs and drawers must trap focus while open. Focus must return to the trigger element when they close.

```tsx
// MUI Dialog handles this automatically.
// For custom overlays, use a focus-trap library (e.g. focus-trap-react).
```

### Focus rings

Focus indicators must be visible. Do not suppress the browser default focus ring with `outline: none` or `outline: 0` unless you replace it with a custom focus style of equal or greater visibility.

```ts
// ✅ correct — custom visible focus ring
'&:focus-visible': {
  outline: `2px solid ${theme.palette.primary.main}`,
  outlineOffset: 2,
}

// ❌ wrong — hides focus with no replacement
'&:focus': { outline: 'none' }
```

MUI components apply `:focus-visible` focus rings by default. Only override when the design requires a specific custom ring.

---

## ARIA semantics

### Use semantic HTML first

Native HTML elements carry implicit ARIA roles. Always prefer them over `<div>` + `role`:

| Need | Use this | Not this |
|---|---|---|
| A clickable button | `<button>` | `<div role="button">` |
| A navigation landmark | `<nav>` | `<div role="navigation">` |
| A list | `<ul>` / `<li>` | `<div role="list">` |
| A heading | `<h1>`–`<h6>` | `<div role="heading">` |

### Required ARIA attributes

| Pattern | Required attribute |
|---|---|
| Icon-only button | `aria-label` on the `<button>` |
| Loading indicator | `aria-busy="true"` on the container, `aria-live="polite"` |
| Error message | `aria-describedby` linking input to error |
| Progress bar | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Toggle button | `aria-pressed` (true/false) |
| Expandable region | `aria-expanded` on the trigger, `aria-controls` pointing to the region |

### Decorative vs informative icons

Decorative icons (visual reinforcement only — the adjacent text already conveys the meaning) must be hidden from screen readers:

```tsx
// ✅ correct — arrow icon next to "Next" label is decorative
<ArrowForwardIcon aria-hidden="true" />

// ✅ correct — icon-only button needs its own label
<IconButton aria-label="Close dialog">
  <CloseIcon aria-hidden="true" />
</IconButton>
```

Never put an `aria-label` on the icon itself inside a labelled button — the label on the button is sufficient and a label on the icon creates duplication.

---

## Visibility toggle (eye button) rule

Visibility toggle buttons (e.g. show/hide password) must:

1. Use a `<button>` (not a `<div>`)
2. Have `aria-label` that reflects the current state: `"Show password"` when hidden, `"Hide password"` when shown
3. Have `aria-pressed` set to reflect the current state
4. Not move focus when toggled (the input retains focus)

```tsx
<IconButton
  aria-label={visible ? 'Hide password' : 'Show password'}
  aria-pressed={visible}
  onClick={() => setVisible((v) => !v)}
>
  {visible ? <VisibilityOffIcon aria-hidden="true" /> : <VisibilityIcon aria-hidden="true" />}
</IconButton>
```

---

## Colour contrast

Use the MUI theme tokens — they are designed for contrast compliance. Do not introduce custom colours without verifying contrast ratios.

When custom colours are required, check them against WCAG 2.2 §1.4.3 (normal text: 4.5:1) and §1.4.11 (UI components: 3:1) using a contrast checker before committing.

Disabled states: WCAG permits lower contrast for disabled elements, but MUI's default disabled styling already handles this. Do not manually lower contrast on non-disabled elements.

---

## Motion and animation

Respect `prefers-reduced-motion`. Wrap animations in a media query or use MUI's `useReducedMotion`:

```ts
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

// Conditionally disable animation
const transition = prefersReducedMotion ? 'none' : 'opacity 0.3s ease';
```

---

## Testing accessibility

### Automated checks

Run [axe-core](https://github.com/dequelabs/axe-core) or `@testing-library/jest-dom` with `toBeAccessible()` as part of unit tests where feasible. Automated tools catch approximately 30–40% of accessibility issues.

### Manual checks

Before marking a component as complete:

- [ ] Tab through all interactive elements — confirm order is logical
- [ ] Activate every interactive element with keyboard only
- [ ] Verify focus ring is visible on every focused element
- [ ] Check colour contrast with browser DevTools or a contrast checker
- [ ] Enable macOS VoiceOver or Windows Narrator — navigate to the component
- [ ] Confirm no content is announced twice (icon + label duplication)
- [ ] Confirm decorative images and icons are not announced

---

## Review behaviour

Any PR review comment that cites a specific WCAG 2.2 criterion (e.g. "this fails 1.4.3 Contrast") or an ARIA spec reference is **always treated as valid**. There is no counter-argument that makes it not-valid. The fix happens in the batch commit. See [AGENTS.md §4.2.3](./AGENTS.md#23--security-and-wcag-comments-are-always-valid).
