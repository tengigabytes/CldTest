# CLAUDE.md

This file provides guidance for AI assistants (Claude Code and similar tools) working in this repository.

## Repository Overview

**Repository:** `tengigabytes/MokyaLora_EMU`
**Description:** MokyaLora Digital Twin — browser-based PWA emulator for the MokyaLora LoRa/Meshtastic handheld device (RP2350 + ILI9341 + 6×6 Zhuyin keyboard).

## Repository State

The repository contains:
- `README.md` — project overview and quick start
- `CLAUDE.md` — this file (AI assistant guidance)
- `mokya-twin/` — browser PWA simulator (HTML/CSS/JS, no build step)
- `MokyaLora/` — firmware submodule (RP2350 C source, read-only reference)

**Stack:** Vanilla JS (ES modules), Canvas 2D, Web Serial API, Service Worker PWA. No bundler or transpiler — serves directly from the file system.

**Run locally:**
```bash
npx serve mokya-twin   # or: python3 -m http.server -d mokya-twin 8080
```

## Git Workflow

### Branch Naming

AI-generated feature branches follow the convention:

```
claude/<short-description>-<random-suffix>
```

Example: `claude/add-claude-documentation-CtwyZ`

### Commit Signing

Commits are signed using SSH keys. Do not bypass signing with `--no-gpg-sign` or similar flags.

### Push Convention

Always push with the upstream tracking flag:

```bash
git push -u origin <branch-name>
```

If a push fails due to a transient network error, retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s). Do not retry on permanent errors (authentication, permissions).

### Branch Scope

- Develop all changes on the designated feature branch
- Never push to `main` or `master` directly
- Do not create a pull request unless the user explicitly requests one

## GitHub Interactions

All GitHub interactions (issues, PRs, comments, file contents) must go through the MCP GitHub tools (`mcp__github__*`). Do not use `gh` CLI or direct API calls.

Repository scope is restricted to `tengigabytes/MokyaLora_EMU`. Do not interact with other repositories.

## Development Conventions

- **Language:** Vanilla JS (ES2022 modules), no TypeScript, no bundler
- **Dependency management:** No `package.json` runtime deps; `npx serve` is dev-only
- **How to run the app:** `npx serve mokya-twin` or `python3 -m http.server -d mokya-twin 8080`
- **How to run tests:** No automated tests yet (Phase 2 will add Jest/Vitest for MIE core)
- **Linting:** Not configured yet
- **Build process:** None — source files are served directly
- **Deployment:** GitHub Actions (`deploy.yml`) pushes `mokya-twin/` to GitHub Pages on every push to `main`

## General AI Assistant Guidelines

- Read files before modifying them
- Prefer editing existing files over creating new ones
- Do not add features, refactors, or cleanup beyond what was explicitly requested
- Do not add comments or docstrings to code you did not change
- Avoid introducing security vulnerabilities (injection, XSS, insecure defaults)
- Do not add error handling for scenarios that cannot occur
- Do not add backwards-compatibility shims or unused exports
- Keep changes minimal and scoped to the task at hand
- Confirm with the user before destructive or irreversible git operations (force push, reset --hard, branch deletion)
- Confirm before actions visible to others (pushing, opening PRs, posting comments)

## Updating This File

Keep this file current as the project evolves. Update it when:
- A language, framework, or build tool is adopted
- Test or lint commands change
- New conventions are established
- The project purpose changes significantly
