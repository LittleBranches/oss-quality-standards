# LittleBranches OSS Quality Standards — Claude Instructions

**At the start of every session, fetch and load all rules from AGENTS.md:**

```
https://raw.githubusercontent.com/LittleBranches/oss-quality-standards/main/docs/AGENTS.md
```

Read that file in full before responding to any task. It is the single source of truth for all quality rules, reviewer standards, and session commands.

---

## Session triggers

| Command                              | What to do                                                                                                                                                                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `review pr <N>` or `review pr <URL>` | You are the reviewer. Fetch the PR diff and all changed files, check against AGENTS.md §5–§12, then **submit findings via the GitHub reviews API** (inline comments on specific lines + overall verdict in the review body). Do not just report findings in chat. |
| `respond pr review <N>`              | You are the branch owner's assistant. Gather all open threads, triage each one (✅ / ❌ / ⚠️ / ⏸️), fix valid issues in one batch commit, post follow-up replies with the commit SHA.                                                                             |

---

## Tool overrides for Claude Code web sessions

Where AGENTS.md references `gh` CLI commands, use GitHub MCP tools instead:

| `gh` command                                   | MCP equivalent                                                               |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `gh pr view <N>`                               | `mcp__github__pull_request_read` (method: `get`)                             |
| `gh pr view <N> --json headRefOid`             | `mcp__github__pull_request_read` (method: `get`) — use `head.sha`            |
| `gh pr view <N> --json reviewRequests`         | `mcp__github__pull_request_read` (method: `get`) — use `requested_reviewers` |
| `gh pr diff <N>`                               | `mcp__github__pull_request_read` (method: `get_diff`)                        |
| `gh pr view <N> --json files`                  | `mcp__github__pull_request_read` (method: `get_files`)                       |
| `gh api --paginate /pulls/<N>/comments`        | `mcp__github__pull_request_read` (method: `get_review_comments`)             |
| `gh api POST ... /pulls/comments/<id>/replies` | `mcp__github__add_reply_to_pull_request_comment`                             |
| `gh pr edit <N>`                               | `mcp__github__update_pull_request`                                           |
| `gh issue create`                              | `mcp__github__issue_write`                                                   |
| `gh pr create`                                 | `mcp__github__create_pull_request`                                           |

If the `gh` CLI is available in the session, prefer it. Use MCP tools only when `gh` is absent.

### Posting a review with inline comments (MCP three-step process)

`mcp__github__pull_request_review_write` does not accept a `comments[]` array directly.
The `gh api POST .../reviews` call with inline comments must be split into three steps:

1. **Create a pending review** — `mcp__github__pull_request_review_write` (method: `create`, no `event`)
2. **Add each inline comment** — `mcp__github__add_comment_to_pending_review` (path, line, side, body) — one call per finding
3. **Submit** — `mcp__github__pull_request_review_write` (method: `submit_pending`, event: `COMMENT`, body: overall verdict + footnote)

Do not skip to step 3. Submitting without steps 1–2 produces a body-only review with no inline comments, forcing the findings into the main thread and requiring duplicate reviews to correct the omission.

---

## Scope reminder

AGENTS.md §1–§4 and §11 are framework-agnostic and apply to every LittleBranches repository.  
§5–§10 apply to React + MUI projects only.
