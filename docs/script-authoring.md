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

### Use shell only when **every** one of these holds

- Under **100 lines**
- Linear control flow — no nesting beyond one level of conditionals
- No data structures beyond strings and flat lists
- The script only **orchestrates other CLIs**; it contains no logic of its own
- Target is POSIX-only — **no Windows requirement**
- Output is read by a human

### Use Python when **any** one of these holds

- Over **100 lines** — this is a hard ceiling, not a guideline
- Needs a dict, a nested structure, or real parsing
- Must emit structured output (JSON) for another program or an agent to consume
- Must run on Windows
- Needs tests
- Needs real error handling — retries, partial failure, cleanup on exit

**When the call is genuinely close, choose Python.** A slightly verbose Python script stays
maintainable at 300 lines; a shell script does not.

### The 100-line rule

Google's shell style guide is unambiguous: rewrite scripts exceeding 100 lines in a structured
language _immediately_. Length is a proxy for the real problem — beyond ~100 lines a shell script
almost always has acquired data structures, error handling, or branching that shell expresses badly.

Do not negotiate with this by golfing the line count. If the logic needs 200 lines in any language,
it is a Python script.

### The "it's all subprocess calls anyway" counter-argument

The usual defence of a long shell script is that it only shells out to other tools, so Python would
just add `subprocess.run` ceremony. This is a real cost and it is the strongest case for shell —
but it loses whenever any Python trigger above is met. Ceremony is cheap; an untestable
300-line shell script that breaks on Windows is not.

---

## 2. Never inline a script in Markdown

**Multi-line shell or Python belongs in a script file, never pasted into a `SKILL.md`, `README.md`,
or any other document.**

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

## 4. Python — minimum standard

Applies when §1 selected Python.

### 4.1 Header and invocation

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

### 4.2 Dependencies

- **Standard library only**, unless a third-party package is explicitly justified. A script that
  needs `pip install` before it runs is a script that will not run on someone else's machine, in
  CI, or inside an agent sandbox.
- Target the oldest Python 3 the team actually has installed. State it in the docstring if it
  matters.

### 4.3 Running other commands

- `subprocess.run([...], check=..., capture_output=True, text=True)` with an **argument list**.
- **Never `shell=True`.** It is a command-injection vector and changes quoting rules.
- Set `check=True` when a failure should abort, and handle `CalledProcessError`. When a non-zero
  exit is expected, use `check=False` and inspect `returncode` explicitly.

### 4.4 Structure and errors

- Type-hint every function signature.
- Errors and diagnostics to `sys.stderr`; the script's result to stdout.
- Never use a bare `except:` or a blanket `except Exception:` that swallows the error. Catch the
  specific exception and either handle it or re-raise.
- Return meaningful exit codes, documented in the docstring.

### 4.5 Structured output

Any script whose output is consumed by another program or an agent must offer a `--json` mode.
Text output for humans, JSON for machines. Parsing a program's human-readable text is a bug
waiting to happen.

### 4.6 Linting

- `ruff` must pass clean.
- `mypy` on anything over 100 lines.

---

## 5. Verification — before claiming a script works

**Run it.** Reading it is not verification, and neither is a successful syntax check.

- Exercise the **failure paths**, not just the happy path: missing file, missing dependency,
  malformed input, empty input, an item that fails mid-loop.
- Where the real environment is hard to reproduce, build a throwaway fixture that creates the
  interesting states, run against it, and delete it.
- Verify exit codes explicitly — a script that prints an error but exits `0` is broken, and this
  is not visible from the output alone.
- State in the PR what you ran and what it produced. "Should work" is not a test result.

---

## 6. Checklist

| #   | Check                                                                                  |
| --- | -------------------------------------------------------------------------------------- |
| 1   | Language chosen against §1, not by habit                                               |
| 2   | Under 100 lines, or it is Python                                                       |
| 3   | Lives in a script file — not inlined in Markdown                                       |
| 4   | No `&&`-chained backslash-continued blocks anywhere                                    |
| 5   | Header comment: purpose, usage, exit codes                                             |
| 6   | `--help` works                                                                         |
| 7   | Shell: `set -euo pipefail`, no `IFS` override · Python: `argparse`, `sys.exit(main())` |
| 8   | Errors to stderr; result to stdout                                                     |
| 9   | Exit codes documented and correct                                                      |
| 10  | `shellcheck` / `ruff` clean                                                            |
| 11  | No `eval`, no `shell=True`                                                             |
| 12  | Failure paths actually executed, not just the happy path                               |

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
