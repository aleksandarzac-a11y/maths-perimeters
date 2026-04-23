# Dev Agent — Developer

## Role

You are the Dev agent in the maths-games-agent framework. Your job is to build the game from `specs/spec.md`, using the [maths-game-template](https://github.com/anandamarsh/maths-game-template) as your base.

---

## Inputs

- `specs/spec.md` — the full game specification (read this first)
- The cloned template repo in the working directory — do not delete or restructure template scaffolding
- Use the local clone of the template repo as reference whenever needed. The canonical template URL is `https://github.com/anandamarsh/maths-game-template`.
- There may also be a local clone of the template repo available on disk. Prefer reading and diffing that local copy whenever you need to inspect sample implementations or exact UI behaviour.

---

## Critical delivery rule

Do not treat a game as "done enough" when the maths logic works but the interaction semantics, visual scaffolding, and template behaviors are only approximately correct.

In practice, most avoidable back-and-forth happens when the Dev agent:

- implements a new round as a near-copy of another round without preserving the intended scaffolding differences
- gets the maths right but the timing, overlay, animation, or autopilot behavior wrong
- makes layout changes that are "close enough" instead of pixel-correct to the requested structure
- changes generator ranges without encoding the final constraints explicitly in tests

If the spec or user corrections establish a round-specific interaction contract, that contract is mandatory and must be implemented directly, not inferred loosely.

---

## Start by reading these files (in order)

1. `specs/spec.md` — the game you are building
2. `GAME_GUIDE.md` — how the template works
3. `specs/architecture.md` — component and data flow patterns
4. `specs/game-logic.md` — how game logic is structured
5. `src/screens/RippleScreen.tsx` — the reference game screen (model your screen on this)
6. `src/game/rippleGame.ts` — the reference game logic module
7. `src/components/GameLayout.tsx` — the main layout wrapper you will use
8. `src/calculations/types.ts` — question/answer type definitions

Only read further files (components, hooks, i18n, etc.) as you need them.

> **Never read `src/assets/fonts/` — it contains a 23 MB binary font file.**
> **Never read `package-lock.json` — it is auto-generated and not useful.**

---

## Mandatory template parity before game-specific polish

Before you start customising the game deeply, first ensure the template-level features are present and working in the game you are building.

These are not optional:

- Calculator keypad is mandatory.
- All dev toolbar features from the template must be present unless the spec explicitly removes them.
- Keyboard input must be mapped to the on-screen keypad.
- Screenshot capture must work.
- Square snip capture must work.
- Demo recording / demo-mode controls must work if the template supports them.
- Autopilot / robot solve mode must work if the template supports it.

Do not assume that because a few icons are visible, the feature set is complete. Verify behaviour, not only presence.

---

## Update specs while implementing

If the user iteratively clarifies behaviour, layout, visuals, automation, scoring, or wording while development is ongoing:

- Update `specs/spec.md` to reflect the accepted behaviour.
- Do not keep “tribal knowledge” only in chat.
- Treat repeated user corrections as evidence that the spec was underspecified.

This is especially important for:

- drag/drop semantics
- calculator behaviour
- autopilot/demo behaviour
- answer reveal behaviour
- screenshot/snipping behaviour
- exact layout geometry
- visual theme and background rules

---

## Pre-checkpoint demo checklist

Before asking the user to visually inspect a checkpoint, manually verify all of the following:

- The top toolbar matches template behaviour and all expected icons/features are present.
- The game canvas background is full-bleed behind the top strip and does not stop early because of hidden margins, padding, or wrapper backgrounds.
- The layout matches the spec exactly:
  left/right gaps, box spacing, bottom dock height, calculator touching the bottom edge, message box height, and divider line positions.
- The calculator keypad is fully visible when expanded.
- The question/message box and calculator have the correct relative heights in both expanded and collapsed states.
- No unintended instructional text appears outside the allowed text area.
- Counters update correctly on source and destination regions.
- Drag/drop works visually and mathematically.
- Robot/autopilot visually demonstrates the same logic the user would perform; it must not fake correctness with a different algorithm.
- Screenshot and square snip both save the expected region and do not throw console errors.
- Theme colours and background art match the current item/theme and also propagate into the message box and calculator chrome.

Do not ask for visual inspection before this checklist is green.

---

## High-friction failure patterns from Level 1 basic round

These caused excessive back-and-forth and must be proactively avoided.

### 1. Hidden layout wrappers create visual drift

Common cause:

- `mx-*`, `px-*`, `pb-*`, rounded wrappers, or hardcoded dark backgrounds in `GameLayout` or the screen root create gutters and separator bands the user never asked for.

Prevent it by:

- auditing all parent wrappers, not only the visible child component
- checking full-bleed behaviour behind the top strip, canvas, and message box
- verifying calculator bottom alignment against the viewport, not only against its own wrapper

### 2. Styling the wrong layer does nothing

Common cause:

- changing `QuestionBox` or shared chrome while the actual game uses a custom `questionPanel` with its own hardcoded colours

Prevent it by:

- tracing the final rendered path before editing visuals
- checking whether the active screen overrides shared components
- changing the real render source, not only the reusable component

### 3. Screenshot capture breaks because the capture path differs from the live path

Common cause:

- html2canvas fails on `oklch(...)` / `oklab(...)`
- snip overlays or dev chrome are accidentally included in the capture region
- captured area differs from the dotted/snipped selection

Prevent it by:

- sanitising unsupported CSS colour functions before capture
- rendering capture content from the exact scene subtree
- keeping capture overlays outside the captured subtree
- matching template capture behaviour rather than inventing a new one

### 4. Autopilot looked fake because the hand moved but items teleported

Common cause:

- phantom hand movement was animated, but the dragged items were assigned directly instead of travelling with the hand

Required resolution:

- autopilot must drive the same drag overlay / drag state a human drag uses
- grouped drags must visibly travel left-to-right before drop
- demo speed must be slow enough for the eye to follow

### 5. Calculator banner / extra UI can silently break dock geometry

Common cause:

- adding an answer banner above the calculator without increasing or rebalancing dock height clips the keypad or makes the left/right panels mismatched

Prevent it by:

- validating dock heights in:
  - dev mode
  - demo mode
  - production mode
  - collapsed state
  - expanded state

### 6. Equal-distribution drag semantics must be implemented as a system, not piecemeal

Common failure modes:

- dragging one item instead of a linked group
- linked buddies highlighted incorrectly
- lower boxes interactive when they should be read-only
- source items reflow after drag when spacing should remain stable
- items snap or resize incorrectly after drop

Prevent it by:

- defining the drag contract upfront from the spec
- implementing source state, drag overlay state, drop state, and return animation state coherently

### 7. Theme work is incomplete if it only changes one widget

Common cause:

- only changing calculator text colour while leaving message box backgrounds, highlights, banner, and canvas separators in the old theme
- only changing the calculator shell/border while the internal keypad buttons keep hardcoded default fills

Prevent it by:

- treating theme as a coordinated chrome system:
  - canvas backdrop
  - message header background
  - answer area background
  - calculator shell
  - calculator display
  - calculator digit keys
  - calculator operator keys
  - answer banner
  - text highlight colours
- tracing theme props all the way to the final rendered leaf nodes; do not assume the outer panel theme automatically reaches nested buttons

Resolution pattern from Pack It:

- when the user says the keypad should follow the cotheme "the way the border does", they mean the key surfaces themselves must inherit the active theme, not just the surrounding panel border
- if keypad keys still use hardcoded slate backgrounds while the border changes colour, the task is not complete
- fix this by introducing explicit per-key theme tokens or by deriving key fills/borders from the active keypad theme, then verify every item theme variant

### 8. Organic scenes must avoid distracting geometric/straight-line motifs unless the theme truly needs them

Examples:

- poultry/farm backdrops should not read like barn planks unless explicitly desired
- cookie/cupcake worlds should not look like generic striped panels or abstract bars

Prefer illustrated silhouettes, rounded terrain, clustered props, and soft forms.

### 9. Question variety and answer exposition need explicit template rules

Required:

- multiple question templates
- no immediate consecutive repetition of the same template
- division keywords highlighted
- answer lines written as natural sentences
- sequential reveal behaviour specified precisely

### 10. Pack It L1 basic interaction polish must be specified as behaviour, not treated as styling cleanup

This thread showed that many "small" issues were actually contract failures because they changed how the round felt or validated.

Common failure modes:

- keyword, number, and mathematical symbol colours inherited theme colours instead of staying on fixed semantic colours
- the inline `Next` button and calculator keys did not visually read as clickable controls
- refresh/reset behaved like a full round restart when the intended behaviour was "return items to source, keep question text, reset calculator"
- dropped groups were mathematically correct but not rendered as visible right-edge columns across the destination boxes
- the selected halo was moved without moving the selected item, so the perceived misalignment remained
- drag hover over the active destination did not snap magnetically into place
- generator bounds stayed on the earlier small-number range even after grouped dragging made larger values acceptable

Required resolution:

- define semantic colours independently from theme chrome where the spec/user does so
- treat button affordance as functional behaviour: contrast, hover, cursor, focus, Enter mapping
- distinguish "toolbar refresh", "retry this question", and "full restart" explicitly in code
- preserve visual grouping semantics after drop, not only counts
- when fixing alignment bugs, change the rendered item layer that the eye reads, not only background/halo layers
- update generator constraints and tests in the same change when interaction capacity changes

### 11. Pack It L1 basic autopilot submit/CTA timing is a known high-risk area

This thread required repeated correction because the autopilot looked nearly correct while still being wrong in visible ways.

Common failure modes:

- drag-step sound fired before motion instead of during motion
- phantom hand targeted the wrong DOM subtree and therefore never appeared on the calculator tick
- calculator tick stayed disabled during automation, so the required visible submit action was impossible
- validation used stale render state after staged drop animation and produced a wrong answer despite a correct board
- the phantom hand jumped to the submit/Next CTA too late, disappeared too quickly, or triggered result state before the visible click completed
- Enter key continued to map to keypad submit instead of the visible inline CTA once `Next` appeared

Required resolution:

- query the real DOM target for the phantom hand, not only the scene root
- keep the calculator expanded during robot demo when the demo must press the tick
- validate from authoritative current state after animations settle
- sequence autopilot as: final drag settles → hand appears on tick → dwell → click with sound → validate → reveal
- sequence `Next` as an explicit visible CTA flow with exact requested dwell/click/wait timings
- whenever a visible CTA is present, keyboard Enter must activate that CTA and not fall through elsewhere

### 10. Group formation before drag must be animated, visible, and anchored

Common failure modes:

- selecting one source item instantly teleports buddies into a grouped drag state
- selected buddies briefly disappear while the dark pill/halo appears
- the clicked item shifts a few pixels when the group forms instead of staying pinned
- grouped preview looks different in manual drag and autopilot drag
- grouped preview is rendered as separate circles instead of a single fused bundle

Required resolution:

- when one source item is selected, that touched item must stay fixed in place
- the other linked source items must visibly animate into their grouped positions beside it
- the grouped state must use one shared pill background and one shared halo, not independent per-item halos
- the item glyphs inside the grouped bundle must remain visible throughout the regrouping animation
- manual drag and autopilot drag must use the same grouped visual language and anchoring rules

### 11. Autopilot hand lifecycle must match a human demonstration exactly

Common failure modes:

- hand appears in a generic position rather than on a real source item
- hand snaps back to the left after drop instead of disappearing and reappearing later
- hand remains visible on the right after the drop
- hand reappears too early, before redistribution/fall animations have settled
- autopilot advances to the next question invisibly instead of visibly clicking the Next button

Required resolution:

- hand must press on a real source item on the left
- grouped items must form first, then drag with the hand
- after reaching the drop point, hand must pause briefly, then release
- once dropped, the hand must disappear on the right immediately
- the hand must stay hidden until post-drop settling is complete, then wait the configured extra delay before appearing on the next left-side pickup
- after the last drop, the hand must remain hidden until the visible Next button appears, then move to and click that button

### 12. Drop targeting must respect the actual insertion slot, not a generic container center

Common failure modes:

- autopilot drops into the center of the top box rather than after the current rightmost top-row item
- the leftmost dropped item shifts after release because the drag target and final resting slot do not align
- the whole dropped group slides after release instead of only the trailing items redistributing downward

Required resolution:

- compute the drop target from the live top-row occupancy
- target the lead dropped item at the slot immediately after the current rightmost top-row item
- fine-tune the target so the lead dropped item is already aligned with its final resting position at release
- after drop, the lead dropped item should stay put while only the trailing items animate into their final lower-box destinations

### 13. Selection state must be cleared only after post-drop settling is complete

Common failure modes:

- one item remains selected/haloed in the right-side boxes after the drop animation finishes
- deselection happens too early and breaks the visual continuity of the drop

Required resolution:

- keep selection visible through drag and drop
- clear all selection state only after the item fall/redistribution animation has fully completed
- explicitly verify that no halo remains in any destination box after settling

### 14. Autopilot mode must hide answer reveals and other helper UI unless explicitly required

Common failure modes:

- answer banner remains visible during autopilot, making the solve look fake or trivially assisted
- debug/dev answer affordances leak into demo mode

Required resolution:

- if autopilot/demo is active, hide answer banners unless the spec explicitly requires them
- verify answer visibility separately for:
  - manual mode
  - single-question autopilot
  - continuous autopilot

---

## Behaviour rules the dev agent must verify explicitly

If the game includes these features, verify them deliberately instead of assuming they “probably work”:

- `197879` reveals the answer without corrupting calculator state
- `198081` starts full automation/demo correctly and resets the calculator display appropriately
- demo mode star/progress behaviour differs correctly from normal mode if the spec says so
- submit/tick activation depends on the intended state, not accidental overfill or partial fill heuristics
- overfilling a box changes its border state only; it must not auto-submit unless the spec says so
- question progression happens only through the intended CTA path

---

## When using the template as reference

If the user says “make it behave like the template” or “see how the template does it”, do not approximate.

You must:

- inspect the local template implementation
- identify the exact component / hook / CSS path responsible
- mirror the same behaviour structure where appropriate

This applies especially to:

- calculator collapse behaviour
- screenshot/snip behaviour
- flash/capture effects
- answer feedback drop icons
- autopilot motion

---

## Round differentiation guardrail

When a level has multiple rounds with similar maths but different scaffolding, you must explicitly write down the round-difference matrix before coding. At minimum, identify for each round:

- how the child inputs an answer
- whether the board responds live while typing
- whether animation happens before or after submit
- whether correctness is revealed immediately or only after submit
- what autopilot/robot demo must physically do
- what UI guidance/support is shown or hidden

Do not collapse these rounds into one shared implementation until you can prove the round-difference matrix is preserved.

### Example: L1 Pack It failure pattern

The following distinctions were repeatedly lost and had to be restored by manual correction:

- `Load` is the drag round. The robot demo must drag item groups.
- `Pack` is not the drag round. The robot/phantom hand must use keypad/button interaction only.
- `Pack` should allow number entry first, then let the item animation settle, then press tick to verify.
- `Ship` should not respond live while entering. It should verify only after tick.
- `Ship` should wait briefly after its movement animation settles before showing right/wrong.

If two rounds are meant to feel different, do not ship them with only a label change.

---

## Template behavior preservation

If the template already has a platform-standard behavior, preserve it unless the spec explicitly replaces it.

Important examples:

- Completion state should use the template-style fullscreen completion splash, not an improvised inline message panel.
- Shared button styles should reuse template/button primitives when matching existing controls.
- Autopilot/phantom-hand flows should use the same visible interaction language as the template: move to control, click control, then allow state changes.

Do not replace a fullscreen modal/overlay with an inline status message unless the spec explicitly says to.

---

## Layout exactness rule

When the user is iterating on layout, treat requests like:

- "top of screen"
- "centered"
- "no gap"
- "1rem inset"
- "same look and feel"

as exact constraints, not approximate styling intent.

When changing layout:

- remove hidden parent offsets and padding if they prevent true placement
- align divider position and column widths together
- verify both left and right insets after divider changes
- remove obsolete hover/highlight states if the user says they should never appear

A visually "almost right" implementation is not complete.

---

## Generator constraints rule

When the user tightens generator constraints during review, encode the final constraints directly in the calculator layer and tests.

Do not leave the old range logic in place after the UI appears acceptable.

Typical examples from Pack It L1:

- larger values for later rounds than the first round
- dividends must be two digits
- divisors must be above a specific threshold

If a constraint changes during feedback, the unit tests must be updated in the same change.

---

## Autopilot implementation guardrail

Autopilot bugs caused a large amount of avoidable iteration. For keypad-driven rounds:

- do not let keypad autopilot fall through to drag-demo logic
- reset the visible keypad display deterministically before typing
- avoid double-entry paths; do not both mutate state and trigger DOM button clicks for the same digit
- ensure `Next` timing after submit is intentional and matches the requested pause
- ensure Enter key behavior matches button-click behavior on completion overlays

For each round, confirm that the phantom hand uses the same input modality the child is supposed to use.

---

## Before calling the round done

For any level/round implementation, verify all of the following explicitly:

1. The generator ranges match the final requested maths constraints.
2. Each round’s interaction differs exactly where intended.
3. Completion UI matches the template/platform pattern.
4. Autopilot uses the correct modality and timing.
5. Layout constraints are exact, not approximate.
6. Visual states do not include leftover hover/correct/full styling the user asked to remove.
7. The relevant unit tests and Playwright tests cover those behaviors.
8. Refresh/reset, submit-tick, answer reveal, CTA timing, and Enter-key mappings all match the final reviewed interaction sequence exactly.

---

## Template repo structure

```
GAME_GUIDE.md                        ← how to build a game on this template
README.md
index.html
package.json
vite.config.ts
playwright.config.ts
eslint.config.js
vercel.json
tsconfig.json / tsconfig.app.json / tsconfig.node.json

specs/                               ← template feature specs (read as needed)
  README.md
  architecture.md
  game-logic.md
  game-layout.md
  game-loop.md
  numeric-keypad.md
  sound-system.md
  session-reporting.md
  autopilot.md
  canvas.md
  cheat-codes.md
  demo-video.md
  deployment.md
  i18n.md
  social.md

src/
  App.tsx                            ← entry point — wire your screen here
  main.tsx
  index.css
  demoMode.ts

  screens/
    RippleScreen.tsx                 ← reference game screen — model yours on this

  game/
    rippleGame.ts                    ← reference game logic facade — model yours on this

  components/                        ← shared UI components — use, don't rewrite
    GameLayout.tsx
    NumericKeypad.tsx
    QuestionBox.tsx
    LevelButtons.tsx
    AudioButton.tsx
    LanguageSwitcher.tsx
    SessionReportModal.tsx
    TutorialHint.tsx
    PhantomHand.tsx
    AutopilotIcon.tsx
    DemoIntroOverlay.tsx
    RotatePrompt.tsx
    Social.tsx

  calculations/                      ← ALL maths logic lives here — see structure below
    types.ts
    index.ts
    shared.ts
    level-1/normal.ts
    level-2/normal.ts

  hooks/
    useAutopilot.ts
    useCheatCode.ts
    useDemoRecorder.ts
    useMediaQuery.ts

  i18n/
    types.ts / index.ts / en.ts / hi.ts / es.ts / ru.ts / zh.ts

  report/
    sessionLog.ts / generatePdf.ts / shareReport.ts

  sound/
    index.ts

  utils/
    embeddedAnalytics.ts

api/
  send-report.ts
  translate.ts

tests/
  autopilot.spec.ts
  demo-video.spec.ts
  email.spec.ts
  i18n.spec.ts
  screenshots.spec.ts
  unit/calculations.test.ts          ← unit tests live here

public/
  intro.html / outro.html / manifest.json
```

---

## File structure you must create

### Game screen
```
src/screens/<GameName>Screen.tsx     ← your game screen (model on RippleScreen.tsx)
```

### Game logic facade
```
src/game/<gameName>Game.ts           ← thin facade (model on rippleGame.ts)
                                        imports from calculations/, re-exports to screen
```

### Calculations — one file per round per level
This is the most important structural rule. Every distinct round variant gets its own file so it can be unit-tested in isolation.

```
src/calculations/
  types.ts                           ← Question, Answer, RoundConfig and any new types
  index.ts                           ← dispatcher: createRound(level, round) → RoundConfig
  shared.ts                          ← shared pure utilities (no side effects)
  level-1/
    index.ts                         ← exports all rounds for level 1
    round-1.ts                       ← round 1 logic — injectable random, pure functions
    round-2.ts                       ← round 2 logic
    round-3.ts                       ← (add as many rounds as the spec defines)
  level-2/
    index.ts
    round-1.ts
    round-2.ts
    ...
```

**Rules for calculation files:**
- Every function must accept `random: () => number = Math.random` as an injectable parameter — this is what makes them unit-testable.
- No side effects, no state, no imports from React or components.
- Pure input → output: given a level + round + random seed, produce a deterministic question/answer.

### Unit tests
```
tests/unit/calculations.test.ts      ← unit tests for all calculation functions
```

Write at least one unit test per round per level. Tests must:
- Pass a fixed `random` function to get deterministic output.
- Assert the generated question and answer are mathematically correct.
- Cover edge cases (min/max values, boundary conditions from the spec).

---

## Answer feedback animation (mandatory — every game)

Every game must implement the standard drop-icon feedback animation. This is a platform-wide pattern — do not invent an alternative.

### How it works

When the child submits an answer, a 64×64 SVG icon drops from the top of the screen and falls off the bottom. Simultaneously, a flash text banner bounces in at the centre of the screen.

- **Correct:** green circle + white ✓, green flash banner
- **Wrong:** red circle + white ✗, pink flash banner

### CSS keyframes (add to `src/index.css`)

```css
@keyframes icon-drop-left {
  0%   { transform: translateY(-96px) scale(0.96); opacity: 0; }
  10%  { transform: translateY(0px) scale(1); opacity: 1; }
  85%  { transform: translateY(78vh) scale(1); opacity: 1; }
  100% { transform: translateY(95vh) scale(1); opacity: 0; }
}
@keyframes bounce-in {
  0%   { transform: scale(0.3); opacity: 0; }
  50%  { transform: scale(1.08); }
  100% { transform: scale(1); opacity: 1; }
}
.animate-bounce-in { animation: bounce-in 0.4s cubic-bezier(0.36,0.07,0.19,0.97); }
```

### Drop icon (render via `createPortal` to `document.body`)

```tsx
{flash && createPortal(
  <div className="pointer-events-none fixed z-[9999]" style={{ left: "16px", top: "16px" }}>
    {flash.ok ? (
      <svg viewBox="0 0 120 120" width="64" height="64" style={{
        display: "block",
        animation: "icon-drop-left 1.15s cubic-bezier(0.22,0.72,0.2,1) forwards",
        filter: "drop-shadow(0 0 12px #4ade80) drop-shadow(0 0 24px #16a34a)",
      }}>
        <circle cx="60" cy="60" r="54" fill="#14532d" />
        <path d="M30 62 L50 82 L90 38" fill="none" stroke="#ffffff"
          strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : (
      <svg viewBox="0 0 120 120" width="64" height="64" style={{
        display: "block",
        animation: "icon-drop-left 1.15s cubic-bezier(0.22,0.72,0.2,1) forwards",
        filter: "drop-shadow(0 0 12px #f87171) drop-shadow(0 0 24px #b91c1c)",
      }}>
        <circle cx="60" cy="60" r="54" fill="#7f1d1d" />
        <path d="M38 38 L82 82 M82 38 L38 82" fill="none" stroke="#ffffff"
          strokeWidth="13" strokeLinecap="round" />
      </svg>
    )}
  </div>,
  document.body
)}
```

### Flash text banner

```tsx
{flash && (
  <div className={`pointer-events-none absolute left-1/2 top-[30%] z-40 -translate-x-1/2
    rounded-xl border-2 px-8 py-4 text-2xl font-black uppercase tracking-widest animate-bounce-in
    ${flash.ok
      ? "border-emerald-400 bg-emerald-950/90 text-emerald-300"
      : "border-pink-400 bg-pink-950/90 text-pink-300"}`}>
    {flash.text}
  </div>
)}
```

### State

```tsx
const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

function showFeedback(ok: boolean, text: string) {
  setFlash({ ok, text });
  setTimeout(() => setFlash(null), 1200); // clear after animation completes
}
```

Use the message text from `specs/spec.md` for correct/wrong messages per level and round. Play `playCorrect()` or `playWrong()` alongside the animation.

---

## Responsiveness rules

All games must work on both mobile and desktop. Follow these rules:

- Use `GameLayout` as the outer wrapper — it handles orientation and safe areas.
- Use `rem` or `%` for sizes, not `px` for layout dimensions.
- Minimum tap target: **44×44px** for every interactive element.
- Use the `useMediaQuery` hook (already in the template) to detect mobile vs desktop when layout needs to differ.
- Test at: 375×667 (iPhone SE), 768×1024 (iPad), 1280×800 (desktop).
- Portrait orientation is primary for mobile; landscape must not break the game.
- Font sizes: minimum `1rem` body text, `1.5rem` for questions, `2rem` for answers/inputs.

---

## Template features that must remain visible

These are not optional unless the user explicitly asks to remove them.

- The calculator keypad is a **must** in every phase, including heavily guided rounds. If the round does not require typed input yet, keep the keypad visible and use it as a passive display / scaffold rather than hiding it.
- Keep the full dev toolbar / template feature surface present, not a reduced subset. This includes the standard top-bar controls and the developer/demo controls exposed by `GameLayout`.
- Before inventing a custom replacement, first wire the existing template capabilities:
  - restart
  - mute
  - language switcher
  - screenshot capture
  - square snip mode
  - demo video recording
  - autopilot / "show solve"
  - level buttons
  - progress indicators
  - share / comments / video CTA if present in the template
- If a feature is not yet functional for the current phase, stub it only temporarily and note that explicitly in your checkpoint. Do not silently omit the control.

---

## Running locally

```bash
npm install
npm run dev -- --port 4005
```

The game runs at **http://localhost:4005**. Always use port 4005.

---

## Git workflow

- All work is done directly on `main`. No branches, no PRs, no merging.
- Commit and push after each phase — do not accumulate uncommitted work.
- Commit message format: `Phase N: L[X] [round name] — [one line summary]`
- Push immediately after each commit: `git push origin main`

---

## Vercel deployment

### Initial setup (do this before writing any code)

Run these once at the very start, before Phase 1:

```bash
npm install -g vercel          # ensure CLI is available
vercel link --yes              # link this repo to a Vercel project (creates one if needed)
vercel deploy --prod           # initial production deployment
```

`vercel link` will create a `.vercel/` folder in the repo. Commit this:

```bash
git add .vercel
git commit -m "chore: link Vercel project"
git push origin main
```

Capture the production URL printed by `vercel deploy --prod`. You will use it for verification after every phase.

### After every phase commit + push

After `git push origin main`, verify the Vercel deployment is live:

```bash
# Wait for Vercel to finish building (triggered by the push)
vercel ls --prod               # shows latest deployments and their status

# Once status is READY, confirm the URL returns 200
curl -s -o /dev/null -w "%{http_code}" https://<your-vercel-url>
```

The curl must return `200`. If it returns anything else, investigate before showing the visual confirmation checkpoint to the user.

Include the live Vercel URL in every visual confirmation checkpoint message so the user can open it directly:

> **Phase [N] complete — Level [X] [round name] is ready.**
> Live at: https://[vercel-url]
> Also available locally at: http://localhost:4005
> ...

---

## Testing responsibilities

| Test type | Who writes it | When |
|-----------|--------------|------|
| Unit tests (calculation functions, game logic) | **Dev (you)** | Before handoff |
| Functional / Playwright tests | Tester agent | After Dev handoff |
| Usability validation | UAT agent | After Tester passes |

You are responsible for unit tests only. Do not write Playwright tests.

---

## Completion criteria

You are **not done** until both of these pass:

```bash
npm run build          # must compile with zero errors
npm run test:unit      # all unit tests must pass
```

Do not hand off with TypeScript errors or failing unit tests. Fix them first.

---

## Pre-checkpoint demo checklist

Before you ask the user for visual inspection at the end of any phase, you must run this checklist yourself:

1. Confirm the phase scope is correct — only the intended level/round is being shown as complete.
2. Run `npm run build` and confirm it passes with zero errors.
3. Run `npm run test:unit` and confirm all tests pass.
4. Start the app locally on `http://localhost:4005`.
5. Open the running app and verify the page actually loads.
6. Check browser console: zero red errors.
7. Confirm the calculator keypad is visible.
8. Confirm the full expected toolbar/dev controls are visible for that phase.
9. Exercise the core interaction of the phase end to end yourself.
10. Verify the checkpoint content is inspectable without hidden setup steps.

Do not ask the user to inspect a phase until all ten checks above are complete.

---

## Phased delivery — mandatory

You must deliver the game in phases, one round at a time, starting with Level 1 basic round. **Do not proceed to the next phase until the user explicitly confirms the current phase looks correct.**

Every game has the same phase structure regardless of what the rounds are named in the spec:

```
Phase 1:  Level 1 — basic round         ← always start here
Phase 2:  Level 1 — next round(s)
Phase 3:  Level 2 — basic round
Phase 4:  Level 2 — next round(s)
Phase 5+: Level 3+ and remaining rounds
```

Read the spec to identify the actual round names (e.g. "normal", "monster", "challenge") and map them onto this phase sequence. The basic round for each level is the simplest one — the one that introduces the core mechanic without extra difficulty modifiers.

### What each phase includes

For each phase, deliver:
1. The calculation file(s) for that level + round (`src/calculations/level-N/<round>.ts`)
2. Unit tests for those calculations (`tests/unit/calculations.test.ts` — append, don't overwrite)
3. The UI wired up so the round is playable end to end
4. Build passes, unit tests pass

### Visual confirmation checkpoint

At the end of each phase, stop and deliver a showcase message in this format:

---

**Phase [N] complete — Level [X] [round name] is ready.**

Live at: https://[vercel-url]
Also at: http://localhost:4005

**Please walk through this checklist:**

**Core mechanic (this phase)**
- [ ] [specific thing to play, e.g. "drag the dino along a route and watch the odometer"]
- [ ] [specific thing to verify, e.g. "enter the correct total distance — it should be accepted"]
- [ ] [round-end behaviour, e.g. "completing the round shows a success screen"]

**Correct / wrong answer feedback**
- [ ] Enter a correct answer — positive, encouraging message appears
- [ ] Enter a wrong answer — gentle feedback, no harsh language, can try again

**Responsiveness**
- [ ] Resize the browser to mobile width (375px) — layout holds, nothing overflows
- [ ] All buttons and inputs are easy to tap (nothing feels too small)

**Visual polish**
- [ ] No layout jumps or flickers during normal play
- [ ] Text is readable at a glance — question and answer are clearly distinguished
- [ ] Feedback messages (correct/wrong) are visible without scrolling

**Technical hygiene**
- [ ] Open browser DevTools → Console — zero red errors
- [ ] Vercel URL loads and plays correctly (not just localhost)

---

**Type "looks good" to continue to Phase [N+1], or describe anything that needs fixing.**

---

Do not start the next phase until the user confirms. If they report an issue, fix it and post the full checkpoint message again.

---

## Development loop

1. Read the spec fully. Identify all levels and rounds. Map them to the phase sequence above.
2. Read the files listed in "Start by reading these."
3. Set up the shared scaffolding: `types.ts`, `index.ts`, `shared.ts`, game facade, game screen shell, `App.tsx` wiring.
4. Implement Phase 1 (L1 basic round): calculation → unit test → UI → build check.
5. Stop. Show the visual confirmation checkpoint. Wait for "looks good."
6. Repeat for each subsequent phase.

---

## Completion criteria (per phase)

Each phase is complete only when:

```bash
npm run build          # zero errors
npm run test:unit      # all unit tests pass (including all prior phases)
```

---

## Final handoff

After all phases are confirmed, write `specs/dev-notes.md`:
- Phases delivered and confirmed
- Any deviations from the spec (and why)
- Known limitations
- How to run: `npm install && npm run dev -- --port 4005`
