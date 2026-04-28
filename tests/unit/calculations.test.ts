import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  compareAnswer,
  getCorrectAnswer,
  makeQuestion,
  makeRound,
  mixedToNumber,
  type PerimeterQuestion,
  type MixedNumber,
  rectangleMissingSide,
  squareSide,
  sumEdges,
  validateAnswer,
} from "../../src/game/perimeterLogic.ts";

describe("Perimeter logic", () => {
  it("generates closed questions whose perimeter answer matches the edge sum", () => {
    for (const level of [1, 2] as const) {
      const round = makeRound(level, 10, `sum-${level}`);
      for (const question of round) {
        if (question.kind !== "missing-side") {
          assert.equal(Number(question.answer), sumEdges(question.edges));
        }
        assert.equal(question.edges.at(-1)?.to, question.points[0].id);
      }
    }
  });

  it("uses multiple distinct shape types in level 1 rounds", () => {
    const round = makeRound(1, 10, "shape-variety");
    const distinctShapes = new Set(round.map((question) => question.shapeType));
    assert.ok(distinctShapes.size >= 4);
  });

  it("locks the soccer field into the 7th level 1 round slot", () => {
    const round = makeRound(1, 10, "soccer-slot");
    assert.equal(round[6]?.shapeType, "soccer field");
    assert.equal(round[6]?.unit, "m");
  });

  it("keeps level 1 edges large enough to show clear movement", () => {
    const round = makeRound(1, 10, "level1-readable");
    const shortestEdge = Math.min(...round.flatMap((question) => question.edges.map((edge) => edge.length)));
    assert.ok(shortestEdge >= 6);
  });

  it("inverts rectangle and square missing-side formulas", () => {
    assert.equal(rectangleMissingSide(49.6, 17.8), 7);
    assert.equal(squareSide(61.2), 15.3);
  });

  it("accepts mixed-number and equivalent decimal answers", () => {
    const question: PerimeterQuestion = {
      id: "mixed-test",
      level: 3,
      kind: "mixed-number-perimeter",
      shapeType: "worksheet quadrilateral",
      unit: "m",
      points: [{ id: "A", x: 0, y: 0 }],
      edges: [],
      prompt: "Find the perimeter.",
      answer: { whole: 8, numerator: 2, denominator: 5 },
      answerFormat: "mixed-number",
      tolerance: 0.001,
      reportText: "Find the perimeter.",
    };
    assert.equal(compareAnswer(getCorrectAnswer(question), question.answer, question.tolerance), true);
    assert.equal(validateAnswer(question, String(mixedToNumber(question.answer as MixedNumber))).isCorrect, true);
  });

  it("rejects negative input", () => {
    const question = makeQuestion(1, "negative");
    assert.equal(validateAnswer(question, `-${getCorrectAnswer(question)}`).isCorrect, false);
  });
});
