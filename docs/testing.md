---
id: testing
title: Testing
sidebar_position: 12
---

# Testing — Expanded Guide

> This page covers the test setup, mandatory patterns, style testing, coverage requirements, and what must NOT appear in test files.

---

## Test environment

All tests run with [Vitest](https://vitest.dev/) and [jsdom](https://github.com/jsdom/jsdom). The test environment is configured in `vite.config.ts` (or `vitest.config.ts`).

Test files live inside the component folder, co-located with the source:

```
metric-card/
├── metric-card.tsx
├── metric-card.test.ts       ← unit tests
├── metric-card.styles.ts
├── metric-card.styles.test.ts  ← style tests (separate file)
└── index.ts
```

---

## Unit test patterns

### Import style

Always import the component from its barrel (the folder), not from the internal file:

```ts
// ✅ correct
import { MetricCard } from './metric-card';

// ❌ wrong — reaching into internals
import { MetricCard } from './metric-card/metric-card';
```

### Testing without a full DOM renderer

For pure rendering tests (snapshot, structure), use `React.createElement` + `renderToStaticMarkup` from `react-dom/server`. This avoids a full React DOM render cycle and is faster for style/structure checks.

```ts
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MetricCard } from './metric-card';

it('renders the value and label', () => {
  const html = renderToStaticMarkup(
    React.createElement(MetricCard, { value: 42, label: 'Sessions' }),
  );
  expect(html).toContain('42');
  expect(html).toContain('Sessions');
});
```

Use `@testing-library/react` when you need user interaction, event handling, or state transitions.

### Testing interactions

Use `@testing-library/user-event` (not `fireEvent`) for simulating user interactions:

```ts
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordField } from './password-field';

it('toggles password visibility', async () => {
  render(<PasswordField label="Password" />);
  const input = screen.getByLabelText('Password');
  expect(input).toHaveAttribute('type', 'password');

  await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(input).toHaveAttribute('type', 'text');
});
```

---

## Style tests (`.styles.test.ts`)

Style tests verify that the style functions return the expected CSS-in-JS output. They run without jsdom and do not mount React.

The pattern: import the style function, call it with a mock theme, assert on the returned object.

```ts
// metric-card.styles.test.ts
import { metricCardStyles } from './metric-card.styles';
import { createTheme } from '@mui/material/styles';

const theme = createTheme();

it('applies correct padding', () => {
  const styles = metricCardStyles({ theme });
  expect(styles.padding).toBe(theme.spacing(2));
});

it('applies brand colour in active state', () => {
  const styles = metricCardStyles({ theme, active: true });
  expect(styles.borderColor).toBe(theme.palette.primary.main);
});
```

Style tests are required whenever a style function has conditional logic (theme-aware variants, boolean props that change appearance).

---

## What must NOT appear in tests

Same as the zero-personal-data rule for documentation:

- Real personal names
- Real company or client names
- Real email addresses, phone numbers
- Real financial values tied to a real entity

Use the same placeholders as in stories: `Jane Doe`, `Acme Corp`, `42`, `user-001`.

---

## Coverage requirements

The minimum acceptable coverage is **80% line coverage per file**. Coverage is measured by Vitest; the gate fails if it drops below the threshold.

Coverage is checked on:

- All `.tsx` and `.ts` files in `src/components/`
- All utility files (`*.utils.ts`)
- All style files (`*.styles.ts`)

Coverage is NOT required on:

- `*.stories.tsx` files
- `*.const.ts` files (constants have no logic to cover)
- `index.ts` barrel files
- `*.defaults.tsx` files

---

## Test naming conventions

Test descriptions must be readable as plain English. Use `it('verb phrase', ...)` form:

```ts
// ✅ correct
it('renders the label when provided');
it('hides the trend indicator when trend is undefined');
it('forwards ref to the root Card element');

// ❌ wrong
it('test1');
it('MetricCard');
it('should work correctly');
```

Nested `describe` blocks are fine for grouping by prop or behaviour, but do not nest more than two levels deep.

---

## Required test cases

Every component must have tests for:

| Scenario                                    | Why                                            |
| ------------------------------------------- | ---------------------------------------------- |
| Renders without crashing (smoke test)       | Catches import errors and fatal rendering bugs |
| Required props render expected output       | Verifies the core contract                     |
| Optional props: each variant changes output | Prevents silent regressions on variant props   |
| `...other` / `data-*` passthrough           | Confirms the API contract is upheld            |
| `ref` forwarding (if forwardRef is used)    | Confirms the ref reaches the DOM node          |

If a component has conditional rendering logic, each branch needs a test case.

---

## Running tests

```sh
npx vitest run             # run all tests once
npx vitest                 # watch mode
npx vitest run --coverage  # with coverage report
```

In CI, tests run as part of `npm run check:verify` (Step 4 of the quality gate). A failing test is a gate blocker.

---

## Mocking

### Mock external modules, not internal logic

Mock at the module boundary — never mock a function that lives in the same package.

```ts
// ✅ correct — mocking an external service
vi.mock('@littlebranches/giselle-mui/components/material/inputs/select/some-select', () => ({
  SomeSelect: () => null,
}));

// ❌ wrong — mocking an internal utility in the same package
vi.mock('./metric-card.utils', () => ({ formatValue: () => '0' }));
```

### No real network calls

Tests must not make real HTTP requests. Mock `fetch`, Axios, or any HTTP client at the module level.

---

## Vitest configuration reference

Key settings expected in `vitest.config.ts` (or `vite.config.ts`):

```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test-setup.ts'],
  coverage: {
    provider: 'v8',
    thresholds: { lines: 80 },
    exclude: ['**/*.stories.tsx', '**/*.const.ts', '**/index.ts', '**/*.defaults.tsx'],
  },
}
```

`test-setup.ts` should import `@testing-library/jest-dom/vitest` to add the custom matchers.
