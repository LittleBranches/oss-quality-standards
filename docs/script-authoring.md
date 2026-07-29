---
id: script-authoring
title: Script Authoring
sidebar_position: 15
---

# Script Authoring

Standards for any script shipped in a repository — build helpers, git automation, CI glue, and
scripts that back an agent skill. Covers **language choice first**, then the minimum standard for
each language.

These are minimums, not suggestions. A script that fails them does not merit review.

---

## 1. Language choice — decide before writing a line

Most script defects trace back to writing shell where a real language was needed. Decide
explicitly, and record the reason in the script header if the call was close.

There are two questions, and they must be asked in this order. Skipping the first is how a 300-line
shell script gets written; skipping the second is how a repo ends up carrying two runtimes.

### Step 1 — may this be shell?

Shell is permitted only when **every** one of these holds:

- Under **100 lines**
- Linear control flow — no nesting beyond one level of conditionals
- No data structures beyond strings and flat lists
- The script only **orchestrates other CLIs**; it contains no logic of its own
- Target is POSIX-only — **no Windows requirement**
- Output is read by a human

**If even one is false, shell is out.**

**When the call is genuinely close, shell loses.** A slightly verbose script in a real language
stays maintainable at 300 lines; a shell script does not.

### Step 2 — shell is out; the repository picks the language

This is a question about the **repository**, not about the script. The same 300-line task is a
TypeScript file in one repo and a Python file in another, and both are correct.

Write the script in the language the repository already builds in, invoked through the entry points
it already has. A Node/TypeScript repo writes `scripts/<name>.ts` behind an `npm run` script — see
§4. Introducing a second runtime into such a repo means a second toolchain, a second lint config, a
second CI install step and a second thing to keep current, and buys nothing the script needs.

**Use Python (§5) when** the repository has no runtime toolchain of its own — a docs repo, a
standards repo, a bare collection of Markdown — or when the script must run standalone outside any
project: in an agent sandbox, in CI before dependencies are installed, or on a machine that has not
been set up yet.

The test for "already builds in" is whether the script runs with **no new dependency**. A repo with
`tsx` and a test runner already installed is a TypeScript repo for this purpose. A repo whose
`package.json` exists only to publish releases is not.

### The 100-line rule

Google's shell style guide is unambiguous: rewrite scripts exceeding 100 lines in a structured
language _immediately_. Length is a proxy for the real problem — beyond ~100 lines a shell script
almost always has acquired data structures, error handling, or branching that shell expresses badly.

Do not negotiate with this by golfing the line count. If the logic needs 200 lines in any language,
it is not a shell script — which structured language it becomes is settled by Step 2.

### The "it's all subprocess calls anyway" counter-argument

The usual defence of a long shell script is that it only shells out to other tools, so a real
language would just add subprocess ceremony. This is a real cost and it is the strongest case for
shell — but it loses the moment a single Step 1 condition fails. Ceremony is cheap; an untestable
300-line shell script that breaks on Windows is not.

---

## 2. Never inline a script in Markdown

**Multi-line script code, in any language, belongs in a script file, never pasted into a `SKILL.md`,
`README.md`, or any other document.**

- Anything longer than a single command goes in `scripts/<name>.<ext>` beside the document.
  The document calls it and documents its arguments, output and exit codes.
- A single command may stay inline. A one-liner a developer reads and approves before running is
  documentation, not a script. Steps that check out, merge, push, publish or delete **should**
  stay inline as single commands, so each is approved individually rather than executed in a
  batch nobody inspected.
- **Never write `&&`-chained, backslash-continued blocks.** They are unreviewable and
  undebuggable: no line numbers, no way to run one step in isolation, and a failure anywhere
  silently kills the rest of the chain.
- **Never duplicate the same logic in two code blocks in one document.** If two sections need it,
  it is one script taking arguments. Duplicated blocks drift out of sync.

**Why:** a document that carries logic is simultaneously machine instructions and something a
human reviews and debugs. Inline chained blocks fail the human half completely.

---

## 3. Shell — minimum standard

Applies when §1 justified shell.

### 3.1 Header and invocation

```bash
#!/usr/bin/env bash
#
# <One line: what this does.>
#
# Usage:
#   name.sh [options] <arg>
#
# Exit codes:
#   0  success
#   1  bad usage
#   2  <domain-specific failure>
```

- Shebang is `#!/usr/bin/env bash`, not `#!/bin/bash` — `bash` is not at `/bin/bash` everywhere
  (notably Nix and some BSDs). Use `#!/bin/sh` only for genuinely POSIX scripts.
- Every script supports `--help`, printed from a heredoc. Never generate help with line-numbered
  `sed` on the script itself — it breaks the moment a line is added.
- Define `main()` and make `main "$@"` the last non-comment line.

### 3.2 Strict mode

```bash
set -euo pipefail
```

- `-e` exit on error · `-u` error on undefined variable · `-o pipefail` a pipeline fails if any
  stage fails, not just the last.
- **Do not override `IFS`.** Older "strict mode" advice recommended `IFS=$'\n\t'`; that guidance
  has since been withdrawn. It breaks the useful default behaviour of `"$*"` and `"${array[*]}"`,
  and it is unnecessary if you quote expansions — which you must do anyway.
- `pipefail` has a real pitfall: some pipelines legitimately expect a non-zero stage (`grep` finding
  nothing, `head` closing a pipe early). Handle those explicitly with `|| true` or by checking
  `PIPESTATUS` — do not disable `pipefail` for the whole script.
- When a command is _expected_ to fail, say so at the call site: `cmd || true`, or
  `if ! cmd; then`. Never leave a reader guessing whether a bare failure was intended.

### 3.3 Quoting and expansion

- Quote every expansion containing a variable, command substitution, space or metacharacter.
- Prefer `"${var}"` over `"$var"`.
- Pass arguments through as `"$@"` — never `$*`.
- Use arrays for command arguments rather than building a string.

### 3.4 Tests and arithmetic

- `[[ … ]]`, never `[ … ]` or `test`.
- `-z` / `-n` explicitly for empty / non-empty strings.
- `(( … ))` or `$(( … ))` for arithmetic — never `let` or `expr`.

### 3.5 Functions and scope

- Declare every function-local variable `local`.
- Separate declaration from assignment when the value comes from command substitution —
  `local out; out=$(cmd)` — because `local out=$(cmd)` swallows the exit status.
- **A function running in a subshell must signal failure through its exit code.** Setting a shared
  variable inside `( … )` or a pipeline does not propagate to the caller. This is the single most
  common silent bug in shell scripts that loop over items.
- lowercase_with_underscores for functions and variables; UPPERCASE for constants and exported
  environment variables, declared at the top.

### 3.6 Output and errors

- All error and diagnostic output goes to **STDERR**. Only the script's actual result goes to STDOUT,
  so the script stays pipeable.
- Check return values — either `if ! cmd; then` or an explicit `$?` check. For pipelines, read
  `PIPESTATUS` immediately.

### 3.7 Prohibited

- `eval`
- Aliases — use functions
- `shell=True`-style string interpolation of untrusted input into a command
- Piping into `while read` when the loop body must set variables visible afterwards — the loop
  runs in a subshell. Use process substitution `while read …; do … done < <(cmd)` or `readarray`.
- Reaching for `sed`/`awk`/`expr` where a bash builtin does the job

### 3.8 Formatting and linting

- Two-space indent, no tabs. Keep lines under 100 characters.
- `; then` and `; do` on the same line as `if` / `for` / `while`.
- **`shellcheck` must pass with no warnings.** This is not optional and is the single highest-value
  check available for shell. Wire it into the quality gate; if a warning is genuinely wrong,
  suppress it inline with a `# shellcheck disable=SCxxxx` comment _and a reason_.

---

## 4. TypeScript — minimum standard

Applies when §1 ruled out shell and the repository is already a Node/TypeScript project.

### 4.1 Location and invocation

A script is reached through the repo's own entry points, not by remembering a runner incantation:

```json
{
  "scripts": {
    "sync-branches": "tsx scripts/sync-branches.ts"
  }
}
```

- The script lives beside the repo's other scripts, in whatever folder that repo already uses.
- Every script gets an `npm run` entry. A script invoked only as `npx tsx scripts/thing.ts` is
  undiscoverable — `npm run` with no arguments is the index.
- Open with a block comment giving purpose, usage and exit codes, exactly as shell and Python do.

### 4.2 Arguments and help

- Parse with `parseArgs` from `node:util`, or the parser the repo already depends on. Do not hand-roll
  `process.argv` slicing, and do not add a CLI framework for one script.
- `--help` must work and must print from a single template literal, not be assembled from the file.

### 4.3 Exit codes

```ts
async function main(): Promise<number> { … }

main().then((code) => {
  process.exitCode = code;
});
```

- `main()` returns the exit code. Set `process.exitCode` rather than calling `process.exit()`, which
  truncates pending stdout writes and loses output.
- Never `process.exit()` from inside a helper.

### 4.4 Running other commands

- `execFile` or `spawn` from `node:child_process` with an **argument list**.
- **Never `exec` with an interpolated string** — it is the `shell=True` of Node: a command-injection
  vector, and it changes quoting rules.
- Await the result and inspect the exit code explicitly. A rejected promise you did not handle
  becomes an unhandled rejection, not a useful error message.

### 4.5 Types and structure

- No `any` on an exported signature. A script is code and gets the repo's type rules.
- Follow §T on type ownership — a script with a non-trivial shape puts it in a companion
  `<name>.types.ts`, the same as any other module.
- Errors and diagnostics to `process.stderr`; the script's result to stdout.

### 4.6 Structured output

As with Python — any script whose output is consumed by another program or an agent must offer a
`--json` mode. Text for humans, JSON for machines.

### 4.7 Linting

- The repo's **own** lint and typecheck must pass on the script. There is no separate standard: if
  the repo runs ESLint and `tsc`, the script is subject to both.
- A script excluded from the repo's `tsconfig.json` or lint globs is not covered by this section and
  should be brought into them.

---

## 5. Python — minimum standard

Applies when §1 selected Python — the repository has no runtime toolchain of its own, or the script
must run standalone.

### 5.1 Header and invocation

```python
#!/usr/bin/env python3
"""<One line: what this does.>

Usage:
    name.py [options] <arg>

Exit codes:
    0  success
    1  bad usage
    2  <domain-specific failure>
"""
```

- Use `argparse` — it provides `--help` for free and validates arguments. Never hand-roll
  `sys.argv` parsing.
- End with:

```python
if __name__ == "__main__":
    sys.exit(main())
```

`main()` returns an int exit code. Never call `sys.exit()` from deep inside helper functions.

### 5.2 Dependencies

- **Standard library only**, unless a third-party package is explicitly justified. A script that
  needs `pip install` before it runs is a script that will not run on someone else's machine, in
  CI, or inside an agent sandbox.
- Target the oldest Python 3 the team actually has installed. State it in the docstring if it
  matters.

### 5.3 Running other commands

- `subprocess.run([...], check=..., capture_output=True, text=True)` with an **argument list**.
- **Never `shell=True`.** It is a command-injection vector and changes quoting rules.
- Set `check=True` when a failure should abort, and handle `CalledProcessError`. When a non-zero
  exit is expected, use `check=False` and inspect `returncode` explicitly.

### 5.4 Structure and errors

- Type-hint every function signature.
- Errors and diagnostics to `sys.stderr`; the script's result to stdout.
- Never use a bare `except:` or a blanket `except Exception:` that swallows the error. Catch the
  specific exception and either handle it or re-raise.
- Return meaningful exit codes, documented in the docstring.

### 5.5 Structured output

Any script whose output is consumed by another program or an agent must offer a `--json` mode.
Text output for humans, JSON for machines. Parsing a program's human-readable text is a bug
waiting to happen.

### 5.6 Linting

- `ruff` must pass clean.
- `mypy` on anything over 100 lines.

---

## 6. Verification — before claiming a script works

**Run it.** Reading it is not verification, and neither is a successful syntax check.

- Exercise the **failure paths**, not just the happy path: missing file, missing dependency,
  malformed input, empty input, an item that fails mid-loop.
- Where the real environment is hard to reproduce, build a throwaway fixture that creates the
  interesting states, run against it, and delete it.
- Verify exit codes explicitly — a script that prints an error but exits `0` is broken, and this
  is not visible from the output alone.
- State in the PR what you ran and what it produced. "Should work" is not a test result.

---

## 7. Checklist

| #   | Check                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Language chosen against §1, not by habit                                                                                         |
| 2   | If not shell: it is the language the repo already builds in, not a second runtime                                                |
| 3   | Under 100 lines, or it is not shell                                                                                              |
| 4   | Lives in a script file — not inlined in Markdown                                                                                 |
| 5   | No `&&`-chained backslash-continued blocks anywhere                                                                              |
| 6   | Header comment: purpose, usage, exit codes                                                                                       |
| 7   | `--help` works                                                                                                                   |
| 8   | Shell: `set -euo pipefail`, no `IFS` override · TS: `npm run` entry, `process.exitCode` · Python: `argparse`, `sys.exit(main())` |
| 9   | Errors to stderr; result to stdout                                                                                               |
| 10  | Exit codes documented and correct                                                                                                |
| 11  | `shellcheck` / the repo's own lint + typecheck / `ruff` clean                                                                    |
| 12  | No `eval`, no `shell=True`, no `exec` with an interpolated string                                                                |
| 13  | Failure paths actually executed, not just the happy path                                                                         |

---

## Sources

- [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html) — the 100-line
  ceiling, quoting, `[[ ]]`, `local`, `main "$@"`, STDERR, ShellCheck, prohibitions.
- [Use Bash Strict Mode (Unless You Love Debugging)](http://redsymbol.net/articles/unofficial-bash-strict-mode/)
  — `set -euo pipefail` and its pitfalls.
- [Unofficial bash strict mode — revised guidance](https://gist.github.com/robin-a-meade/58d60124b88b60816e8349d1e3938615)
  — why the `IFS=$'\n\t'` recommendation was withdrawn.

---

_LittleBranches · MIT License_
