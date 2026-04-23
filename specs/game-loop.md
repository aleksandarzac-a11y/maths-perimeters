# Game Loop - Perimeter Explorer

## Source File
`src/App.tsx` with game state helpers in `src/game/perimeterLogic.ts`.

## Top-Level Screens
`playing`, `levelComplete`, `gameComplete`, `report`.

## Game Phases
`trace` -> `answering` -> `feedback` -> `nextQuestion` -> `levelComplete` -> `gameComplete`.

## Challenge Round Mechanics
There is no separate challenge round. Level 3 is the challenge phase: tracing becomes optional/preview-only and the question prompt is presented in textbook format.

## Level Background Theming
- Level 1: `linear-gradient(#b9f3c1, #eefbdd)` with park greens.
- Level 2: `linear-gradient(#ffd99b, #fff4d9)` with track-orange accents.
- Level 3: `linear-gradient(#eef6ff, #ffffff)` with worksheet blue accents.

## State Variables
Current level, question index, current question, traced edge ids, active checkpoint id, running lap total, answer input, attempts for current question, deducted flag for current question, progress shoe count, session log, muted state.

## Key Refs
Canvas/SVG ref for pointer coordinates, keypad ref, autopilot timer ref, report capture ref.

## Core Functions
- `startLevel(level)`
- `startQuestion(question)`
- `handleCheckpointDragStart(pointId)`
- `handleCheckpointDragMove(pointer)`
- `handleCheckpointDrop(targetPointId)`
- `completeTrace()`
- `submitAnswer(input)`
- `applyCorrectFeedback()`
- `applyWrongFeedback(direction)`
- `advanceAfterFeedback()`
- `buildReportData()`

## Physical Keyboard Support
Digits, decimal point, Backspace, Enter. Level 3 mixed-number input may accept a space and slash.

## Question Text Per Phase
Trace phase: short prompt such as "Trace the lap." Answering phase: "What is the perimeter?" or "Find the missing side." Level 3 uses full worksheet wording.

## Secondary HUD Elements
Lap-total panel, current segment pill, checkpoint glow, running shoe progress row.

## Scroll Prevention
Prevent page scroll during SVG pointer interaction on touch devices.

## JSX Structure
Inherited shell top bar, question box, full-screen SVG scene, lap-total HUD, numeric keypad, progress row, social drawer.

## Autopilot Wiring
`198081` traces all checkpoints and answers continuously. `197879` reveals/types the answer for the current question.
