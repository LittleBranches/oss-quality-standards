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

## Companion: AI Workflow Skills

This repo governs **how code is written** — structure, naming, testing, accessibility, API contracts.

It does not govern **how AI agents are used** — planning workflows, TDD loops, grilling sessions,
architecture reviews, and context building. That is a separate concern handled by agent skills.

A curated set of skills (slash commands for Claude Code and other agents) is maintained at
[AlexRebula/skills](https://github.com/AlexRebula/skills), a fork of
[mattpocock/skills](https://github.com/mattpocock/skills) by
[Matt Pocock](https://github.com/mattpocock). The fork adds giselle-mui-specific skills:

| Skill                       | What it does                                                           |
| --------------------------- | ---------------------------------------------------------------------- |
| `/create-giselle-component` | Scaffold + TDD a new component following oss-quality-standards rules   |
| `/audit-giselle-tests`      | Classify and fix AI-generated tests that use MUI mocking anti-patterns |

Install the skills into Claude Code:

```bash
npx skills@latest add AlexRebula/skills
```

Then run `/setup-matt-pocock-skills` once per repo to configure issue tracker and domain docs.

The two systems are designed to work together: quality standards set the bar; skills give
AI agents the workflow to consistently reach it.

## License

MIT © LittleBranches
