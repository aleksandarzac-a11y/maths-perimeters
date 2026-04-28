import type { PointerEvent as ReactPointerEvent } from "react";
import type { PerimeterQuestion, TrackEdge, TrackPoint } from "../game/perimeterLogic";

interface PerimeterSceneProps {
  question: PerimeterQuestion;
  tracedCount: number;
  activePointId: string;
  feedback: "idle" | "correct" | "short" | "long";
  runnerPos: { x: number; y: number; t?: number };
  runnerDragging: boolean;
  onRunnerPointerDown: (event: ReactPointerEvent<SVGGElement>) => void;
  onCheckpoint: (pointId: string) => void;
}

function pointMap(points: TrackPoint[]) {
  return new Map(points.map((point) => [point.id, point]));
}

function midPoint(edge: TrackEdge, points: Map<string, TrackPoint>) {
  const from = points.get(edge.from)!;
  const to = points.get(edge.to)!;
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
}

function edgeVector(edge: TrackEdge, points: Map<string, TrackPoint>) {
  const from = points.get(edge.from)!;
  const to = points.get(edge.to)!;
  return { dx: to.x - from.x, dy: to.y - from.y };
}

function labelOffset(edge: TrackEdge, points: Map<string, TrackPoint>) {
  const from = points.get(edge.from)!;
  const to = points.get(edge.to)!;
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = -dy / length;
  const normalY = dx / length;
  const centerX = Array.from(points.values()).reduce((sum, point) => sum + point.x, 0) / points.size;
  const centerY = Array.from(points.values()).reduce((sum, point) => sum + point.y, 0) / points.size;
  const towardsCenter = (centerX - midX) * normalX + (centerY - midY) * normalY;
  const outwardX = towardsCenter > 0 ? -normalX : normalX;
  const outwardY = towardsCenter > 0 ? -normalY : normalY;
  return {
    x: midX + outwardX * 28,
    y: midY + outwardY * 28,
    lineX: midX + outwardX * 12,
    lineY: midY + outwardY * 12,
  };
}

function pathFor(question: PerimeterQuestion) {
  const first = question.points[0];
  return [
    `M ${first.x} ${first.y}`,
    ...question.points.slice(1).map((point) => `L ${point.x} ${point.y}`),
    "Z",
  ].join(" ");
}

export default function PerimeterScene({
  question,
  tracedCount,
  activePointId,
  feedback,
  runnerPos,
  runnerDragging,
  onRunnerPointerDown,
  onCheckpoint,
}: PerimeterSceneProps) {
  const points = pointMap(question.points);
  const scenePoints = pointMap(question.scenePoints ?? question.points);
  const isFootballStory = Boolean(question.storyFocus);
  const isComplete = tracedCount >= question.edges.length;
  const nextEdge = isComplete ? null : question.edges[tracedCount % question.edges.length];
  const nextPointId = nextEdge?.to;
  const tracedEdge = isComplete ? null : question.edges[tracedCount % question.edges.length];
  const tracedStart = tracedEdge ? points.get(tracedEdge.from) : null;
  const orb = runnerPos;
  const tracedEdges = question.edges.slice(0, tracedCount);
  const orbT = orb.t;
  const rollPhase = (tracedCount + (orbT ?? 0)) * 0.68;
  const rollWave = Math.sin(((orbT ?? 0) * Math.PI * 2) + tracedCount * 0.35);
  const theme = question.level === 1
    ? isFootballStory
      ? { sky: "#d9f99d", ground: "#86efac", path: "#dcfce7", accent: "#15803d" }
      : { sky: "#d9f99d", ground: "#86efac", path: "#fef3c7", accent: "#16a34a" }
    : question.level === 2
      ? { sky: "#fed7aa", ground: "#fde68a", path: "#fff7ed", accent: "#f97316" }
      : { sky: "#dbeafe", ground: "#eff6ff", path: "#ffffff", accent: "#2563eb" };

  const orbAura = feedback === "correct"
    ? "#22c55e"
    : feedback === "short"
      ? "#f59e0b"
      : feedback === "long"
        ? "#ef4444"
        : theme.accent;
  const currentEdge = tracedEdge && tracedStart ? {
    from: tracedStart,
    to: points.get(tracedEdge.to)!,
    vector: edgeVector(tracedEdge, points),
  } : null;
  const currentEdgeLength = currentEdge ? Math.hypot(currentEdge.vector.dx, currentEdge.vector.dy) : 0;
  const trailDots = currentEdge && orbT !== undefined
    ? Array.from({ length: 5 }, (_, index) => {
        const t = Math.max(0, Math.min(1, orbT - index * 0.075));
        const x = currentEdge.from.x + currentEdge.vector.dx * t;
        const y = currentEdge.from.y + currentEdge.vector.dy * t;
        return { x, y, alpha: 0.24 - index * 0.04 };
      })
    : [];

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1000 620"
      role="img"
      aria-label={`${question.shapeType} perimeter track`}
      style={{ touchAction: "none" }}
    >
      <defs>
        <filter id="orb-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.25" />
        </filter>
        <clipPath id="ball-clip">
          <circle cx="0" cy="0" r="32" />
        </clipPath>
        <radialGradient id="ball-fill" cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="68%" stopColor="#fafafa" />
          <stop offset="100%" stopColor={theme.accent} stopOpacity="0.18" />
        </radialGradient>
      </defs>

      <rect width="1000" height="620" fill={theme.sky} />
      <path d="M0 420 C180 350 260 520 430 450 C600 380 730 500 1000 395 L1000 620 L0 620 Z" fill={theme.ground} />
      <circle cx="130" cy="155" r="36" fill="#22c55e" opacity="0.42" />
      <rect x="118" y="185" width="20" height="62" rx="8" fill="#854d0e" opacity="0.38" />
      <circle cx="850" cy="135" r="30" fill="#22c55e" opacity="0.35" />
      <rect x="840" y="160" width="18" height="54" rx="8" fill="#854d0e" opacity="0.32" />
      <path d="M95 515 Q165 470 235 515 T375 515" stroke="#38bdf8" strokeWidth="10" fill="none" opacity="0.28" />

      {question.level === 3 && (
        <rect x="120" y="86" width="760" height="456" rx="8" fill="#ffffff" stroke="#bfdbfe" strokeWidth="4" />
      )}

      {isFootballStory && (() => {
        const left = scenePoints.get("A");
        const topRight = scenePoints.get("B");
        const rightBottom = scenePoints.get("C");
        const leftBottom = scenePoints.get("D");
        if (!left || !topRight || !rightBottom || !leftBottom) return null;
        const pitchLeft = left.x;
        const pitchTop = left.y;
        const pitchRight = topRight.x;
        const pitchBottom = leftBottom.y;
        const pitchWidth = pitchRight - pitchLeft;
        const pitchHeight = pitchBottom - pitchTop;
        const centerX = pitchLeft + pitchWidth / 2;
        const centerY = pitchTop + pitchHeight / 2;
        const stripeCount = 8;
        const stripeWidth = pitchWidth / stripeCount;
        const penaltyDepth = pitchWidth * (16.5 / 105);
        const goalDepth = pitchWidth * (5.5 / 105);
        const penaltyHeight = pitchHeight * (40.3 / 68);
        const goalHeight = pitchHeight * (18.32 / 68);
        const penaltyTop = pitchTop + (pitchHeight - penaltyHeight) / 2;
        const goalTop = pitchTop + (pitchHeight - goalHeight) / 2;
        const centerCircleR = pitchHeight * 0.14;
        const penaltySpotOffset = pitchWidth * 0.11;
        const cornerArcR = pitchHeight * 0.03;
        const leftGoalX = pitchLeft - 32;
        const rightGoalX = pitchRight + 4;
        return (
          <g aria-hidden="true">
            <rect x={pitchLeft} y={pitchTop} width={pitchWidth} height={pitchHeight} fill="#9bdc5d" opacity="0.92" />
            {Array.from({ length: stripeCount }, (_, index) => (
              <rect
                key={`stripe-${index}`}
                x={pitchLeft + index * stripeWidth}
                y={pitchTop}
                width={stripeWidth}
                height={pitchHeight}
                fill={index % 2 === 0 ? "#b9ea70" : "#8dca3c"}
                opacity={index % 2 === 0 ? 0.52 : 0.36}
              />
            ))}
            <rect
              x={pitchLeft}
              y={pitchTop}
              width={pitchWidth}
              height={pitchHeight}
              fill="none"
              stroke="#f8fafc"
              strokeWidth="5"
              opacity={question.storyFocus === "pitch" || question.storyFocus === "sideline" ? "1" : "0.92"}
            />
            <line
              x1={centerX}
              y1={pitchTop}
              x2={centerX}
              y2={pitchBottom}
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.9"
            />
            <circle
              cx={centerX}
              cy={centerY}
              r={centerCircleR}
              fill="none"
              stroke="#ffffff"
              strokeWidth="6"
              opacity="0.9"
            />
            <line
              x1={pitchLeft}
              y1={centerY}
              x2={pitchLeft + penaltyDepth}
              y2={centerY}
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.9"
            />
            <line
              x1={pitchRight - penaltyDepth}
              y1={centerY}
              x2={pitchRight}
              y2={centerY}
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.9"
            />
            <rect
              x={pitchLeft}
              y={penaltyTop}
              width={penaltyDepth}
              height={penaltyHeight}
              rx="4"
              fill="none"
              stroke="#ffffff"
              strokeWidth={question.storyFocus === "penalty-area" ? "8" : "6"}
              opacity={question.storyFocus === "penalty-area" ? "1" : "0.95"}
            />
            <rect
              x={pitchRight - penaltyDepth}
              y={penaltyTop}
              width={penaltyDepth}
              height={penaltyHeight}
              rx="4"
              fill="none"
              stroke="#ffffff"
              strokeWidth={question.storyFocus === "penalty-area" ? "8" : "6"}
              opacity={question.storyFocus === "penalty-area" ? "1" : "0.95"}
            />
            <rect
              x={pitchLeft}
              y={goalTop}
              width={goalDepth}
              height={goalHeight}
              rx="2"
              fill="none"
              stroke="#ffffff"
              strokeWidth={question.storyFocus === "goalkeeper-box" ? "8" : "6"}
              opacity={question.storyFocus === "goalkeeper-box" ? "1" : "0.95"}
            />
            <rect
              x={pitchRight - goalDepth}
              y={goalTop}
              width={goalDepth}
              height={goalHeight}
              rx="2"
              fill="none"
              stroke="#ffffff"
              strokeWidth={question.storyFocus === "goalkeeper-box" ? "8" : "6"}
              opacity={question.storyFocus === "goalkeeper-box" ? "1" : "0.95"}
            />
            <path
              d={`M ${pitchLeft + cornerArcR} ${pitchTop} A ${cornerArcR} ${cornerArcR} 0 0 0 ${pitchLeft} ${pitchTop + cornerArcR}
                M ${pitchRight - cornerArcR} ${pitchTop} A ${cornerArcR} ${cornerArcR} 0 0 1 ${pitchRight} ${pitchTop + cornerArcR}
                M ${pitchLeft + cornerArcR} ${pitchBottom} A ${cornerArcR} ${cornerArcR} 0 0 1 ${pitchLeft} ${pitchBottom - cornerArcR}
                M ${pitchRight - cornerArcR} ${pitchBottom} A ${cornerArcR} ${cornerArcR} 0 0 0 ${pitchRight} ${pitchBottom - cornerArcR}`}
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              opacity="0.85"
            />
            <circle cx={pitchLeft + penaltySpotOffset} cy={centerY} r="4.5" fill="#ffffff" />
            <circle cx={pitchRight - penaltySpotOffset} cy={centerY} r="4.5" fill="#ffffff" />
            <circle cx={centerX} cy={centerY} r="4.5" fill="#ffffff" />
            <rect x={leftGoalX} y={centerY - 34} width="16" height="68" rx="4" fill="#f8fafc" opacity="0.96" />
            <rect x={rightGoalX} y={centerY - 34} width="16" height="68" rx="4" fill="#f8fafc" opacity="0.96" />
            <rect x={leftGoalX - 18} y={centerY - 18} width="18" height="36" rx="4" fill="none" stroke="#f8fafc" strokeWidth="5" opacity="0.9" />
            <rect x={rightGoalX + 16} y={centerY - 18} width="18" height="36" rx="4" fill="none" stroke="#f8fafc" strokeWidth="5" opacity="0.9" />
            <text
              x={centerX}
              y={pitchTop + 34}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="20"
              fontWeight="900"
              fill="#166534"
              stroke="#ecfccb"
              strokeWidth="4"
              paintOrder="stroke"
            >
              {question.storyTitle ?? "Football field perimeter"}
            </text>
            {question.storyLine && (
              <text
                x={centerX}
                y={pitchTop + 58}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight="800"
                fill="#166534"
                opacity="0.92"
              >
                {question.storyLine}
              </text>
            )}
            {question.storyFocus === "penalty-area" && (
              <text
                x={pitchLeft + penaltyDepth / 2}
                y={penaltyTop - 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="13"
                fontWeight="900"
                fill="#14532d"
                stroke="#ecfccb"
                strokeWidth="3"
                paintOrder="stroke"
              >
                16-metre box
              </text>
            )}
            {question.storyFocus === "goalkeeper-box" && (
              <text
                x={pitchLeft + goalDepth / 2}
                y={goalTop - 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="13"
                fontWeight="900"
                fill="#14532d"
                stroke="#ecfccb"
                strokeWidth="3"
                paintOrder="stroke"
              >
                Goalkeeper box
              </text>
            )}
            {question.storyFocus === "sideline" && (
              <text
                x={pitchRight - 16}
                y={pitchBottom - 20}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="13"
                fontWeight="900"
                fill="#14532d"
                stroke="#ecfccb"
                strokeWidth="3"
                paintOrder="stroke"
              >
                Touchline lap
            </text>
            )}
          </g>
        );
      })()}

      <path
        d={pathFor(question)}
        fill={isFootballStory ? "none" : question.level === 3 ? "#eff6ff" : theme.path}
        stroke={isFootballStory ? "#ffffff" : "#64748b"}
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={pathFor(question)}
        fill="none"
        stroke="#f8fafc"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="8 18"
        opacity="0.9"
      />

      {tracedEdges.map((edgeItem) => {
        const from = points.get(edgeItem.from)!;
        const to = points.get(edgeItem.to)!;
        return (
          <line
            key={`${edgeItem.from}-${edgeItem.to}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#22c55e"
            strokeWidth="18"
            strokeLinecap="round"
            opacity="0.9"
          />
        );
      })}

      {trailDots.map((dot, index) => (
        <circle
          key={index}
          cx={dot.x}
          cy={dot.y}
          r={7 - index}
          fill={orbAura}
          opacity={dot.alpha}
        />
      ))}

      {currentEdge && orbT !== undefined && tracedCount < question.edges.length && (
        <g>
          <line
            x1={currentEdge.from.x}
            y1={currentEdge.from.y}
            x2={orb.x}
            y2={orb.y}
            stroke={orbAura}
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.18"
          />
          <line
            x1={currentEdge.from.x}
            y1={currentEdge.from.y}
            x2={orb.x}
            y2={orb.y}
            stroke="#f8fafc"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${Math.max(12, currentEdgeLength * 0.12)} ${Math.max(10, currentEdgeLength * 0.08)}`}
            strokeDashoffset={-(currentEdgeLength * (orbT ?? 0) * 1.55)}
            opacity="0.92"
          />
        </g>
      )}

      {question.edges.map((edgeItem) => {
        if (!edgeItem.visible && question.level !== 3) return null;
        const mid = midPoint(edgeItem, points);
        const labelPos = labelOffset(edgeItem, points);
        const isDone = tracedEdges.some((done) => done.from === edgeItem.from && done.to === edgeItem.to);
        const isNextEdge = !isDone && edgeItem.from === tracedEdge?.from && edgeItem.to === tracedEdge?.to;
        return (
          <g key={`label-${edgeItem.from}-${edgeItem.to}`} opacity={isDone ? 0.98 : isNextEdge ? 1 : 0.9}>
            <line
              x1={mid.x}
              y1={mid.y}
              x2={labelPos.lineX}
              y2={labelPos.lineY}
              stroke={isDone ? "#16a34a" : edgeItem.visible ? "#94a3b8" : "#60a5fa"}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.75"
            />
            <rect
              x={labelPos.x - 44}
              y={labelPos.y - 23}
              width="88"
              height="38"
              rx="8"
              fill={isDone ? "#dcfce7" : edgeItem.visible ? "#ffffff" : "#e0f2fe"}
              stroke={isDone ? "#16a34a" : edgeItem.visible ? "#94a3b8" : "#60a5fa"}
              strokeWidth="2"
              opacity={isDone ? 1 : 0.95}
            />
            <text
              x={labelPos.x}
              y={labelPos.y + 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="19"
              fontWeight="900"
              fill="#0f172a"
            >
              {edgeItem.visible ? `${edgeItem.label ?? edgeItem.length} ${question.unit}` : "?"}
            </text>
            {isDone && (
              <text
                x={labelPos.x}
                y={labelPos.y - 11}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fontWeight="900"
                fill="#166534"
              >
                collected
              </text>
            )}
          </g>
        );
      })}

      {question.points.map((point) => {
        const isActive = point.id === activePointId;
        const isNext = point.id === nextPointId;
        return (
          <g
            key={point.id}
            onPointerDown={() => onCheckpoint(point.id)}
            style={{
              cursor: "pointer",
            }}
            >
              {isNext && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="33"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3"
                  opacity="0.16"
                  style={{ animation: "checkpointGlow 2.8s ease-in-out infinite" }}
                  pointerEvents="none"
                />
              )}
              <circle
                cx={point.x}
                cy={point.y}
                r={isActive ? 28 : isNext ? 26 : 21}
                fill={isActive ? "#f8fafc" : isNext ? "#f0fdf4" : "#ffffff"}
                stroke={isNext ? "#22c55e" : "#475569"}
                strokeWidth="3"
                opacity={1}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={isActive ? 14 : isNext ? 12 : 11}
                fill={isActive ? "#22c55e" : isNext ? "#86efac" : "#cbd5e1"}
                opacity={isNext ? 0.34 : 0.24}
              />
              <path
                d={`M ${point.x - 10} ${point.y + 8} L ${point.x - 2} ${point.y - 18} L ${point.x + 18} ${point.y - 10} L ${point.x + 6} ${point.y + 14} Z`}
                fill={isActive ? "#0f172a" : "#475569"}
              />
              <circle cx={point.x + 1} cy={point.y - 4} r="3" fill="#ffffff" opacity="0.95" />
            </g>
          );
        })}

      <g
        transform={`translate(${orb.x} ${orb.y}) rotate(${rollPhase * 360}) scale(${1 + Math.abs(rollWave) * 0.055}, ${1 - Math.abs(rollWave) * 0.035})`}
        filter="url(#orb-shadow)"
        onPointerDown={onRunnerPointerDown}
        style={{ cursor: runnerDragging ? "grabbing" : "grab" }}
      >
        <g clipPath="url(#ball-clip)">
          <circle cx="0" cy="0" r="42" fill="#ffffff" />
          <circle cx="0" cy="0" r="42" fill="url(#ball-fill)" />
          <circle cx="0" cy="0" r="42" fill="none" stroke={theme.accent} strokeWidth="6" opacity="0.38" />
          <circle cx="0" cy="0" r="42" fill="none" stroke="#0f172a" strokeWidth="3.2" />
          <path d="M-18 -10 C-9 -20, 9 -20, 18 -10" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M-18 10 C-9 2, 9 2, 18 10" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M-6 -14 L0 -20 L6 -14" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M-6 14 L0 20 L6 14" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="-12" cy="-12" r="10" fill={theme.accent} opacity="0.28" />
          <circle cx="12" cy="10" r="8" fill="#ffffff" opacity="0.26" />
        </g>
      </g>

      {feedback !== "idle" && (
        <g aria-hidden="true">
          <rect
            x="250"
            y="44"
            width="500"
            height="48"
            rx="14"
            fill={feedback === "correct" ? "#dcfce7" : feedback === "short" ? "#fef3c7" : "#fee2e2"}
            stroke={feedback === "correct" ? "#16a34a" : feedback === "short" ? "#f59e0b" : "#ef4444"}
            strokeWidth="3"
          />
          <text
            x="500"
            y="72"
            textAnchor="middle"
            fontSize="22"
            fontWeight="900"
            fill={feedback === "correct" ? "#166534" : feedback === "short" ? "#92400e" : "#991b1b"}
          >
            {feedback === "correct"
              ? "Collected the full boundary!"
              : feedback === "short"
                ? "Keep rolling, the boundary is still open."
                : "That roll went past the finish."}
          </text>
        </g>
      )}
    </svg>
  );
}
