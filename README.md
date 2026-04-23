# Perimeter Explorer

Perimeter Explorer is an interactive maths game where a sporty cartoon runner traces park tracks checkpoint by checkpoint. Students experience perimeter as the full lap distance around the outside boundary, then progress toward IXL-style perimeter and missing-side questions.

## Teaching Objective
Students will calculate perimeter by identifying the outside boundary of a shape, adding side lengths, inferring missing/equal side lengths, and solving metric perimeter problems with whole numbers, decimals, and mixed numbers.

## Age Group
Years 5-6.

## Curriculum Mapping
| Level | Standard | Description |
|-------|----------|-------------|
| 1 | MA3-GM-02 | Trace non-standard boundaries and add whole-number metric side lengths. |
| 2 | MA3-GM-02 | Calculate perimeters of common 2D shapes and infer needed sides. |
| 3 | MA3-GM-02 | Solve IXL-style perimeter and missing-side questions with decimals and mixed numbers. |

## Tech Stack
| Area | Technology |
|------|------------|
| App | React + TypeScript template |
| Scene | SVG full-screen canvas |
| Tests | Playwright |
| Reports | PDF session report |
| Deploy | Vercel |

## Directory Structure
```text
src/       game implementation
specs/     BA handoff specs
public/    icons, manifest, screenshots
tests/     Playwright tests
api/       serverless/report helpers if used
```

## Feature Index
| Feature | Spec |
|---------|------|
| Game brief | `specs/brief.md` |
| Product spec | `specs/spec.md` |
| Question logic | `specs/game-logic.md` |
| Game loop | `specs/game-loop.md` |
| Canvas | `specs/canvas.md` |
| Reports | `specs/session-reporting.md` |
| Deployment | `specs/deployment.md` |

## Dev Setup
```bash
npm install
npm run dev -- --port 4007
```

## Deploy
```bash
npm run build
vercel --prod
```
