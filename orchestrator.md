# Orchestrator — Master Runbook

Start here. This file guides the full agent pipeline from brief to deployed game.

---

## Prerequisites

- [ ] [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) installed
- [ ] `gh` CLI authenticated (`gh auth status`)
- [ ] Game repo forked from [maths-game-template](https://github.com/anandamarsh/maths-game-template)
- [ ] `specs/brief.md` written in the game repo

---

## Pipeline

### Step 1 — BA agent

**Goal:** Turn `specs/brief.md` into a full `specs/spec.md`.

```bash
cd maths-games-agent
claude --role roles/BA.md --context ../maths-game-[name]
```

Review `specs/spec.md` before proceeding. Edit if needed.

---

### Step 2 — Dev agent

**Goal:** Build the game in `src/` from `specs/spec.md`.

```bash
claude --role roles/DEV.md --context ../maths-game-[name]
```

The Dev agent will:
1. Read `specs/spec.md`
2. Scaffold game files in `src/`
3. Implement all mechanics described in the spec

---

### Step 3 — Tester agent

**Goal:** Write and run Playwright tests. Loop with Dev on failures.

```bash
claude --role roles/TEST.md --context ../maths-game-[name]
```

The Tester agent will:
1. Write tests in `tests/`
2. Run tests against the local dev server
3. Report failures back to the Dev agent
4. Loop until all tests pass

---

### Step 4 — UAT agent

**Goal:** Validate the game meets the teaching objective. Approve or reject.

```bash
claude --role roles/UAT.md --context ../maths-game-[name]
```

The UAT agent will:
1. Read `specs/brief.md` and `specs/spec.md`
2. Play through the game
3. Check all acceptance criteria
4. Output: **APPROVED** or **REJECTED** with feedback

---

## On rejection

If UAT rejects, return to Step 2 with the UAT feedback as additional context.

---

## Deploying

```bash
cd maths-game-[name]
vercel --prod
```

Then submit your Vercel URL to [Interactive Maths](https://interactive-maths.vercel.app).
