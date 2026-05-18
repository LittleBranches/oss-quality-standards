# PR Review Workflow

> Last updated: 14 May 2026 (improvements integrated)
> Session trigger: `respond pr review <N>` — type this in any AI chat session to execute Phases 2–5 of this workflow for PR number `<N>`.

This document defines the end-to-end pull request workflow used across all repos in this
workspace (`giselle-mui`, `alexrebula`, `first-branch`, `giselle-sections-sdk`, `giselle-ui`).
It governs how Copilot prepares PRs, responds to Copilot reviewer threads, fixes valid issues,
and hands control back to the branch owner.

**Branch owner** = the human developer who guides Copilot (Alex). Copilot is never the
branch owner. Copilot does not merge, close, or resolve threads without explicit instruction.

---

## Phase 0 — Branch hygiene (before anything else)

### 0.1 — Every commit must belong to its branch category

Branch naming encodes the type of work:

| Prefix      | Category                                  |
| ----------- | ----------------------------------------- |
| `feature/`  | New functionality                         |
| `fix/`      | Bug fixes                                 |
| `chore/`    | Tooling, config, dependencies, docs       |
| `data/`     | Data-only changes (`tasks.json`)          |
| `refactor/` | Code restructure with no behaviour change |

**Rule:** every commit on a branch must be related to the branch's stated purpose. Commit
type (the conventional-commits prefix) does not need to match the branch prefix exactly —
a `feature/` branch will often legitimately carry `chore:` commits (barrel export updates,
tsup config changes, dependency additions required by the feature). What matters is whether
the commit is **related to the work the branch describes**.

A commit does not belong on a branch when it is **unrelated** to that branch's purpose:

- A `chore: bump eslint version` on a `feature/add-metric-card` branch — unrelated, move it.
- A `fix: correct aria-label on button` on a `chore/update-deps` branch — unrelated, move it.
- A `chore: add barrel export for MetricCard` on a `feature/add-metric-card` branch — related, keep it.

### 0.2 — Moving unrelated commits

If a commit does not belong on its current branch:

1. Identify the correct branch category for the commit.
2. Check whether a branch for that category already exists. If yes, cherry-pick onto it.
   If no, create a new branch from `main` and cherry-pick.
3. Drop the commit from the original branch via interactive rebase (`git rebase -i`).
4. Force-push the original branch (`git push --force-with-lease origin <branch>`) after rebase.
5. Push the new branch (`git push origin <new-branch>`).
6. **Never force-push a branch that already has an open PR** without first confirming with the
   branch owner — force-push rewrites history and invalidates outstanding review threads.

### 0.3 — Quality gate before PR

Run the full quality gate on the branch before asking for the green light:

```sh
npm run check:verify
```

All checks must be green: Prettier → ESLint → `tsc --noEmit` → Vitest → tsup build →
Storybook build (where applicable). A red quality gate is a blocker — do not request PR
creation and do not request a Copilot review.

---

## Phase 1 — PR creation

### 1.1 — Wait for the green light

**Do not create a PR until the branch owner explicitly approves it in the current session.**
"Green light" means a clear instruction such as: "create the PR", "open it", "go ahead".
A general instruction to finish a task does not constitute a green light for PR creation.

**Never use the GitHub UI to create a PR for this workflow.** Two hazards apply:

1. **"Compare & pull request" button** — pre-fills the description with the
   `.github/pull_request_template.md` structure but leaves every section empty. The branch
   owner would have to fill in the content manually, producing inconsistent PR descriptions.

2. **GitHub Copilot "generate description" button** (the Copilot icon inside the PR
   description WYSIWYG editor) — generates a free-form AI summary from the diff and
   **replaces the template entirely**. The section headings, checkboxes, and conventions
   defined in `pull_request_template.md` are discarded. There is no repo-level setting
   that prevents this button from overriding the template.

Both paths produce descriptions that do not match the required format. All PRs must be
created by Copilot in the VS Code chat via `gh pr create`, which fills every section with
actual content derived from the branch commits and conversation context. The GitHub UI is
not used for PR creation in this workflow — not even with the Copilot button.

### 1.2 — PR description conventions

Follow the template in `.github/pull_request_template.md` (present in all repos). Every PR must include:

- **What does this PR do?** — one paragraph, concrete deliverable
- **Why** — the reason the change is needed (links to roadmap entry, issue, or conversation context)
- **Type of change** — the matching checkbox from the template
- **Checklist** — all items ticked or explicitly marked N/A with a reason
- **Notes for reviewer** — anything non-obvious the reviewer should look at first

PR title format: `<type>(<scope>): <short description>` — mirrors the commit convention.

### 1.3 — Trigger a Copilot review

After the PR is created, check whether Copilot was already added as a reviewer automatically:

```sh
gh pr view <PR-number> --json reviewRequests --jq '.reviewRequests[].login'
```

If `github-copilot[bot]` appears in the output, the review was auto-requested — do nothing.

If it does **not** appear, trigger it manually via the GitHub UI:
**PR → "Reviewers" → "Request" → Copilot**

Do not attempt to trigger the review via the API — the reviewer endpoint for bot accounts
is unreliable and there is no supported CLI path for requesting a bot review.

Do not proceed to Phase 2 until the Copilot review has been submitted and threads are visible.

---

## Phase 2 — Copilot review response (one thread at a time)

### 2.1 — Gather all threads before responding

Before writing any response, collect the full list of open review threads:

```sh
gh api --paginate /repos/<owner>/<repo>/pulls/<PR-number>/comments --jq \
  '[.[] | {id, path, line, body: .body[0:120]}] | sort_by(.path, .line)'
```

Read every thread body in full. Do not respond to any thread before reading all of them —
context from a later thread can change whether an earlier comment is valid.

### 2.2 — Respond to every thread — no exceptions

Go through every thread in document order (file path → line number). For each one, post a
reply in the **same thread** (never a top-level PR comment) using the GitHub reply API:

```sh
gh api --method POST \
  /repos/<owner>/<repo>/pulls/comments/<comment-id>/replies \
  -f body="<response>"
```

Every response must:

1. State clearly whether the comment is **valid** or **not valid**.
2. Explain **why** in one to three sentences. Reference the relevant rule, invariant, or
   design decision. Do not just say "agree" or "disagree".
3. If the fix will be made: describe **what** will change and **where**.

**Valid comment response format:**

```
✅ Valid. [One sentence confirming the issue and why it matters.] Will fix in the batch
commit — [brief description of the fix].
```

**Not valid comment response format:**

```
❌ Not valid. [One sentence explaining why the concern does not apply here.] [Optional:
what the code is actually doing and why it is correct.]
```

**Partially valid comment format:**

```
⚠️ Partially valid. [The issue is real / the concern is right] but [the suggested fix
is wrong / the scope is narrower than described because ...]. Will fix [what is actually wrong].
```

### 2.3 — Security and WCAG comments are always treated as valid

Any comment from the Copilot reviewer that flags a potential security vulnerability
(OWASP Top 10, injection, auth bypass, exposed secrets) or a WCAG accessibility gap is
**always treated as valid** — do not push back on these unless you have a specific
technical reason the finding is a false positive, and even then, explain the reason
explicitly in the thread response.

### 2.4 — When Copilot cannot assess validity

If a thread's validity cannot be determined without business context (e.g. a comment about
whether a particular value is intentional or a mistake), do **not** make a judgment call.
Flag it explicitly:

```
⏸️ Needs branch owner input. [Describe exactly what context is missing and what the two
possible outcomes are.] Holding this fix until clarified.
```

Do not fix anything flagged with ⏸️ until the branch owner responds.

### 2.5 — Inline suggestions (GitHub "Suggested change" blocks)

The Copilot reviewer sometimes posts GitHub Suggested Change blocks — fenced diff suggestions
that can be applied with one click in the GitHub UI. These are not ordinary comments; they
propose a specific code change inline.

**Rule:** every suggested change block must be explicitly accepted or rejected in the thread.
Never silently ignore them.

- **Accept:** apply the suggestion via the GitHub UI (one click) or replicate the change
  manually in the local working tree. Either way, include the change in the fix batch commit
  — do not apply it as a separate commit.
- **Reject:** reply in the thread explaining why the suggestion is not correct, using the
  same ❌ / ⚠️ format as any other not-valid or partially-valid response.

Accepted suggestions that are applied via the GitHub UI create a commit directly on the branch.
If this happens, squash that commit into the fix batch commit before pushing — do not leave
an orphaned single-suggestion commit in the branch history.

### 2.6 — Deferred comments: valid but out of scope for this PR

Some valid reviewer comments flag work that cannot be done in the current PR — the change is
premature (stubs without implementations to validate against), out of scope (a different concern
than the branch's stated purpose), or blocked by another open PR. These must **not** be left as
unresolved thread replies — acknowledgement text in a comment gets lost when the PR closes.

**Rule: always open a GitHub Issue for deferred work, then link to it from the thread.**

**Step 1 — Open the issue:**

```sh
gh issue create \
  --title "feat/fix/chore: <concise description of the deferred work>" \
  --body "## Context\n\nDeferred from PR #<N>.\n\n[Why this cannot be done in this PR.]\n\n## Action\n\n[Concrete steps to complete the work when the time comes.]\n\n## Related\n\n- PR #<N>: <url>"
```

**Step 2 — Reply in the thread:**

```
⏭️ Valid but deferred. [One sentence explaining why this cannot be done in this PR.]
Tracked in #<issue-number>.
```

This keeps the PR thread self-documenting (one line, clickable issue reference) and moves
the full rationale to an Issue that is:

- **Searchable** and **linkable** from future PRs and roadmap entries.
- **Closeable** — closing the issue is the natural completion signal.
- **Visible in the backlog**, unlike acknowledgement text in a closed PR thread.

**Deferred ≠ dismissed.** Never use "deferred" to avoid a valid critique. If the deferred
work will genuinely never be done, use `❌ Won't fix` and explain why in the thread — do not
open a tracking issue for work you are intentionally rejecting.

---

## Phase 3 — Fixing valid comments (one batch)

### 3.1 — Fix all valid issues in a single commit

Once all threads have been responded to:

1. Collect every comment marked ✅ or ⚠️ (partially valid — fix the valid part).
2. Fix them all in a single working session.
3. Run the quality gate after all fixes are made — do not push before it is green.
4. Commit all fixes together in **one single commit**:

```sh
git add -A
git commit -m "fix: address PR #<N> Copilot review comments

- <file>: <what was fixed>
- <file>: <what was fixed>
..."
```

The commit message must list every fix. Reviewers should be able to verify each fix
from the commit message alone without reading a thread.

5. Push once:

```sh
git push origin <branch>
```

**Why one batch?** A single fix commit keeps the git history readable — one review, one
fix commit, clear before/after. Multiple small fix commits create noise and make it harder
to identify which commit introduced a regression.

### 3.2 — Follow-up reply on each fixed thread

After the push, reply to every thread that was fixed with a follow-up response:

```sh
gh api --method POST \
  /repos/<owner>/<repo>/pulls/comments/<comment-id>/replies \
  -f body="<follow-up>"
```

Follow-up format:

```
Fixed in <commit-SHA> — <one sentence describing exactly what changed and in which file/line>.
```

Include the short commit SHA (7 characters). The branch owner can click it to verify the diff.

---

## Edge cases

### Thread reply returns 404

If `POST .../pulls/comments/<id>/replies` returns a 404, do **not** silently fall back to a top-level PR comment. Stop and flag it to the branch owner first:

```
⚠️ Thread reply API returned 404 for comment <id> on <file>:<line>. This usually means the
comment belongs to an org where the reply endpoint is restricted, or the comment was deleted.
I cannot reply inline. Flagging here so you are aware — I will post a top-level PR comment
that references each thread explicitly, unless you prefer a different approach.
```

Only after flagging may you fall back to `gh pr comment`, and only if the branch owner does not object. The fallback comment must identify each thread by file and line so the branch owner can map responses back to the original findings.

### Thread has no line reference (top-level PR comment)

Top-level PR comments (not attached to a file line) still need a response. Reply directly on the PR:

```sh
gh pr comment <N> --body "<response>"
```

### Copilot review failed or was not submitted

If Copilot encountered an error and no review threads exist, note this to the branch owner and ask whether to re-request the review or proceed with a manual `review pr <N>` pass instead.

---

## Phase 4 — Post-fix state

### 4.1 — Leave threads UNRESOLVED

**Never resolve a review thread.** Copilot posted the follow-up; the branch owner reads it,
verifies the fix, and resolves the thread manually. This is non-negotiable:

- Resolving a thread marks it as "done" in GitHub's UI and collapses it from the default view.
- If Copilot resolves its own threads, the branch owner cannot quickly see what was fixed.
- Only the branch owner resolves threads — this is the final sign-off step.

### 4.2 — Re-requesting a Copilot review (optional)

After the fix batch is pushed, the branch owner may choose to re-request the Copilot review
to confirm the fixes are clean. Copilot does not re-request a review automatically.

### 4.3 — Updating the PR description (when needed)

If the fix batch changed the scope of the PR (added or removed functionality, changed what
a file does), update the "What does this PR do?" section of the PR description to reflect
the final state. Use:

```sh
gh pr edit <PR-number> --body "<updated body>"
```

---

## Phase 5 — Branch owner sign-off

The branch owner:

1. Reads all thread follow-ups.
2. Clicks through commit SHAs to verify each fix.
3. Resolves threads they are satisfied with.
4. Flags any thread where the fix is incorrect or incomplete — Copilot will respond and fix.
5. Approves and merges the PR (or instructs Copilot to merge — Copilot never merges unilaterally).

---

## Quick reference

```
Phase 0  → branch hygiene + quality gate (before green light)
Phase 1  → green light → create PR → trigger Copilot review
Phase 2  → read ALL threads → respond one-by-one (✅ / ❌ / ⚠️ / ⏸️ / ⏭️) → handle suggestion blocks → open Issues for deferred work
Phase 3  → fix all valid issues → quality gate → one batch commit → one push → follow-up replies (SHA)
Phase 4  → threads stay UNRESOLVED → update PR description if scope changed
Phase 5  → branch owner verifies, resolves, merges
```
