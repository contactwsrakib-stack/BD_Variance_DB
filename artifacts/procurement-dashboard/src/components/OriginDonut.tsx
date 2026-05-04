import { useMemo, useState } from "react";
import { ProcurementRow, parseValue, formatBDT } from "../hooks/useProcurementData";

interface Props {
  data: ProcurementRow[];
}

interface OriginSlice {
  name: string;
  count: number;
  totalBDT: number;
  pct: number;
  color: string;
}

function getOriginValue(row: ProcurementRow): string {
  for (const key of Object.keys(row)) {
    const norm = key.toLowerCase().replace(/[\s_-]/g, "");
    if (norm === "contractororigin" || norm === "origin") {
      return row[key]?.trim() || "Unknown";
    }
  }
  return "Unknown";
}

function getRevisedValue(row: ProcurementRow): number {
  for (const key of Object.keys(row)) {
    const norm = key.toLowerCase().replace(/[\s_-]/g, "");
    if (norm === "revisedvaluebdt" || norm === "revisedvalue") {
      return parseValue(row[key]);
    }
  }
  return parseValue(row.Revised_Value_BDT);
}

const PALETTE = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

function assignColor(name: string, index: number): string {
  const n = name.toLowerCase();
  if (n.includes("foreign")) return "#3b82f6";
  if (n.includes("local")) return "#22c55e";
  if (n.includes("jv") || n.includes("joint")) return "#f59e0b";
  return PALETTE[index % PALETTE.length];
}

/** Build SVG arc path for a pie slice */
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildDonutPaths(
  slices: OriginSlice[],
  cx: number,
  cy: number,
  outerR: number,
  innerR: number
) {
  const total = slices.reduce((s, sl) => s + sl.count, 0);
  let current = 0;
  return slices.map((sl) => {
    const sweep = (sl.count / total) * 360;
    const startAngle = current;
    const endAngle = current + sweep - 1; // 1 deg gap
    current += sweep;
    const midAngle = startAngle + sweep / 2;
    const outerPath = describeArc(cx, cy, outerR, startAngle, endAngle);
    const innerPath = describeArc(cx, cy, innerR, endAngle, startAngle);
    // Build a closed donut slice path
    const o1 = polarToCartesian(cx, cy, outerR, startAngle);
    const o2 = polarToCartesian(cx, cy, outerR, endAngle);
    const i1 = polarToCartesian(cx, cy, innerR, endAngle);
    const i2 = polarToCartesian(cx, cy, innerR, startAngle);
    const largeArc = sweep > 180 ? 1 : 0;
    const pathD = [
      `M ${o1.x} ${o1.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${o2.x} ${o2.y}`,
      `L ${i1.x} ${i1.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${i2.x} ${i2.y}`,
      "Z",
    ].join(" ");
    // Label position at midpoint between radii
    const labelR = innerR + (outerR - innerR) * 0.5;
    const labelPos = polarToCartesian(cx, cy, labelR, midAngle);
    return { ...sl, pathD, labelPos, sweep };
  });
}

export default function OriginDonut({ data }: Props) {
  const [hovered, setHovered] = useState<OriginSlice | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const slices = useMemo<OriginSlice[]>(() => {
    const map: Record<string, { count: number; totalBDT: number }> = {};
    data.forEach((row) => {
      const origin = getOriginValue(row);
      if (!map[origin]) map[origin] = { count: 0, totalBDT: 0 };
      map[origin].count += 1;
      map[origin].totalBDT += getRevisedValue(row);
    });
    const total = Object.values(map).reduce((s, v) => s + v.count, 0);
    return Object.entries(map)
      .map(([name, v], i) => ({
        name,
        count: v.count,
        totalBDT: v.totalBDT,
        pct: total > 0 ? (v.count / total) * 100 : 0,
        color: assignColor(name, i),
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const SIZE = 220;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const OUTER_R = 96;
  const INNER_R = 60;

  const paths = buildDonutPaths(slices, CX, CY, OUTER_R, INNER_R);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Contractor Origin Split
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Hover a slice for exact BDT totals and contract counts
        </p>
      </div>

      <div className="flex flex-row items-center gap-10">
        {/* SVG Donut */}
        <div className="flex-shrink-0 relative" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            style={{ overflow: "visible" }}
          >
            {paths.map((p, i) => (
              <g key={i}>
                <path
                  d={p.pathD}
                  fill={p.color}
                  opacity={hovered && hovered.name !== p.name ? 0.45 : 1}
                  style={{ cursor: "pointer", transition: "opacity 0.15s" }}
                  onMouseEnter={(e) => {
                    setHovered(p);
                    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement)
                      .getBoundingClientRect();
                    setTooltipPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                  onMouseMove={(e) => {
                    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement)
                      .getBoundingClientRect();
                    setTooltipPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                  onMouseLeave={() => setHovered(null)}
                />
                {p.sweep > 18 && (
                  <text
                    x={p.labelPos.x}
                    y={p.labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize={11}
                    fontWeight={700}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {`${p.pct.toFixed(0)}%`}
                  </text>
                )}
              </g>
            ))}
            {/* Center label */}
            <text x={CX} y={CY - 8} textAnchor="middle" fill="hsl(210 40% 92%)" fontSize={13} fontWeight={700}>
              {slices.reduce((s, sl) => s + sl.count, 0)}
            </text>
            <text x={CX} y={CY + 10} textAnchor="middle" fill="hsl(215 20% 55%)" fontSize={10}>
              contracts
            </text>
          </svg>

          {/* Tooltip */}
          {hovered && (
            <div
              style={{
                position: "absolute",
                left: tooltipPos.x + 12,
                top: tooltipPos.y - 20,
                background: "hsl(222 47% 10%)",
                border: "1px solid hsl(217 33% 22%)",
                borderRadius: 10,
                padding: "10px 14px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
                minWidth: 180,
                pointerEvents: "none",
                zIndex: 50,
              }}
            >
              <p style={{ color: hovered.color, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                {hovered.name}
              </p>
              {[
                ["Share", `${hovered.pct.toFixed(1)}%`],
                ["Contracts", `${hovered.count}`],
                ["Total BDT", formatBDT(hovered.totalBDT)],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color: "hsl(215 20% 55%)" }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "hsl(210 40% 92%)" }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {slices.map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: s.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{s.name}</span>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: s.color }}>
                    {s.pct.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {s.count} contract{s.count !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatBDT(s.totalBDT)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${s.pct}%`, background: s.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
