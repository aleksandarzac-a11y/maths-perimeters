export type MetricUnit = "cm" | "m" | "km";
export type LevelId = 1 | 2 | 3;
export type QuestionKind =
  | "trace-perimeter"
  | "standard-shape-perimeter"
  | "missing-side"
  | "mixed-number-perimeter";

export interface TrackPoint {
  id: string;
  x: number;
  y: number;
}

export interface TrackEdge {
  from: string;
  to: string;
  length: number;
  label?: string;
  visible: boolean;
  inferred?: boolean;
}

export interface MixedNumber {
  whole: number;
  numerator: number;
  denominator: number;
}

export interface PerimeterQuestion {
  id: string;
  level: LevelId;
  kind: QuestionKind;
  shapeType: string;
  storyTitle?: string;
  storyLine?: string;
  storyFocus?: "pitch" | "penalty-area" | "sideline" | "goalkeeper-box";
  unit: MetricUnit;
  points: TrackPoint[];
  scenePoints?: TrackPoint[];
  edges: TrackEdge[];
  prompt: string;
  answer: number | MixedNumber;
  answerFormat: "number" | "mixed-number";
  tolerance: number;
  reportText: string;
}

export interface AnswerResult {
  isCorrect: boolean;
  numericInput: number | null;
  correctText: string;
  direction: "short" | "long" | "match" | "invalid";
}

type Rng = () => number;

function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a: number): Rng {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngFor(seed?: string): Rng {
  return mulberry32(xmur3(seed ?? `${Date.now()}-${Math.random()}`)());
}

function pick<T>(rng: Rng, values: T[]): T {
  return values[Math.floor(rng() * values.length)];
}

function shuffle<T>(rng: Rng, values: T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function whole(rng: Rng, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

function oneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function fitPointsToViewBox(points: TrackPoint[], width = 1000, height = 620, padding = 110) {
  const transform = createViewBoxTransform(points, width, height, padding);
  return points.map((point) => ({
    ...point,
    x: oneDecimal(point.x * transform.scale + transform.offsetX),
    y: oneDecimal(point.y * transform.scale + transform.offsetY),
  }));
}

function createViewBoxTransform(points: TrackPoint[], width = 1000, height = 620, padding = 110) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const sourceW = Math.max(maxX - minX, 1);
  const sourceH = Math.max(maxY - minY, 1);
  const scale = Math.min(
    (width - padding * 2) / sourceW,
    (height - padding * 2) / sourceH,
  );
  const scaledW = sourceW * scale;
  const scaledH = sourceH * scale;
  const offsetX = (width - scaledW) / 2 - minX * scale;
  const offsetY = (height - scaledH) / 2 - minY * scale;
  return { scale, offsetX, offsetY };
}

function applyViewBoxTransform(points: TrackPoint[], transform: ReturnType<typeof createViewBoxTransform>) {
  return points.map((point) => ({
    ...point,
    x: oneDecimal(point.x * transform.scale + transform.offsetX),
    y: oneDecimal(point.y * transform.scale + transform.offsetY),
  }));
}

function buildRectTrack(length: number, width: number): TrackPoint[] {
  return fitPointsToViewBox([
    { id: "A", x: 0, y: 0 },
    { id: "B", x: length, y: 0 },
    { id: "C", x: length, y: width },
    { id: "D", x: 0, y: width },
  ]);
}

function buildSquareTrack(side: number): TrackPoint[] {
  return buildRectTrack(side, side);
}

function buildRightTriangleTrack(base: number, height: number): TrackPoint[] {
  return fitPointsToViewBox([
    { id: "A", x: 0, y: 0 },
    { id: "B", x: base, y: 0 },
    { id: "C", x: 0, y: height },
  ]);
}

function buildParallelogramTrack(base: number, side: number, angleDegrees = 58): TrackPoint[] {
  const angle = (angleDegrees * Math.PI) / 180;
  const dx = side * Math.cos(angle);
  const dy = side * Math.sin(angle);
  return fitPointsToViewBox([
    { id: "A", x: 0, y: 0 },
    { id: "B", x: base, y: 0 },
    { id: "C", x: base + dx, y: dy },
    { id: "D", x: dx, y: dy },
  ]);
}

function buildTrapezoidTrack(top: number, bottom: number, leg: number): TrackPoint[] {
  const offset = (bottom - top) / 2;
  const heightSquared = Math.max(leg * leg - offset * offset, 1);
  const height = Math.sqrt(heightSquared);
  return fitPointsToViewBox([
    { id: "A", x: 0, y: 0 },
    { id: "B", x: top, y: 0 },
    { id: "C", x: bottom + offset, y: height },
    { id: "D", x: offset, y: height },
  ]);
}

function buildLShapeTrack(outerWidth: number, outerHeight: number, insetWidth: number, insetHeight: number): TrackPoint[] {
  return fitPointsToViewBox([
    { id: "A", x: 0, y: 0 },
    { id: "B", x: outerWidth, y: 0 },
    { id: "C", x: outerWidth, y: insetHeight },
    { id: "D", x: insetWidth, y: insetHeight },
    { id: "E", x: insetWidth, y: outerHeight },
    { id: "F", x: 0, y: outerHeight },
  ]);
}

function buildRectilinearLoopTrack(
  top: number,
  right: number,
  inset: number,
  depth: number,
): TrackPoint[] {
  return fitPointsToViewBox([
    { id: "A", x: 0, y: 0 },
    { id: "B", x: top, y: 0 },
    { id: "C", x: top, y: right },
    { id: "D", x: inset, y: right },
    { id: "E", x: inset, y: right + depth },
    { id: "F", x: 0, y: right + depth },
  ]);
}

const FOOTBALL_PITCH = {
  length: 105,
  width: 68,
};

function footballPitchLocalPoints() {
  return [
    { id: "A", x: 0, y: 0 },
    { id: "B", x: FOOTBALL_PITCH.length, y: 0 },
    { id: "C", x: FOOTBALL_PITCH.length, y: FOOTBALL_PITCH.width },
    { id: "D", x: 0, y: FOOTBALL_PITCH.width },
  ];
}

function footballPitchTransform() {
  return createViewBoxTransform(footballPitchLocalPoints());
}

function footballPitchPoints() {
  return applyViewBoxTransform(footballPitchLocalPoints(), footballPitchTransform());
}

function footballRectangleQuestion(
  left: number,
  top: number,
  width: number,
  height: number,
) {
  const transform = footballPitchTransform();
  const points = applyViewBoxTransform([
    { id: "A", x: left, y: top },
    { id: "B", x: left + width, y: top },
    { id: "C", x: left + width, y: top + height },
    { id: "D", x: left, y: top + height },
  ], transform);
  const scenePoints = footballPitchPoints();
  const edges = [
    edge("A", "B", width),
    edge("B", "C", height),
    edge("C", "D", width, false, true),
    edge("D", "A", height, false, true),
  ];
  return { points, scenePoints, edges };
}

export function sumEdges(edges: TrackEdge[]) {
  return oneDecimal(edges.reduce((total, edge) => total + edge.length, 0));
}

export function rectangleMissingSide(perimeter: number, knownSide: number) {
  return oneDecimal(perimeter / 2 - knownSide);
}

export function squareSide(perimeter: number) {
  return oneDecimal(perimeter / 4);
}

export function mixedToNumber(value: MixedNumber) {
  return value.whole + value.numerator / value.denominator;
}

function simplifyMixed(value: MixedNumber): MixedNumber {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const totalNumerator = value.whole * value.denominator + value.numerator;
  const wholePart = Math.floor(totalNumerator / value.denominator);
  const remainder = totalNumerator % value.denominator;
  if (remainder === 0) return { whole: wholePart, numerator: 0, denominator: 1 };
  const div = gcd(remainder, value.denominator);
  return { whole: wholePart, numerator: remainder / div, denominator: value.denominator / div };
}

export function formatMixed(value: MixedNumber) {
  const simplified = simplifyMixed(value);
  if (simplified.numerator === 0) return String(simplified.whole);
  return `${simplified.whole} ${simplified.numerator}/${simplified.denominator}`;
}

export function formatMetric(value: number | MixedNumber, unit: MetricUnit) {
  if (typeof value === "number") {
    return `${Number.isInteger(value) ? value : value.toFixed(1)} ${unit}`;
  }
  return `${formatMixed(value)} ${unit}`;
}

function parseInput(input: string): number | null {
  const raw = input.trim();
  if (!raw || raw.startsWith("-")) return null;
  const mixed = raw.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const wholePart = Number(mixed[1]);
    const numerator = Number(mixed[2]);
    const denominator = Number(mixed[3]);
    if (denominator <= 0 || numerator >= denominator) return null;
    return wholePart + numerator / denominator;
  }
  const fraction = raw.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (denominator <= 0) return null;
    return numerator / denominator;
  }
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

export function compareAnswer(input: string, answer: number | MixedNumber, tolerance = 0.01) {
  const parsed = parseInput(input);
  if (parsed === null) return false;
  const expected = typeof answer === "number" ? answer : mixedToNumber(answer);
  return Math.abs(parsed - expected) <= tolerance;
}

export function getCorrectAnswer(question: PerimeterQuestion) {
  return question.answerFormat === "mixed-number"
    ? formatMixed(question.answer as MixedNumber)
    : String(question.answer);
}

export function validateAnswer(question: PerimeterQuestion, input: string): AnswerResult {
  const numericInput = parseInput(input);
  const expected = typeof question.answer === "number" ? question.answer : mixedToNumber(question.answer);
  if (numericInput === null) {
    return {
      isCorrect: false,
      numericInput,
      correctText: getCorrectAnswer(question),
      direction: "invalid",
    };
  }
  const isCorrect = Math.abs(numericInput - expected) <= question.tolerance;
  return {
    isCorrect,
    numericInput,
    correctText: getCorrectAnswer(question),
    direction: isCorrect ? "match" : numericInput < expected ? "short" : "long",
  };
}

function edge(from: string, to: string, length: number, visible = true, inferred = false): TrackEdge {
  return {
    from,
    to,
    length,
    visible,
    inferred,
    label: visible ? String(length) : undefined,
  };
}

function makeQuestionBase(
  id: string,
  level: LevelId,
  kind: QuestionKind,
  shapeType: string,
  unit: MetricUnit,
  points: TrackPoint[],
  scenePoints: TrackPoint[] | undefined,
  edges: TrackEdge[],
  prompt: string,
  answer: number | MixedNumber,
  answerFormat: "number" | "mixed-number" = "number",
  storyTitle?: string,
  storyLine?: string,
  storyFocus?: "pitch" | "penalty-area" | "sideline" | "goalkeeper-box",
): PerimeterQuestion {
  return {
    id,
    level,
    kind,
    shapeType,
    storyTitle,
    storyLine,
    storyFocus,
    unit,
    points,
    scenePoints,
    edges,
    prompt,
    answer,
    answerFormat,
    tolerance: answerFormat === "mixed-number" ? 0.001 : 0.05,
    reportText: `${prompt} Shape: ${shapeType}. Correct answer: ${formatMetric(answer, unit)}.`,
  };
}

type LevelOneShape = {
  shapeType: string;
  prompt: string;
  build: (rng: Rng) => { points: TrackPoint[]; scenePoints?: TrackPoint[]; edges: TrackEdge[] };
  unit?: MetricUnit;
  storyTitle?: string;
  storyLine?: string;
  storyFocus?: "pitch" | "penalty-area" | "sideline" | "goalkeeper-box";
};

function levelOneShapes(): { easy: LevelOneShape[]; themed: LevelOneShape[] } {
  return {
    easy: [
      {
        shapeType: "playground rectangle",
        prompt: "Trace the playground rectangle. What is the perimeter?",
        build: (rng) => {
          const width = oneDecimal(pick(rng, [18, 19, 20, 21, 22, 23, 24]));
          const height = oneDecimal(pick(rng, [7, 8, 9, 10]));
          const points = fitPointsToViewBox([
            { id: "A", x: 0, y: 0 },
            { id: "B", x: width, y: 0 },
            { id: "C", x: width, y: height },
            { id: "D", x: 0, y: height },
          ]);
          const edges = [
            edge("A", "B", width),
            edge("B", "C", height),
            edge("C", "D", width, false, true),
            edge("D", "A", height, false, true),
          ];
          return { points, edges };
        },
      },
      {
        shapeType: "sports square",
        prompt: "Trace the sports square. What is the perimeter?",
        build: (rng) => {
          const side = oneDecimal(pick(rng, [12, 13, 14, 15, 16]));
          const points = buildSquareTrack(side);
          const edges = [
            edge("A", "B", side),
            edge("B", "C", side, false, true),
            edge("C", "D", side, false, true),
            edge("D", "A", side, false, true),
          ];
          return { points, edges };
        },
      },
      {
        shapeType: "park loop",
        prompt: "Trace the park loop. What is the perimeter?",
        build: (rng) => {
          const top = whole(rng, 22, 28);
          const right = whole(rng, 9, 12);
          const inset = whole(rng, 9, top - 9);
          const depth = whole(rng, 7, 11);
          const points = buildRectilinearLoopTrack(top, right, inset, depth);
          const edges = [
            edge("A", "B", top),
            edge("B", "C", right),
            edge("C", "D", top - inset),
            edge("D", "E", depth),
            edge("E", "F", inset),
            edge("F", "A", right + depth),
          ];
          return { points, edges };
        },
      },
      {
        shapeType: "garden track",
        prompt: "Trace the garden track. What is the perimeter?",
        build: (rng) => {
          const top = whole(rng, 21, 27);
          const right = whole(rng, 9, 12);
          const inset = whole(rng, 9, top - 9);
          const depth = whole(rng, 7, 10);
          const points = buildRectilinearLoopTrack(top, right, inset, depth);
          const edges = [
            edge("A", "B", top),
            edge("B", "C", right),
            edge("C", "D", top - inset),
            edge("D", "E", depth),
            edge("E", "F", inset),
            edge("F", "A", right + depth),
          ];
          return { points, edges };
        },
      },
      {
        shapeType: "corner path",
        prompt: "Trace the corner path. What is the perimeter?",
        build: (rng) => {
          const outerWidth = whole(rng, 22, 28);
          const outerHeight = whole(rng, 17, 21);
          const insetWidth = whole(rng, 9, outerWidth - 9);
          const insetHeight = whole(rng, 7, outerHeight - 7);
          const points = buildLShapeTrack(outerWidth, outerHeight, insetWidth, insetHeight);
          const edges = [
            edge("A", "B", outerWidth),
            edge("B", "C", insetHeight),
            edge("C", "D", outerWidth - insetWidth),
            edge("D", "E", outerHeight - insetHeight),
            edge("E", "F", insetWidth),
            edge("F", "A", outerHeight),
          ];
          return { points, edges };
        },
      },
    ],
    themed: [
      {
        shapeType: "football pitch",
        unit: "m",
        storyTitle: "Full Pitch",
        storyLine: "The whole ground becomes one big lap.",
        storyFocus: "pitch",
        prompt: "Trace the full football pitch. What is the perimeter?",
        build: () => {
          const pitch = footballRectangleQuestion(0, 0, FOOTBALL_PITCH.length, FOOTBALL_PITCH.width);
          return { points: pitch.points, scenePoints: pitch.scenePoints, edges: pitch.edges };
        },
      },
      {
        shapeType: "16-metre box",
        unit: "m",
        storyTitle: "16-Metre Box",
        storyLine: "We zoom into the big box near goal.",
        storyFocus: "penalty-area",
        prompt: "Trace the 16-metre box. What is the perimeter?",
        build: () => {
          const depth = 16.5;
          const boxWidth = 40.3;
          const top = (FOOTBALL_PITCH.width - boxWidth) / 2;
          const pitch = footballRectangleQuestion(0, top, depth, boxWidth);
          return { points: pitch.points, scenePoints: pitch.scenePoints, edges: pitch.edges };
        },
      },
      {
        shapeType: "touchline lap",
        unit: "m",
        storyTitle: "Touchline Lap",
        storyLine: "The white line keeps the whole game in play.",
        storyFocus: "sideline",
        prompt: "Trace the pitch boundary lap. What is the perimeter?",
        build: () => {
          const pitch = footballRectangleQuestion(0, 0, FOOTBALL_PITCH.length, FOOTBALL_PITCH.width);
          return { points: pitch.points, scenePoints: pitch.scenePoints, edges: pitch.edges };
        },
      },
      {
        shapeType: "goalkeeper box",
        unit: "m",
        storyTitle: "Goalkeeper Box",
        storyLine: "The 6-yard box is where the biggest saves happen.",
        storyFocus: "goalkeeper-box",
        prompt: "Trace the goalkeeper box. What is the perimeter?",
        build: () => {
          const depth = 5.5;
          const boxWidth = 18.32;
          const top = (FOOTBALL_PITCH.width - boxWidth) / 2;
          const pitch = footballRectangleQuestion(0, top, depth, boxWidth);
          return { points: pitch.points, scenePoints: pitch.scenePoints, edges: pitch.edges };
        },
      },
      {
        shapeType: "castle path",
        prompt: "Trace the castle path. What is the perimeter?",
        build: (rng) => {
          const top = whole(rng, 24, 30);
          const right = whole(rng, 10, 13);
          const inset = whole(rng, 11, top - 9);
          const depth = whole(rng, 8, 12);
          const points = buildRectilinearLoopTrack(top, right, inset, depth);
          const edges = [
            edge("A", "B", top),
            edge("B", "C", right),
            edge("C", "D", top - inset),
            edge("D", "E", depth),
            edge("E", "F", inset),
            edge("F", "A", right + depth),
          ];
          return { points, edges };
        },
      },
      {
        shapeType: "train track",
        prompt: "Trace the train track. What is the perimeter?",
        build: (rng) => {
          const length = whole(rng, 24, 30);
          const width = whole(rng, 8, 11);
          const points = buildRectTrack(length, width);
          const edges = [
            edge("A", "B", length),
            edge("B", "C", width),
            edge("C", "D", length, false, true),
            edge("D", "A", width, false, true),
          ];
          return { points, edges };
        },
      },
      {
        shapeType: "water park loop",
        prompt: "Trace the water park loop. What is the perimeter?",
        build: (rng) => {
          const top = whole(rng, 24, 30);
          const right = whole(rng, 10, 13);
          const inset = whole(rng, 11, top - 9);
          const depth = whole(rng, 8, 11);
          const points = buildRectilinearLoopTrack(top, right, inset, depth);
          const edges = [
            edge("A", "B", top),
            edge("B", "C", right),
            edge("C", "D", top - inset),
            edge("D", "E", depth),
            edge("E", "F", inset),
            edge("F", "A", right + depth),
          ];
          return { points, edges };
        },
      },
      {
        shapeType: "running oval",
        prompt: "Trace the running oval. What is the perimeter?",
        build: (rng) => {
          const length = whole(rng, 22, 28);
          const width = whole(rng, 10, 13);
          const points = fitPointsToViewBox([
            { id: "A", x: 0, y: 0 },
            { id: "B", x: length, y: 0 },
            { id: "C", x: length, y: width },
            { id: "D", x: 0, y: width },
          ]);
          const edges = [
            edge("A", "B", length),
            edge("B", "C", width),
            edge("C", "D", length, false, true),
            edge("D", "A", width, false, true),
          ];
          return { points, edges };
        },
      },
      {
        shapeType: "mini golf loop",
        prompt: "Trace the mini golf loop. What is the perimeter?",
        build: (rng) => {
          const top = whole(rng, 22, 28);
          const right = whole(rng, 9, 12);
          const inset = whole(rng, 9, top - 9);
          const depth = whole(rng, 7, 10);
          const points = buildRectilinearLoopTrack(top, right, inset, depth);
          const edges = [
            edge("A", "B", top),
            edge("B", "C", right),
            edge("C", "D", top - inset),
            edge("D", "E", depth),
            edge("E", "F", inset),
            edge("F", "A", right + depth),
          ];
          return { points, edges };
        },
      },
    ],
  };
}

function levelOneQuestion(rng: Rng, id: string, template?: LevelOneShape): PerimeterQuestion {
  const pools = levelOneShapes();
  const pool = template
    ? [template]
    : rng() < 0.5
      ? pools.easy
      : pools.themed;
  const shape = template ?? pick(rng, pool);
  const { points, scenePoints, edges } = shape.build(rng);
  return makeQuestionBase(
    id,
    1,
    "trace-perimeter",
    shape.shapeType,
    shape.unit ?? pick<MetricUnit>(rng, ["m", "cm"]),
    points,
    scenePoints,
    edges,
    shape.prompt,
    sumEdges(edges),
    "number",
    shape.storyTitle,
    shape.storyLine,
    shape.storyFocus,
  );
}

function rectangleQuestion(rng: Rng, id: string, missing = false): PerimeterQuestion {
  const length = oneDecimal(pick(rng, [8, 9, 10, 11, 12, 13, 14, 15, 8.5, 10.5, 12.5]));
  const width = oneDecimal(pick(rng, [4, 5, 6, 7, 8, 4.5, 5.5, 7.5]));
  const perimeter = oneDecimal(2 * (length + width));
  const points = buildRectTrack(length, width);
  const edges = [
    edge("A", "B", length),
    edge("B", "C", width, !missing),
    edge("C", "D", length, false, true),
    edge("D", "A", width, false, true),
  ];
  if (missing) {
    return makeQuestionBase(
      id,
      2,
      "missing-side",
      "rectangle",
      "m",
      points,
      undefined,
      edges,
      `A rectangle track has perimeter ${perimeter} m and length ${length} m. What is the width?`,
      rectangleMissingSide(perimeter, length),
    );
  }
  return makeQuestionBase(id, 2, "standard-shape-perimeter", "rectangle", "m", points, undefined, edges, "Trace the rectangle. What is the perimeter?", perimeter);
}

function parallelogramQuestion(rng: Rng, id: string, missing = false): PerimeterQuestion {
  const base = oneDecimal(pick(rng, [8, 9, 10, 11, 12, 13, 14, 15, 8.5, 10.5, 12.5]));
  const side = oneDecimal(pick(rng, [4, 5, 6, 7, 8, 4.5, 5.5, 6.5]));
  const perimeter = oneDecimal(2 * (base + side));
  const points = buildParallelogramTrack(base, side);
  const edges = [
    edge("A", "B", base),
    edge("B", "C", side, !missing),
    edge("C", "D", base, false, true),
    edge("D", "A", side, false, true),
  ];
  if (missing) {
    return makeQuestionBase(
      id,
      2,
      "missing-side",
      "parallelogram",
      "cm",
      points,
      undefined,
      edges,
      `A parallelogram has a perimeter of ${perimeter} cm and a base of ${base} cm. What is the other side length?`,
      rectangleMissingSide(perimeter, base),
    );
  }
  return makeQuestionBase(id, 2, "standard-shape-perimeter", "parallelogram", "cm", points, undefined, edges, "Trace the parallelogram. What is the perimeter?", perimeter);
}

function trapezoidQuestion(rng: Rng, id: string, missing = false): PerimeterQuestion {
  const top = oneDecimal(pick(rng, [5, 6, 7, 8, 9, 10, 6.5, 7.5, 8.5]));
  const bottom = oneDecimal(top + pick(rng, [3, 4, 5, 6, 7]));
  const leg = oneDecimal(pick(rng, [4.5, 5.5, 6.5, 7.5, 8.5, 9.5]));
  const perimeter = oneDecimal(top + bottom + leg * 2);
  const points = buildTrapezoidTrack(top, bottom, leg);
  const edges = [
    edge("A", "B", top, !missing),
    edge("B", "C", leg),
    edge("C", "D", bottom),
    edge("D", "A", leg, false, true),
  ];
  if (missing) {
    return makeQuestionBase(
      id,
      2,
      "missing-side",
      "trapezoid",
      "m",
      points,
      undefined,
      edges,
      `A trapezoid has a perimeter of ${perimeter} m. Three sides are shown. What is the missing side?`,
      oneDecimal(perimeter - bottom - leg * 2),
    );
  }
  return makeQuestionBase(id, 2, "standard-shape-perimeter", "trapezoid", "m", points, undefined, edges, "Trace the trapezoid. What is the perimeter?", perimeter);
}

function levelTwo(rng: Rng, id: string): PerimeterQuestion {
  const variant = pick(rng, ["square", "rectangle", "triangle", "parallelogram", "trapezoid", "l-shape", "missing"]);
  if (variant === "rectangle" || variant === "missing") return rectangleQuestion(rng, id, variant === "missing");
  if (variant === "square") {
    const side = pick(rng, [6, 7, 8, 9, 10, 7.5, 8.5]);
    const points = buildSquareTrack(side);
    const edges = [edge("A", "B", side), edge("B", "C", side, false, true), edge("C", "D", side, false, true), edge("D", "A", side, false, true)];
    return makeQuestionBase(id, 2, "standard-shape-perimeter", "square", "cm", points, undefined, edges, "A square track has four equal sides. What is the perimeter?", oneDecimal(side * 4));
  }
  if (variant === "parallelogram") return parallelogramQuestion(rng, id);
  if (variant === "trapezoid") return trapezoidQuestion(rng, id);
  if (variant === "triangle") {
    const triples: Array<[number, number, number]> = [
      [5, 12, 13],
      [6, 8, 10],
      [8, 15, 17],
      [9, 12, 15],
    ];
    const [base, height, hypotenuse] = pick(rng, triples);
    const points = buildRightTriangleTrack(base, height);
    const edges = [edge("A", "B", base), edge("B", "C", hypotenuse), edge("C", "A", height)];
    return makeQuestionBase(id, 2, "standard-shape-perimeter", "triangle", "m", points, undefined, edges, "Trace the triangle. What is the perimeter?", sumEdges(edges));
  }
  const outerWidth = whole(rng, 12, 17);
  const outerHeight = whole(rng, 10, 16);
  const insetWidth = whole(rng, 4, outerWidth - 4);
  const insetHeight = whole(rng, 4, outerHeight - 4);
  const points = buildLShapeTrack(outerWidth, outerHeight, insetWidth, insetHeight);
  const edges = [
    edge("A", "B", outerWidth),
    edge("B", "C", insetHeight),
    edge("C", "D", outerWidth - insetWidth),
    edge("D", "E", outerHeight - insetHeight),
    edge("E", "F", insetWidth),
    edge("F", "A", outerHeight),
  ];
  return makeQuestionBase(id, 2, "standard-shape-perimeter", "L-shape", "m", points, undefined, edges, "Trace the L-shaped track. What is the perimeter?", sumEdges(edges));
}

function levelThree(rng: Rng, id: string): PerimeterQuestion {
  const variant = pick(rng, ["rectMissing", "squareMissing", "parallelogramMissing", "trapezoidMissing", "mixedParallelogram"]);
  if (variant === "rectMissing") {
    const length = oneDecimal(pick(rng, [12.4, 15.6, 17.8, 21.3]));
    const width = oneDecimal(pick(rng, [4.8, 6.7, 7.5, 9.2]));
    const perimeter = oneDecimal(2 * (length + width));
    const points = buildRectTrack(length, width);
    const edges = [
      edge("A", "B", length),
      edge("B", "C", width, false, true),
      edge("C", "D", length, false, true),
      edge("D", "A", width, false, true),
    ];
    return makeQuestionBase(
      id,
      3,
      "missing-side",
      "rectangle",
      "m",
      points,
      undefined,
      edges,
      `A rectangle has a perimeter of ${perimeter} m and a length of ${length} m. What is the width?`,
      width,
    );
  }
  if (variant === "squareMissing") {
    const side = oneDecimal(pick(rng, [8.4, 10.6, 12.2, 15.3]));
    const perimeter = oneDecimal(side * 4);
    const points = buildSquareTrack(side);
    const edges = [edge("A", "B", side, false, true), edge("B", "C", side, false, true), edge("C", "D", side, false, true), edge("D", "A", side, false, true)];
    return makeQuestionBase(id, 3, "missing-side", "square", "cm", points, undefined, edges, `A square has a perimeter of ${perimeter} cm. What is the length of each side?`, squareSide(perimeter));
  }
  if (variant === "parallelogramMissing") {
    const base = oneDecimal(pick(rng, [12.4, 15.6, 17.8, 21.3]));
    const side = oneDecimal(pick(rng, [4.8, 6.7, 7.5, 9.2]));
    const perimeter = oneDecimal(2 * (base + side));
    const points = buildParallelogramTrack(base, side);
    const edges = [
      edge("A", "B", base),
      edge("B", "C", side, false, true),
      edge("C", "D", base, false, true),
      edge("D", "A", side, false, true),
    ];
    return makeQuestionBase(
      id,
      3,
      "missing-side",
      "parallelogram",
      "m",
      points,
      undefined,
      edges,
      `A parallelogram has a perimeter of ${perimeter} m and a base of ${base} m. What is the side length?`,
      rectangleMissingSide(perimeter, base),
    );
  }
  if (variant === "trapezoidMissing") {
    const top = oneDecimal(pick(rng, [8.2, 10.4, 12.6, 14.8]));
    const leg = oneDecimal(pick(rng, [4.6, 5.8, 6.2, 7.4]));
    const bottom = oneDecimal(top + pick(rng, [3, 4, 5, 6]));
    const perimeter = oneDecimal(top + bottom + leg * 2);
    const points = buildTrapezoidTrack(top, bottom, leg);
    const edges = [
      edge("A", "B", top, false, true),
      edge("B", "C", leg),
      edge("C", "D", bottom),
      edge("D", "A", leg),
    ];
    return makeQuestionBase(
      id,
      3,
      "missing-side",
      "trapezoid",
      "m",
      points,
      undefined,
      edges,
      `A trapezoid has a perimeter of ${perimeter} m and three sides shown. What is the missing side?`,
      oneDecimal(perimeter - bottom - leg * 2),
    );
  }
  const denominator = pick(rng, [2, 4, 5, 10]);
  const base: MixedNumber = {
    whole: whole(rng, 3, 7),
    numerator: whole(rng, 1, denominator - 1),
    denominator,
  };
  const side: MixedNumber = {
    whole: whole(rng, 2, 6),
    numerator: whole(rng, 1, denominator - 1),
    denominator,
  };
  const baseValue = mixedToNumber(base);
  const sideValue = mixedToNumber(side);
  const points = buildParallelogramTrack(baseValue, sideValue);
  const edges = [
    edge("A", "B", baseValue, true),
    edge("B", "C", sideValue, true),
    edge("C", "D", baseValue, true),
    edge("D", "A", sideValue, true),
  ];
  edges[0].label = formatMixed(base);
  edges[1].label = formatMixed(side);
  edges[2].label = formatMixed(base);
  edges[3].label = formatMixed(side);
  return makeQuestionBase(id, 3, "mixed-number-perimeter", "worksheet parallelogram", "m", points, undefined, edges, "Find the perimeter. Write your answer as a mixed number.", sumEdges(edges), "mixed-number");
}

export function makeQuestion(level: LevelId, seed?: string): PerimeterQuestion {
  const rng = rngFor(seed);
  const id = `${level}-${seed ?? Math.round(rng() * 1_000_000)}`;
  if (level === 1) return levelOneQuestion(rng, id);
  if (level === 2) return levelTwo(rng, id);
  return levelThree(rng, id);
}

export function makeRound(level: LevelId, count = 10, seed?: string): PerimeterQuestion[] {
  if (level !== 1) {
    return Array.from({ length: count }, (_, index) => makeQuestion(level, `${seed ?? "round"}-${level}-${index}`));
  }

  const baseRng = rngFor(seed ?? `round-${level}`);
  const pools = levelOneShapes();
  const easyTemplates = shuffle(baseRng, pools.easy);
  const themedTemplates = shuffle(baseRng, pools.themed);
  const footballOrder: Array<NonNullable<LevelOneShape["storyFocus"]>> = [
    "pitch",
    "penalty-area",
    "sideline",
    "goalkeeper-box",
  ];
  const footballTemplates = footballOrder
    .map((focus) => themedTemplates.find((template) => template.storyFocus === focus) ?? pools.themed.find((template) => template.storyFocus === focus))
    .filter((template): template is LevelOneShape => Boolean(template));
  const nonFootballTemplates = themedTemplates.filter((template) => !template.storyFocus);
  return Array.from({ length: count }, (_, index) => {
    const questionSeed = `${seed ?? "round"}-${level}-${index}`;
    const questionRng = rngFor(questionSeed);
    let template: LevelOneShape;
    if (index < 5) {
      template = easyTemplates[index % easyTemplates.length];
    } else if (index >= 6 && footballTemplates[index - 6]) {
      template = footballTemplates[index - 6];
    } else {
      const themedIndex = index < 6 ? index - 5 : index - 6;
      const themedPool = nonFootballTemplates.length > 0
        ? nonFootballTemplates
        : pools.themed.filter((shape) => !shape.storyFocus);
      const offset = themedPool.length === 0 ? 0 : themedIndex % themedPool.length;
      template = themedPool[offset];
    }
    const id = `${level}-${questionSeed}`;
    return levelOneQuestion(questionRng, id, template);
  });
}
