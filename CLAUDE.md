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
| `review pr <N>` or `review pr <URL>` | You are the reviewer. Fetch the PR diff and all changed files, check against AGENTS.md §5–§11, then **submit findings via the GitHub reviews API** (inline comments on specific lines + overall verdict in the review body). Do not just report findings in chat. |
| `respond pr review <N>`              | You are the branch owner's assistant. Gather all open threads, triage each one (✅ / ❌ / ⚠️ / ⏸️ / ⏭️), fix valid issues in one batch commit, post follow-up replies with the commit SHA.                                                                        |

---

## Tool overrides for Claude Code web sessions

Where AGENTS.md references `gh` CLI commands, use GitHub MCP tools instead:

| `gh` command                                   | MCP equivalent                                                   |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| `gh pr view <N>`                               | `mcp__github__pull_request_read` (method: `get`)                 |
| `gh pr diff <N>`                               | `mcp__github__pull_request_read` (method: `get_diff`)            |
| `gh pr view <N> --json files`                  | `mcp__github__pull_request_read` (method: `get_files`)           |
| `gh api ... /pulls/<N>/comments`               | `mcp__github__pull_request_read` (method: `get_review_comments`) |
| `gh api POST ... /pulls/<N>/reviews`           | `mcp__github__pull_request_review_write`                         |
| `gh api POST ... /pulls/comments/<id>/replies` | `mcp__github__add_reply_to_pull_request_comment`                 |
| `gh issue create`                              | `mcp__github__issue_write`                                       |
| `gh pr create`                                 | `mcp__github__create_pull_request`                               |

If the `gh` CLI is available in the session, prefer it. Use MCP tools only when `gh` is absent.

---

## Scope reminder

AGENTS.md §1–§4 and §11 are framework-agnostic and apply to every LittleBranches repository.  
§5–§10 apply to React + MUI projects only.
