# Game Logic - Perimeter Explorer

## Source File
`src/game/perimeterLogic.ts`

## Types
```ts
type MetricUnit = 'cm' | 'm' | 'km';
type LevelId = 1 | 2 | 3;
type QuestionKind =
  | 'trace-perimeter'
  | 'standard-shape-perimeter'
  | 'missing-side'
  | 'mixed-number-perimeter';

interface TrackPoint { id: string; x: number; y: number; }
interface TrackEdge { from: string; to: string; length: number; label?: string; visible: boolean; inferred?: boolean; }
interface MixedNumber { whole: number; numerator: number; denominator: number; }
interface PerimeterQuestion {
  id: string;
  level: LevelId;
  kind: QuestionKind;
  shapeType: string;
  unit: MetricUnit;
  points: TrackPoint[];
  edges: TrackEdge[];
  prompt: string;
  answer: number | MixedNumber;
  answerFormat: 'number' | 'mixed-number';
  tolerance: number;
  reportText: string;
}
```

## Level Calculators
Level 1 generates random rectilinear and polygon park tracks with 4-7 outer edges. Whole-number lengths only, all edges visible, total shown while tracing.

Level 2 generates curriculum shapes: square, rectangle, triangle, parallelogram, trapezoid, and L-shape. Whole numbers plus simple decimals such as `3.5 m`. Some labels are hidden but inferable from opposite/equal sides.

Level 3 generates IXL-style prompts: missing side from total perimeter, perimeter from labelled diagram, and mixed-number perimeter. Shapes may include rectangles, squares, parallelograms, and trapezoids. Decimals use one decimal place. Mixed numbers use denominators 2, 4, 5, or 10.

## Shared Helpers
- `sumEdges(edges)` returns perimeter.
- `rectangleMissingSide(perimeter, knownSide)` returns `(perimeter / 2) - knownSide`.
- `squareSide(perimeter)` returns `perimeter / 4`.
- `formatMetric(value, unit)` preserves mixed-number formatting when needed.
- `compareAnswer(input, answer, tolerance)` supports decimal and mixed-number answers.

## Facade Contract
```ts
makeQuestion(level: LevelId, seed?: string): PerimeterQuestion;
makeRound(level: LevelId, count?: number, seed?: string): PerimeterQuestion[];
getCorrectAnswer(question: PerimeterQuestion): string;
validateAnswer(question: PerimeterQuestion, input: string): AnswerResult;
```

## Unit Test Strategy
Test generated shapes close, edge sums match answers, missing-side formulas invert correctly, mixed-number formatting is accepted, and each level produces only allowed units/question types.

## Input Contract
Numeric keypad accepts digits, decimal point, and mixed-number separator for Level 3. Negative answers are not valid.

## Demo Mode Contract
Autopilot traces checkpoints in order, waits briefly at each checkpoint, then types the correct answer.
