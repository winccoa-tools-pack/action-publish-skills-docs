# action-publish-skills-docs

A reusable GitHub Action that converts APM [`SKILL.md`](https://microsoft.github.io/apm/) files into [Docusaurus](https://docusaurus.io/) documentation and publishes them to a target repository (e.g. a GitHub Pages site).

## What it does

1. Scans `.apm/skills/*/SKILL.md` in the calling repository
2. Strips APM frontmatter (`name:`, `description:`) and emits Docusaurus-compatible Markdown with proper `title`, `sidebar_label`, and `description` frontmatter
3. Writes a `_category_.json` for automatic sidebar grouping
4. Checks out the target repository and commits the generated docs there
5. A push to the target repo triggers its own deploy workflow (e.g. GitHub Pages)

## Usage

```yaml
# .github/workflows/publish-skills-docs.yml
name: Publish Skills Documentation

on:
  push:
    branches: [main]
    paths:
      - '.apm/skills/**'
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: winccoa-tools-pack/action-publish-skills-docs@main
        with:
          skills_dir: '.apm/skills'
          target_repo: 'winccoa-tools-pack/winccoa-tools-pack.github.io'
          target_docs_path: 'docs/skills/org'
          section_title: 'Org-Wide Skills'
          section_position: '10'
          github_token: ${{ secrets.DOCS_PUBLISH_TOKEN }}
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `skills_dir` | No | `.apm/skills` | Path to the `.apm/skills` directory |
| `target_repo` | Yes | — | Target repository (`owner/repo`) |
| `target_docs_path` | Yes | — | Path in the target repo where docs are written |
| `section_title` | Yes | — | Sidebar category label |
| `section_position` | No | `10` | Numeric sidebar position |
| `commit_message` | No | `chore(docs): update skills documentation [skip ci]` | Commit message |
| `github_token` | Yes | — | PAT with write access to `target_repo` |

## Required secret

Create a repository or org secret `DOCS_PUBLISH_TOKEN` — a classic PAT with `repo` scope (or a fine-grained PAT with **Contents: Read and write** on the target repo).

## SKILL.md format

Skills must have APM frontmatter followed by a Markdown body starting with an `# H1` heading:

```markdown
---
name: my-skill
description: Short one-line summary shown as the page meta description
---

# My Skill Title

Content in plain Markdown...
```

## Reusing in other repositories

Any repository with APM skills can publish to the central docs site by adding its own workflow and calling this action with different `target_docs_path` and `section_title` values.

**Example for `winccoa-cookbook`:**

```yaml
- uses: winccoa-tools-pack/action-publish-skills-docs@main
  with:
    skills_dir: '.apm/skills'
    target_repo: 'winccoa-tools-pack/winccoa-tools-pack.github.io'
    target_docs_path: 'docs/skills/cookbook'
    section_title: 'Cookbook Skills'
    section_position: '12'
    github_token: ${{ secrets.DOCS_PUBLISH_TOKEN }}
```

## Local testing

```bash
SKILLS_DIR=.apm/skills \
OUTPUT_DIR=/tmp/test-output \
SECTION_TITLE="Test Skills" \
SECTION_POSITION=1 \
node scripts/prepare-docs.js
```

---

<center>Made with ❤️ for and by the WinCC OA community</center>
