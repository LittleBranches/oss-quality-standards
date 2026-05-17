---
id: pr-review-workflow
title: PR Review Workflow
sidebar_position: 4
---

# PR Review Workflow — Expanded Guide

> The rules are in [AGENTS.md §4](./AGENTS.md#4-pr-review-workflow). This page explains the *why* behind each phase and covers edge cases and real examples.

---

## Why this workflow exists

Ad-hoc PR reviews produce inconsistent results. One session the AI addresses every thread; the next it resolves threads it shouldn't, or pushes multiple small fix commits that clutter the history. This workflow makes every PR review session identical regardless of which AI model is running it.

---

## Phase 1 — Why `gh pr create` and never the GitHub UI

The GitHub UI has two traps:

**Trap 1 — "Compare & pull request" button**
Pre-fills the description template but leaves every section blank. The branch owner ends up writing the description manually, which defeats the point of having a template.

**Trap 2 — Copilot "generate description" button**
Appears inside the GitHub PR WYSIWYG editor. It generates a free-form AI summary from the diff and silently replaces the template. Section headings, checkboxes, and conventions are gone. There is no repo-level setting that disables this button.

`gh pr create` sidesteps both traps by filling every section from conversation context before the PR is created.

---

## Phase 2 — Reading threads before responding

### Why read all threads first?

A later thread can invalidate an earlier one. Example:

- Thread A (line 12): "this value should be `null` by default"
- Thread B (line 47): "the function at line 12 is called with a non-null value in every code path"

If you respond to Thread A first and mark it valid, you've committed to a fix that Thread B makes unnecessary. Reading all threads first lets you see the full picture before writing a single response.

### Real response examples

**✅ Valid**
```
✅ Valid. The `useEffect` here has no dependency array, so it runs on every render —
this will cause an infinite loop when `onLoad` triggers a state update. Will fix in the
batch commit — add `[onLoad]` to the dependency array.
```

**❌ Not valid**
```
❌ Not valid. The `key` prop is on the wrapper `<li>`, not the child component, which
is the correct placement — React reconciles by the outermost element in a list. The
child doesn't need a key.
```

**⚠️ Partially valid**
```
⚠️ Partially valid. The concern about missing error handling is right, but the suggested
`try/catch` placement would swallow the error silently. Will fix by adding error handling
that surfaces the error to the caller instead of catching it here.
```

**⏸️ Needs branch owner input**
```
⏸️ Needs branch owner input. The reviewer flags that `retryCount` defaults to 3, but I
don't know if this is intentional (matches the API rate limit) or a mistake (should be 0
for fail-fast behaviour). Two outcomes: keep 3 (retry on transient failures) or change to
0 (let callers decide). Holding this fix until clarified.
```

---

## Phase 2 — Handling suggested change blocks

GitHub Suggested Change blocks look like this in the review:

```suggestion
const value = item?.value ?? defaultValue;
```

They are not ordinary comments — they propose a specific diff inline. Rules:

- **Never ignore them silently.** Even if you reject the suggestion, reply in the thread.
- **If you accept via UI:** the suggestion creates a standalone commit directly on the branch. Before pushing the fix batch, squash that commit in: `git rebase -i HEAD~2` → mark the suggestion commit as `fixup`. Then push once.
- **If you replicate manually:** apply the same change in your working tree, include it in the fix batch commit. Do not double-apply.

---

## Phase 3 — Why one batch commit

Multiple small fix commits make it hard to answer: "what was the state of the branch before the review?". One batch commit gives a clean before/after:

```
feature: add MetricCard component     ← the original work
fix: address PR #12 review comments  ← everything the review caught
```

A reviewer clicking through the history can see exactly what changed in response to feedback without hunting through five commits.

The commit message must list every fix by file so reviewers can verify without reading threads:

```
fix: address PR #12 review comments

- src/components/metric-card/metric-card.tsx: add useEffect dependency array
- src/components/metric-card/index.ts: remove unused re-export
- docs/metric-card/README.md: fix incorrect prop type in example
```

---

## Phase 4 — Why threads stay unresolved

Resolving a thread in GitHub collapses it from the default view and marks it as done. If the AI resolves its own threads, the branch owner has no visual list of what to verify — they would have to expand every resolved thread manually to check the follow-up replies. Leaving threads open gives the branch owner a ready-made review checklist.

---

## Edge cases

### The reviewer flagged something that was already fixed in a later commit

Reply in the thread explaining that the issue was already addressed and reference the commit SHA:

```
❌ Not valid in current state. This was fixed in a4f3c21 as part of an earlier cleanup
commit — the `varAlpha` reference is no longer present in this file.
```

### A thread has no line reference (top-level PR comment, not a line comment)

Top-level PR comments still need a response. Reply directly on the PR (not via the comment reply API):

```sh
gh pr comment <N> --body "<response>"
```

### The fix batch breaks the quality gate

Do not push. Fix the gate failure first, then push. If the gate failure is unrelated to the review fixes, flag it to the branch owner before pushing — do not silently fix unrelated issues in the review batch commit.

### The branch has diverged from main during the review cycle

Rebase onto main before pushing the fix batch:

```sh
git fetch origin
git rebase origin/main
npm run check:verify
git push --force-with-lease origin <branch>
```

Force-with-lease is safe here because the branch owner is aware the review cycle is in progress. Notify them that the rebase happened.
