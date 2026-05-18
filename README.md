# OSS Quality Standards

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A **model-agnostic, central quality standards system** for all repositories under the
[LittleBranches](https://github.com/LittleBranches) GitHub organisation.

## Purpose

Eliminate repeat bootstrapping of reviewer instructions. One system, any AI model, all repos.

## Universal trigger

Paste this into any AI chat (Claude, Copilot, Grok, Gemini, …) to load all rules:

```
Load reviewer instructions from AGENTS.md in LittleBranches/oss-quality-standards
```

## What's included

| File/folder                        | Purpose                                              |
| ---------------------------------- | ---------------------------------------------------- |
| `AGENTS.md`                        | The barrel file — the only file any AI needs to load |
| `docs/`                            | Full Docusaurus documentation site                   |
| `scripts/quality-gate.js`          | Reusable quality gate runner                         |
| `scripts/check-structure.js`       | Component folder structure checker                   |
| `.github/pull_request_template.md` | PR description template                              |

## Documentation site

[https://littlebranches.github.io/oss-quality-standards](https://littlebranches.github.io/oss-quality-standards)

## Local development

```bash
npm install
npm start       # dev server at http://localhost:3000
npm run build   # production build
```

## Adding to a new repo

Create a pointer file at the root of the new repo:

```markdown
# AI Reviewer Instructions

Load: https://raw.githubusercontent.com/LittleBranches/oss-quality-standards/main/AGENTS.md
```

Or simply use the universal trigger phrase at the start of each AI session.

## License

MIT © Alex Rebula
