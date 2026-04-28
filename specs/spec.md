# Game Spec: Perimeter Explorer

## Teaching Objective
Make perimeter feel like distance travelled around a boundary. A successful student can identify the outside edges of a shape, add or infer the needed side lengths, choose a suitable metric unit, and solve IXL-style perimeter questions including missing side lengths.

## Age Group
Years 5-6, Stage 3.

## Curriculum Standard(s)
`MA3-GM-02`: selects and uses the appropriate unit and device to measure lengths and distances including perimeters.

## Mechanic
The child controls a sporty cartoon runner around park-track outlines. The runner moves checkpoint to checkpoint only along valid outer edges. A complete lap represents the perimeter.

## Primary Interaction
1. Drag from the current checkpoint to the next checkpoint around the outside.
2. Watch each segment length add into the lap-total panel.
3. Type the final perimeter or missing side value.
4. Submit via numeric keypad.

## Screens
- Start/playing screen using inherited shell UI.
- Level complete screen with running-shoe progress.
- Game complete screen with a finish-line celebration and report download/email/share.

## Questions / Problems
Level 1: non-standard closed park paths with labelled whole-number segment lengths. Prompt: "Trace the lap. What is the perimeter?"

Level 2: squares, rectangles, triangles, parallelograms, trapezoids, and simple L-shapes. Prompts ask for perimeter or a missing side. Some equal/opposite sides are visually implied.

Level 3: textbook/IXL-style questions. Examples:
- "A rectangle has a perimeter of 49.6 m and a length of 17.8 m. What is the width?"
- "A square has a perimeter of 61.2 cm. What is the length of each side?"
- "A parallelogram has a perimeter of 44.2 cm and a base of 14.6 cm. What is the side length?"
- "A trapezoid has a perimeter of 38.8 m and three sides shown. What is the missing side?"
- "Find the perimeter. Write your answer as a mixed number."

## Feedback
Use the platform drop-icon feedback. Correct: green check, positive flash, runner crosses finish. Wrong: red X, gentle flash, runner demonstrates too-short or too-long distance.

## Win / Loss Conditions
Default 10 questions per level. Correct answer banks one running shoe. Wrong answer costs at most one shoe for that question and the question remains active until correct or phantom solves it.

## Challenge Round
No separate challenge round. Level 3 is the challenge and is intentionally worksheet-like.

## Accessibility
Large checkpoints, touch-friendly drag targets, high-contrast labels, keyboard keypad support, reduced-motion fallback, metric units spoken plainly, no instruction screen required.

## Out Of Scope
Imperial units, circle circumference, sector perimeter, open-ended drawing, multiplayer, accounts, leaderboards.
