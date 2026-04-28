import { formatMetric, type MetricUnit, type TrackEdge } from "../game/perimeterLogic";

interface LapTotalHudProps {
  edges: TrackEdge[];
  unit: MetricUnit;
  visible: boolean;
  label?: string;
}

export default function LapTotalHud({ edges, unit, visible, label = "Lap total" }: LapTotalHudProps) {
  const total = edges.reduce((sum, edge) => sum + edge.length, 0);
  const expression = edges.length
    ? `${edges.map((edge) => formatMetric(edge.length, unit)).join(" + ")} = ${formatMetric(total, unit)}`
    : "Start at the flag";

  return (
    <div
      className="pointer-events-none absolute left-1/2 bottom-2 z-20 w-[min(24rem,calc(100%-1rem))] -translate-x-1/2 rounded-lg border bg-white/94 px-3 py-2 text-slate-900 shadow-md backdrop-blur"
      style={{
        borderColor: "#14532d",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(8px)",
        transition: "opacity 220ms ease, transform 220ms ease",
      }}
    >
      <div className="text-center text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">{label}</div>
      <div className="mt-1 text-center text-sm font-black leading-tight text-emerald-950 md:text-base">{expression}</div>
    </div>
  );
}
