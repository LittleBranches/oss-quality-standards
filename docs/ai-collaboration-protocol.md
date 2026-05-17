---
id: ai-collaboration-protocol
title: AI Collaboration Protocol
sidebar_position: 3
---

# AI Collaboration Protocol — Expanded Guide

> The rules are in [AGENTS.md §1](./AGENTS.md#1-ai-collaboration-protocol). This page explains the reasoning behind each rule and how to handle gray areas.

---

## Why a protocol at all?

Without a protocol, the AI's permission boundary shifts every session. One session it asks before pushing; the next it pushes automatically because the previous session did. The protocol makes the boundary explicit, stable, and session-independent.

---

## The core principle: scope matches the request

Authorization stands for exactly what was asked — not beyond it.

| What was said | What is authorized | What is NOT authorized |
|---|---|---|
| "push this branch" | `git push origin <branch>` | force-push, push to main, push other branches |
| "commit the changes" | one commit of the current staged changes | amending, committing unrelated files |
| "create the PR" | `gh pr create` for this branch | merging, closing, tagging |

When in doubt, do less and ask. The cost of an unnecessary question is one message. The cost of an unwanted action (deleted branch, force-pushed history, unintended merge) can be hours of recovery work.

---

## Gray areas and how to handle them

### "Finish the task"

This is **not** a green light for committing, pushing, or creating a PR. "Finish" means complete the implementation. The branch owner decides when to commit and when to open a PR.

### "Clean this up while you're at it"

If the cleanup is directly related to the task (e.g. removing a `console.log` from a file you're already editing), it is in scope. If it's a separate file or a stylistic change unrelated to the task, it is out of scope — flag it instead:

```
I noticed X in <file> — want me to fix that separately or leave it?
```

### "Just push it"

This authorizes pushing the current branch. It does not authorize force-pushing, pushing to main, or pushing other branches that happen to be ahead of remote.

### Dependency updates discovered during a task

If a task requires adding a new dependency, list it before installing:

```
This feature needs `date-fns` (date formatting). OK to add it?
```

Do not run `npm install <package>` without listing the package and its purpose first.

---

## Why AI must never resolve its own threads

Thread resolution is the branch owner's sign-off mechanism. A resolved thread is a signal that the branch owner has read the fix, verified it, and approved it. If the AI resolves its own threads, that signal is lost — the branch owner can no longer quickly see what still needs verification.

This is different from *replying* to a thread, which the AI does freely. The distinction:

- **Reply** = AI communicates what it did
- **Resolve** = branch owner confirms it is correct

---

## Why `--no-verify` is forbidden

Pre-commit and pre-push hooks exist to catch problems before they reach remote. Skipping them to make a push succeed is treating the symptom (a failing hook) instead of the cause (a real problem in the code). The only legitimate reason to skip a hook is if the hook itself is broken — in which case the hook should be fixed, not bypassed.

If a hook fails unexpectedly during a review cycle, flag it to the branch owner before doing anything:

```
The pre-push hook is failing with: <error>. This looks unrelated to the current changes.
Want me to investigate the hook, or would you prefer to handle it?
```

---

## Applying the protocol across different AI models

This protocol is model-agnostic by design. Whether the AI is Claude, Copilot, Grok, or Gemini, the same rules apply. The branch owner does not need to re-explain the rules each session — loading AGENTS.md is sufficient.

One practical difference: some models are more proactive than others and may attempt commits or pushes without being asked. If a model does this, the branch owner should correct it and note that AGENTS.md §1.3 explicitly forbids it. The protocol is the authority, not the model's default behaviour.
