# Architecture - Perimeter Explorer

## Template Adaptation
Rename template game identifiers to `maths-perimeters` and display title to `Perimeter Explorer`.

## Core Modules
- `src/game/perimeterLogic.ts`: generation, validation, formatting.
- `src/components/PerimeterScene.tsx`: SVG track scene and tracing interaction.
- `src/components/LapTotalHud.tsx`: segment addition display.
- `src/report/perimeterReport.ts`: report diagram/data mapping.

## Port Constant
Use `4007` in dev scripts and documentation.

## State Boundary
Keep all game-specific state in the app/game modules. Do not alter platform shell APIs except for required progress icon and report data wiring.
