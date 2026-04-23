# Autopilot - Perimeter Explorer

## Cheat Codes
- `198081`: continuous autopilot.
- `197879`: reveal/solve current answer.

## Trace Automation
Autopilot moves the runner checkpoint to checkpoint with 250-400 ms pauses, then submits the correct answer.

## Level 3 Automation
Skip decorative tracing unless the diagram requires it. Read the generated answer from `getCorrectAnswer(question)` and submit through the keypad path.

## Timing
Allow enough delay for edge glow and lap-total animation before submission so demo recordings show the concept clearly.
