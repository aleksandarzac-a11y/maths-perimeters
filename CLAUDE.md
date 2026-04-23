# CLAUDE.md — Shared Agent Context

This file is loaded by all agents in the maths-games-agent framework.

## Framework overview

This is the **maths-games-agent** framework. It uses Claude Code Agent Teams to build interactive maths games from a teaching objective.

## Repo layout

```
maths-games-agent/      ← this repo (agent instructions)
maths-game-[name]/      ← game repo (code lives here)
    specs/brief.md      ← teaching objective (human-written)
    specs/spec.md       ← full game spec (BA agent output)
    src/                ← game source code (Dev agent output)
    tests/              ← Playwright tests (Tester agent output)
```

## Agent roles

| Agent | Role file | Responsibility |
|-------|-----------|----------------|
| BA | `roles/BA.md` | Turns brief into spec |
| Dev | `roles/DEV.md` | Builds game from spec |
| Tester | `roles/TEST.md` | Writes and runs Playwright tests |
| UAT | `roles/UAT.md` | Validates game meets teaching objective |

## Shared constraints

- All games target the [Interactive Maths](https://interactive-maths.vercel.app) platform
- Games are built with the [maths-game-template](https://github.com/anandamarsh/maths-game-template) as a base
- Age-appropriate design: clear UI, large tap targets, positive feedback
- Accessibility: keyboard navigable, screen-reader friendly where possible
- No external dependencies beyond what the template provides
