import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import html2canvas from "html2canvas";
import GameLayout from "../components/GameLayout";
import DemoIntroOverlay from "../components/DemoIntroOverlay";
import LapTotalHud from "../components/LapTotalHud";
import PerimeterScene from "../components/PerimeterScene";
import PhantomHand from "../components/PhantomHand";
import SessionReportModal from "../components/SessionReportModal";
import { useAutopilot, type AutopilotCallbacks, type ModalAutopilotControls } from "../hooks/useAutopilot";
import { useCheatCodes } from "../hooks/useCheatCode";
import { useDemoRecorder, type DemoRecorderCallbacks } from "../hooks/useDemoRecorder";
import { getDemoConfig } from "../demoMode";
import { startSession, startQuestionTimer, logAttempt, buildSummary, type SessionSummary } from "../report/sessionLog";
import {
  isMuted,
  playCameraShutter,
  playButton,
  playCorrect,
  playLevelComplete,
  playWrong,
  fadeOutRecordingSoundtrack,
  startRecordingSoundtrack,
  shuffleMusic,
  startMusic,
  toggleMute,
} from "../sound";
import {
  getCorrectAnswer,
  makeRound,
  mixedToNumber,
  validateAnswer,
  type LevelId,
  type PerimeterQuestion,
} from "../game/perimeterLogic";

const QUESTIONS_PER_LEVEL = 10;
const LEVEL_COUNT = 3;
const AUTOPILOT_EMAIL = "amarsh.anand@gmail.com";
const IS_LOCALHOST_DEV = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

type GamePhase = "tapping" | "answering" | "feedback" | "levelComplete";
type FeedbackKind = "idle" | "correct" | "short" | "long";
type SnipSelection = { x: number; y: number; size: number };
type SnipDragState = {
  mode: "move" | "resize";
  pointerId: number;
  startX: number;
  startY: number;
  initial: SnipSelection;
};

type Point = { x: number; y: number; t?: number };
type TraceAnimation = {
  frameId: number;
  from: Point;
  to: Point;
  nextTraceCount: number;
};

function numericAnswer(question: PerimeterQuestion) {
  return typeof question.answer === "number" ? question.answer : mixedToNumber(question.answer);
}

function questionPromptForPhase(question: PerimeterQuestion, phase: GamePhase, tracedCount: number, feedbackText: string) {
  if (phase === "feedback") return feedbackText;
  if (phase === "levelComplete") return "Level complete!";
  if (question.level === 1) return question.prompt;
  if (question.level === 3) return question.prompt;
  if (phase === "answering") return question.kind === "missing-side" ? "Find the missing side." : "What is the perimeter?";
  return `Ball journey (${tracedCount}/${question.edges.length})`;
}

function SoccerBallIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 28 28" className="h-3 w-3" aria-hidden="true">
      <circle cx="14" cy="14" r="11" fill={active ? "#dcfce7" : "#ffffff"} stroke={active ? "#22c55e" : "#475569"} strokeWidth="1.4" />
      <circle cx="14" cy="14" r="2.1" fill={active ? "#16a34a" : "#475569"} />
    </svg>
  );
}

function toSvgPoint(node: SVGSVGElement, clientX: number, clientY: number): Point {
  const rect = node.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * 1000,
    y: ((clientY - rect.top) / rect.height) * 620,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function projectToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy || 1;
  const rawT = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  const t = clamp(rawT, 0, 1);
  return {
    x: start.x + dx * t,
    y: start.y + dy * t,
    t,
  };
}

function pointDistance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export default function PerimeterScreen() {
  const demo = getDemoConfig();
  const [muted, setMuted] = useState(isMuted());
  const [level, setLevel] = useState<LevelId>(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [questions, setQuestions] = useState(() => makeRound(1, QUESTIONS_PER_LEVEL, "initial"));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("tapping");
  const [tracedCount, setTracedCount] = useState(0);
  const [answerInput, setAnswerInput] = useState("");
  const [progress, setProgress] = useState(0);
  const [attemptsForQuestion, setAttemptsForQuestion] = useState(0);
  const [deductedThisQuestion, setDeductedThisQuestion] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackKind>("idle");
  const [feedbackText, setFeedbackText] = useState("");
  const [questionShake, setQuestionShake] = useState(false);
  const [runnerPos, setRunnerPos] = useState<Point>(() => ({ x: 0, y: 0 }));
  const [runnerDragging, setRunnerDragging] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [snipMode, setSnipMode] = useState(false);
  const [snipSelection, setSnipSelection] = useState<SnipSelection | null>(null);
  const [captureFlashVisible, setCaptureFlashVisible] = useState(false);
  const [autopilotMode, setAutopilotMode] = useState<"continuous" | "single-question">("continuous");

  const canvasRef = useRef<HTMLDivElement>(null);
  const snipDragRef = useRef<SnipDragState | null>(null);
  const captureFlashTimerRef = useRef<number | null>(null);
  const traceAnimationRef = useRef<TraceAnimation | null>(null);
  const musicStartedRef = useRef(false);
  const questionRef = useRef(questions[0]);
  const tracedCountRef = useRef(0);
  const runnerPosRef = useRef<Point>({ x: 0, y: 0 });
  const runnerDraggingRef = useRef(false);
  const runnerPointerIdRef = useRef<number | null>(null);
  const modalControlsRef = useRef<ModalAutopilotControls | null>(null);
  const autopilotCallbacksRef = useRef<AutopilotCallbacks | null>(null);
  const demoRecorderCallbacksRef = useRef<DemoRecorderCallbacks | null>(null);

  const question = questions[questionIndex] ?? questions[0];
  questionRef.current = question;
  tracedCountRef.current = tracedCount;
  const activePointId = question.points[tracedCount % question.points.length]?.id ?? question.points[0].id;
  const tracedEdges = question.edges.slice(0, tracedCount);
  const checkpointBoxes = Array.from({ length: question.edges.length }, (_, index) => index < tracedCount);
  const perimeterDisplay =
    phase === "answering"
      ? answerInput.trim() || " "
      : phase === "feedback" && feedback === "correct"
        ? getCorrectAnswer(question)
        : " ";

  function ensureMusic() {
    if (!musicStartedRef.current) {
      musicStartedRef.current = true;
      startMusic();
    }
  }

  useEffect(() => {
    function startMusicOnFirstInteraction() {
      ensureMusic();
      window.removeEventListener("pointerdown", startMusicOnFirstInteraction);
      window.removeEventListener("keydown", startMusicOnFirstInteraction);
    }
    window.addEventListener("pointerdown", startMusicOnFirstInteraction, { once: true });
    window.addEventListener("keydown", startMusicOnFirstInteraction, { once: true });
    return () => {
      window.removeEventListener("pointerdown", startMusicOnFirstInteraction);
      window.removeEventListener("keydown", startMusicOnFirstInteraction);
    };
  }, []);

  const startLevel = useCallback((nextLevel: LevelId) => {
    if (traceAnimationRef.current) {
      window.cancelAnimationFrame(traceAnimationRef.current.frameId);
      traceAnimationRef.current = null;
    }
    const nextQuestions = makeRound(nextLevel, QUESTIONS_PER_LEVEL, `level-${nextLevel}-${Date.now()}`);
    const firstPoint = nextQuestions[0]?.points[0] ?? { x: 0, y: 0 };
    setLevel(nextLevel);
    setQuestions(nextQuestions);
    setQuestionIndex(0);
    setPhase(nextLevel === 3 ? "answering" : "tapping");
    setTracedCount(0);
    const startPoint = { ...firstPoint, t: 0 };
    setRunnerPos(startPoint);
    runnerPosRef.current = startPoint;
    setRunnerDragging(false);
    runnerDraggingRef.current = false;
    setAnswerInput("");
    setProgress(0);
    setAttemptsForQuestion(0);
    setDeductedThisQuestion(false);
    setFeedback("idle");
    setFeedbackText("");
    setSessionSummary(null);
    startSession();
    startQuestionTimer();
  }, []);

  useEffect(() => {
    startLevel(1);
  }, [startLevel]);

  function handleRestart() {
    shuffleMusic();
    setUnlockedLevel(1);
    startLevel(1);
  }

  function handleLevelSelect(rawLevel: number) {
    startLevel(rawLevel as LevelId);
  }

  function startNextQuestion() {
    const nextIndex = questionIndex + 1;
    if (nextIndex >= QUESTIONS_PER_LEVEL) {
      playLevelComplete();
      setUnlockedLevel((value) => Math.min(LEVEL_COUNT, Math.max(value, level + 1)));
      setSessionSummary(buildSummary({
        playerName: "Explorer",
        level,
        normalEggs: QUESTIONS_PER_LEVEL,
        monsterEggs: 0,
        levelCompleted: true,
        monsterRoundCompleted: false,
      }));
      setPhase("levelComplete");
      return;
    }
    setQuestionIndex(nextIndex);
    setPhase(level === 3 ? "answering" : "tapping");
    setTracedCount(0);
    const firstPoint = questions[nextIndex]?.points[0] ?? question.points[0];
    const startPoint = { ...firstPoint, t: 0 };
    setRunnerPos(startPoint);
    runnerPosRef.current = startPoint;
    setRunnerDragging(false);
    runnerDraggingRef.current = false;
    setAnswerInput("");
    setAttemptsForQuestion(0);
    setDeductedThisQuestion(false);
    setFeedback("idle");
    setFeedbackText("");
    startQuestionTimer();
  }

  const finishTraceStep = useCallback((nextCount: number) => {
    setTracedCount(nextCount);
    tracedCountRef.current = nextCount;
    if (nextCount >= questionRef.current.edges.length) {
      window.setTimeout(() => {
        setPhase("answering");
        setAnswerInput("");
      }, 280);
    }
  }, []);

  const advanceTrace = useCallback(() => {
    if (phase !== "tapping") return;
    if (traceAnimationRef.current) return;
    ensureMusic();
    playButton();

    const currentQuestion = questionRef.current;
    const currentIndex = tracedCountRef.current;
    const edge = currentQuestion.edges[currentIndex % currentQuestion.edges.length];
    if (!edge) return;

    const toPoint = currentQuestion.points.find((item) => item.id === edge.to) ?? currentQuestion.points[0];
    const start = { ...runnerPosRef.current, t: 0 };
    const end = { ...toPoint, t: 1 };
    const duration = currentQuestion.level === 1
      ? Math.max(840, Math.min(1350, 560 + edge.length * 30))
      : Math.max(720, Math.min(1200, 520 + edge.length * 28));
    const startedAt = performance.now();
    const nextCount = Math.min(currentIndex + 1, currentQuestion.edges.length);

    const step = (now: number) => {
      const rawT = Math.min(1, (now - startedAt) / duration);
      const easedT = easeInOutCubic(rawT);
      const orb = {
        x: start.x + (end.x - start.x) * easedT,
        y: start.y + (end.y - start.y) * easedT,
        t: easedT,
      };
      setRunnerPos(orb);
      runnerPosRef.current = orb;

      if (rawT < 1) {
        traceAnimationRef.current = {
          frameId: window.requestAnimationFrame(step),
          from: start,
          to: end,
          nextTraceCount: nextCount,
        };
        return;
      }

      traceAnimationRef.current = null;
      const landed = { ...end, t: 1 };
      setRunnerPos(landed);
      runnerPosRef.current = landed;
      finishTraceStep(nextCount);
    };

    traceAnimationRef.current = {
      frameId: window.requestAnimationFrame(step),
      from: start,
      to: end,
      nextTraceCount: nextCount,
    };
  }, [ensureMusic, finishTraceStep, phase]);

  function handleCheckpoint(pointId: string) {
    if (phase !== "tapping") return;
    const expectedPoint = question.edges[tracedCount % question.edges.length]?.to;
    if (pointId === expectedPoint) {
      advanceTrace();
      return;
    }
    playWrong();
    setQuestionShake(true);
    window.setTimeout(() => setQuestionShake(false), 320);
  }

  function handleRunnerPointerDown(event: ReactPointerEvent<SVGGElement>) {
    if (phase !== "tapping") return;
    const svg = canvasRef.current?.querySelector("svg");
    if (!(svg instanceof SVGSVGElement)) return;
    const edge = question.edges[tracedCount % question.edges.length];
    if (!edge) return;
    event.preventDefault();
    event.stopPropagation();
    runnerDraggingRef.current = true;
    setRunnerDragging(true);
    runnerPointerIdRef.current = event.pointerId;
    const point = toSvgPoint(svg, event.clientX, event.clientY);
    const start = question.points.find((item) => item.id === edge.from) ?? question.points[0];
    const end = question.points.find((item) => item.id === edge.to) ?? question.points[0];
    const projection = projectToSegment(point, start, end);
    setRunnerPos(projection);
    runnerPosRef.current = projection;
  }

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      if (!runnerDraggingRef.current) return;
      const svg = canvasRef.current?.querySelector("svg");
      if (!(svg instanceof SVGSVGElement)) return;
      const edge = questionRef.current.edges[tracedCountRef.current % questionRef.current.edges.length];
      if (!edge) return;
      const start = questionRef.current.points.find((item) => item.id === edge.from) ?? questionRef.current.points[0];
      const end = questionRef.current.points.find((item) => item.id === edge.to) ?? questionRef.current.points[0];
      const projection = projectToSegment(toSvgPoint(svg, event.clientX, event.clientY), start, end);
      setRunnerPos(projection);
      runnerPosRef.current = projection;
    }

    function onPointerUp(event: PointerEvent) {
      if (!runnerDraggingRef.current) return;
      if (runnerPointerIdRef.current !== null && runnerPointerIdRef.current !== event.pointerId) return;
      runnerDraggingRef.current = false;
      runnerPointerIdRef.current = null;
      setRunnerDragging(false);
      const edge = questionRef.current.edges[tracedCountRef.current % questionRef.current.edges.length];
      if (!edge) return;
      const nextPoint = questionRef.current.points.find((item) => item.id === edge.to) ?? questionRef.current.points[0];
      if (pointDistance(runnerPosRef.current, nextPoint) <= 34 || (runnerPosRef.current.t ?? 0) >= 0.85) {
        advanceTrace();
        return;
      }
      const currentPoint = questionRef.current.points.find((item) => item.id === edge.from) ?? questionRef.current.points[0];
      const checkpoint = { ...currentPoint, t: 0 };
      setRunnerPos(checkpoint);
      runnerPosRef.current = checkpoint;
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [advanceTrace]);

  const submitAnswer = useCallback((overrideValue?: string) => {
    if (phase !== "answering") return;
    const current = questionRef.current;
    const raw = overrideValue ?? answerInput;
    const result = validateAnswer(current, raw);
    if (result.numericInput === null) return;
    const nextAttemptCount = attemptsForQuestion + 1;
    setAttemptsForQuestion(nextAttemptCount);
    logAttempt({
      prompt: current.reportText,
      level,
      correctAnswer: getCorrectAnswer(current),
      childAnswer: raw,
      isCorrect: result.isCorrect,
      gamePhase: "normal",
      ripplePositions: current.points.map((point) => ({
        x: Math.round(point.x / 10),
        y: Math.round(point.y / 6.2),
        color: result.isCorrect ? "#22c55e" : "#ef4444",
      })),
      diagramPoints: current.points.map((point) => ({ ...point })),
      diagramEdges: current.edges.map((edge) => ({ ...edge })),
      unit: current.unit,
      shapeType: current.shapeType,
      sideLengths: current.edges.map((edge) => `${edge.length} ${current.unit}`),
      attempts: nextAttemptCount,
    });

    if (result.isCorrect) {
      playCorrect();
      setFeedback("correct");
      setFeedbackText("Correct. The runner completed the lap.");
      setProgress((value) => Math.min(QUESTIONS_PER_LEVEL, value + 1));
      setPhase("feedback");
      window.setTimeout(startNextQuestion, 950);
      return;
    }

    playWrong();
    setQuestionShake(true);
    window.setTimeout(() => setQuestionShake(false), 360);
    if (!deductedThisQuestion) {
      setProgress((value) => Math.max(0, value - 1));
      setDeductedThisQuestion(true);
    }
    setFeedback(result.direction === "long" ? "long" : "short");
    setFeedbackText(result.direction === "long" ? "Too long. The runner skidded past the finish." : "Too short. The runner ran out of energy.");
    setPhase("feedback");
    window.setTimeout(() => {
      setPhase("answering");
      setFeedback("idle");
    }, 1100);
  }, [answerInput, attemptsForQuestion, deductedThisQuestion, level, phase, progress, questionIndex]);

  const submitAnswerRef = useRef(submitAnswer);
  submitAnswerRef.current = submitAnswer;

  const { isActive: isAutopilot, activate: activateAutopilot, deactivate: deactivateAutopilot, phantomPos } =
    useAutopilot({
      mode: autopilotMode,
      gameState: {
        phase,
        targetTaps: Math.round(numericAnswer(question)),
        traceTarget: question.edges.length,
        answerText: getCorrectAnswer(question),
        tapCount: tracedCount,
        level,
        levelCount: LEVEL_COUNT,
      },
      callbacksRef: autopilotCallbacksRef,
      canvasRef,
      autopilotEmail: AUTOPILOT_EMAIL,
    });

  autopilotCallbacksRef.current = {
    simulateTap: advanceTrace,
    setCalcValue: setAnswerInput,
    submitAnswer: (overrideValue) => submitAnswerRef.current(overrideValue),
    goNextLevel: () => startLevel(Math.min(level + 1, LEVEL_COUNT) as LevelId),
    playAgain: () => startLevel(1),
    restartAll: handleRestart,
    emailModalControls: modalControlsRef,
    onAutopilotComplete: () => {
      if (recordingPhase !== "idle") {
        showOutro();
      }
      deactivateAutopilot();
    },
  };

  const { processCheatKey } = useCheatCodes({
    "197879": () => {
      if (phase !== "answering") return;
      const correct = getCorrectAnswer(questionRef.current);
      setAnswerInput(correct);
      requestAnimationFrame(() => submitAnswerRef.current(correct));
    },
    "198081": () => {
      if (isAutopilot && autopilotMode === "continuous") {
        deactivateAutopilot();
        return;
      }
      setAutopilotMode("continuous");
      activateAutopilot();
    },
  });

  function handleKeypadCheatInput(key: string) {
    if (key === "\u00b1") return true;
    return processCheatKey(key);
  }

  function handleQuestionDemo() {
    if (isAutopilot) {
      deactivateAutopilot();
      return;
    }
    setAutopilotMode("single-question");
    activateAutopilot();
  }

  const {
    recordingPhase,
    isRecording: isDemoRecording,
    startRecording,
    onIntroComplete,
    showOutro,
    onOutroComplete,
  } = useDemoRecorder(demoRecorderCallbacksRef);

  useEffect(() => {
    demoRecorderCallbacksRef.current = {
      onStartPlaying: () => {
        handleRestart();
        window.requestAnimationFrame(() => {
          setAutopilotMode("continuous");
          activateAutopilot();
        });
      },
      prepareAudio: () => {
        startRecordingSoundtrack();
      },
      cleanupAudio: () => {
        fadeOutRecordingSoundtrack(240);
      },
    };
  }, [activateAutopilot]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key >= "0" && event.key <= "9") {
        event.preventDefault();
        setAnswerInput((value) => (value === "0" ? event.key : value + event.key));
      } else if (event.key === "." || event.key === "/" || event.key === " ") {
        event.preventDefault();
        setAnswerInput((value) => value + event.key);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        setAnswerInput((value) => value.slice(0, -1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        submitAnswerRef.current();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function downloadCanvasPng(canvas: HTMLCanvasElement, fileName: string) {
    await new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Unable to encode PNG"));
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        resolve();
      }, "image/png");
    });
  }

  async function renderSceneCanvas(scale: number) {
    if (!canvasRef.current) throw new Error("Canvas unavailable");
    return await html2canvas(canvasRef.current, { scale, useCORS: true, backgroundColor: null });
  }

  async function handleCaptureScene() {
    if (!IS_LOCALHOST_DEV) return;
    const canvas = await renderSceneCanvas(2);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await downloadCanvasPng(canvas, `perimeter-scene-${stamp}.png`);
  }

  function makeDefaultSnipSelection() {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const size = Math.max(96, Math.min(Math.min(rect.width, rect.height) * 0.48, 220));
    return { x: (rect.width - size) / 2, y: (rect.height - size) / 2, size };
  }

  function clampSnipSelection(next: SnipSelection) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return next;
    const size = Math.max(72, Math.min(next.size, Math.min(rect.width, rect.height)));
    return {
      x: Math.min(Math.max(0, next.x), rect.width - size),
      y: Math.min(Math.max(0, next.y), rect.height - size),
      size,
    };
  }

  function toggleSnipMode() {
    if (!IS_LOCALHOST_DEV) return;
    setSnipMode((active) => !active);
  }

  function closeSnipMode() {
    snipDragRef.current = null;
    setSnipMode(false);
  }

  async function handleCaptureSnip() {
    if (!IS_LOCALHOST_DEV || !snipSelection) return;
    playCameraShutter();
    setCaptureFlashVisible(true);
    if (captureFlashTimerRef.current) window.clearTimeout(captureFlashTimerRef.current);
    captureFlashTimerRef.current = window.setTimeout(() => setCaptureFlashVisible(false), 180);
    const sourceCanvas = await renderSceneCanvas(4);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sourceX = (snipSelection.x / rect.width) * sourceCanvas.width;
    const sourceY = (snipSelection.y / rect.height) * sourceCanvas.height;
    const sourceSize = (snipSelection.size / rect.width) * sourceCanvas.width;
    const cropped = document.createElement("canvas");
    cropped.width = Math.max(1, Math.round(sourceSize));
    cropped.height = cropped.width;
    cropped.getContext("2d")?.drawImage(sourceCanvas, sourceX, sourceY, sourceSize, sourceSize, 0, 0, cropped.width, cropped.height);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await downloadCanvasPng(cropped, `perimeter-square-snip-${stamp}.png`);
    closeSnipMode();
  }

  useEffect(() => {
    const prevent = (event: Event) => event.preventDefault();
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => document.removeEventListener("touchmove", prevent);
  }, []);

  useEffect(() => {
    if (!snipMode) {
      snipDragRef.current = null;
      return;
    }
    if (!snipSelection) {
      const initial = makeDefaultSnipSelection();
      if (initial) setSnipSelection(initial);
    }
    function onMove(event: PointerEvent) {
      const drag = snipDragRef.current;
      if (!drag) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      setSnipSelection(clampSnipSelection(drag.mode === "move"
        ? { ...drag.initial, x: drag.initial.x + dx, y: drag.initial.y + dy }
        : { ...drag.initial, size: drag.initial.size + Math.max(dx, dy) }));
    }
    function onUp(event: PointerEvent) {
      if (snipDragRef.current?.pointerId === event.pointerId) snipDragRef.current = null;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeSnipMode();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [snipMode, snipSelection]);

  const questionContent = (
      <div className="flex min-w-0 flex-col gap-2">
      {question.storyTitle && (
        <div
          className="rounded-2xl border px-3 py-2 text-left shadow-sm"
          style={{
            background: "linear-gradient(180deg, rgba(20,83,45,0.95), rgba(4,120,87,0.9))",
            borderColor: "rgba(187,247,208,0.3)",
          }}
        >
          <div className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-emerald-100/80">
            Journey Beat {questionIndex + 1}
          </div>
          <div className="mt-1 text-base font-black text-white">
            {question.storyTitle}
          </div>
          {question.storyLine && (
            <div className="mt-1 text-sm font-semibold leading-snug text-emerald-50/90">
              {question.storyLine}
            </div>
          )}
        </div>
      )}
      <span>{questionPromptForPhase(question, phase, tracedCount, feedbackText)}</span>
      <div className="flex flex-wrap gap-1.5">
        {checkpointBoxes.map((active, index) => {
          return (
            <span
              key={index}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/8 bg-slate-950/24"
              style={{
                boxShadow: active
                  ? "0 0 0 1px rgba(34,197,94,0.22), 0 0 10px rgba(34,197,94,0.12), inset 0 0 6px rgba(34,197,94,0.12)"
                  : "inset 0 0 6px rgba(255,255,255,0.03)",
                transform: active ? "scale(1.01)" : "scale(1)",
              }}
              aria-hidden="true"
              title={active ? `Checkpoint ${index + 1}` : `Pending ${index + 1}`}
            >
              <SoccerBallIcon active={active} />
            </span>
          );
        })}
      </div>
      <div className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">
        Perimeter
      </div>
      <div className="flex min-w-0 flex-wrap gap-1.5">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 bg-slate-950/35"
          style={{
            borderColor: phase === "feedback" && feedback === "correct" ? "#22c55e" : "rgba(148,163,184,0.45)",
            background: phase === "feedback" && feedback === "correct" ? "rgba(34,197,94,0.18)" : "rgba(15,23,42,0.45)",
            boxShadow: phase === "feedback" && feedback === "correct"
              ? "0 0 0 1px rgba(34,197,94,0.2), inset 0 0 12px rgba(34,197,94,0.16)"
              : "inset 0 0 10px rgba(255,255,255,0.04)",
          }}
          aria-hidden="true"
          title={phase === "feedback" && feedback === "correct" ? "Perimeter collected" : "Perimeter result"}
        >
          <span className={`text-[0.9rem] font-black leading-none ${phase === "feedback" && feedback === "correct" ? "text-emerald-300" : "text-slate-500"}`}>
            {perimeterDisplay.trim() ? perimeterDisplay.trim() : " "}
          </span>
        </span>
      </div>
    </div>
  );

  return (
    <>
      <GameLayout
        muted={muted}
        onToggleMute={() => setMuted(toggleMute())}
        onRestart={handleRestart}
        onCapture={IS_LOCALHOST_DEV ? handleCaptureScene : undefined}
        onToggleSquareSnip={IS_LOCALHOST_DEV ? toggleSnipMode : undefined}
        squareSnipActive={snipMode}
        onRecordDemo={IS_LOCALHOST_DEV ? startRecording : undefined}
        isRecordingDemo={isDemoRecording}
        keypadValue={answerInput}
        onKeypadChange={setAnswerInput}
        onKeypadKeyInput={handleKeypadCheatInput}
        onKeypadSubmit={phase === "answering" ? () => submitAnswer() : undefined}
        canSubmit={phase === "answering" && answerInput.trim().length > 0}
        question={questionContent}
        questionShake={questionShake}
        progress={progress}
        progressTotal={QUESTIONS_PER_LEVEL}
        calculatorTopBanner={demo.showAnswers ? <span>Answer: {getCorrectAnswer(question)}</span> : null}
        demoBanner={demo.enabled ? <div className="text-base font-black uppercase tracking-[0.12em]">Demo</div> : null}
        levelCount={LEVEL_COUNT}
        currentLevel={level}
        unlockedLevel={unlockedLevel}
        onLevelSelect={handleLevelSelect}
        isQuestionDemo={isAutopilot}
        onQuestionDemo={handleQuestionDemo}
        forceKeypadExpanded={isAutopilot && phase === "answering"}
      >
        <div ref={canvasRef} className="absolute inset-0 select-none" style={{ touchAction: "none" }}>
          <PerimeterScene
            question={question}
            tracedCount={tracedCount}
            activePointId={activePointId}
            feedback={feedback}
            runnerPos={runnerPos}
            runnerDragging={runnerDragging}
            onRunnerPointerDown={handleRunnerPointerDown}
            onCheckpoint={handleCheckpoint}
          />
          <LapTotalHud
            edges={tracedEdges}
            unit={question.unit}
            visible={tracedEdges.length > 0}
            label={question.storyTitle ? `${question.storyTitle} perimeter` : question.shapeType === "soccer field" ? "Soccer field perimeter" : "Lap total"}
          />
        </div>

        {recordingPhase === "intro-prompt" && (
          <DemoIntroOverlay type="intro" isStatic />
        )}

        {recordingPhase === "intro" && (
          <DemoIntroOverlay type="intro" onComplete={onIntroComplete} />
        )}

        {recordingPhase === "outro" && <DemoIntroOverlay type="outro" onComplete={onOutroComplete} />}

        {IS_LOCALHOST_DEV && snipMode && snipSelection && (
          <div className="pointer-events-auto absolute inset-0 z-[82]">
            <div className="absolute inset-0 bg-black/10" />
            <div
              className="absolute rounded-lg"
              style={{
                left: snipSelection.x,
                top: snipSelection.y,
                width: snipSelection.size,
                height: snipSelection.size,
                border: "2px dashed rgba(255,255,255,0.95)",
                boxShadow: "0 0 0 9999px rgba(2,6,23,0.22)",
              }}
            >
              <button type="button" title="Capture square snip" onClick={handleCaptureSnip} className="arcade-button absolute -left-3 -top-3 z-[2] h-10 w-10 p-1.5">C</button>
              <button type="button" aria-label="Close square snip" title="Close square snip" onClick={closeSnipMode} className="arcade-button absolute -right-3 -top-3 z-[2] h-10 w-10 p-1.5">X</button>
              <button
                type="button"
                aria-label="Move square snip"
                title="Drag to move"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  snipDragRef.current = { mode: "move", pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, initial: snipSelection };
                }}
                className="absolute inset-0 cursor-move rounded-lg"
                style={{ background: "transparent" }}
              />
              <button
                type="button"
                aria-label="Resize square snip"
                title="Drag to resize"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  snipDragRef.current = { mode: "resize", pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, initial: snipSelection };
                }}
                className="absolute -bottom-3 -right-3 z-[2] h-7 w-7 rounded-full border-2 border-white bg-sky-400/90"
              />
            </div>
          </div>
        )}

        {sessionSummary && (
          <SessionReportModal
            summary={sessionSummary}
            level={level}
            demoMode={demo.enabled}
            onClose={() => startLevel(level)}
            onNextLevel={level < LEVEL_COUNT ? () => startLevel((level + 1) as LevelId) : undefined}
            autopilotControlsRef={isAutopilot ? modalControlsRef : undefined}
          />
        )}
      </GameLayout>

      <PhantomHand pos={phantomPos} />

      {captureFlashVisible && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[120]"
          style={{
            background: "radial-gradient(circle at center, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.7) 22%, rgba(255,255,255,0.18) 52%, rgba(255,255,255,0) 78%)",
          }}
        />
      )}
    </>
  );
}
