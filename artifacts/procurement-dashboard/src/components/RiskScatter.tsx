import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  ReferenceLine,
} from "recharts";
import { ProcurementRow, parseValue, formatBDT, formatBDTShort } from "../hooks/useProcurementData";

interface Props {
  data: ProcurementRow[];
}

interface ScatterPoint {
  x: number;
  y: number;
  name: string;
  original: number;
  revised: number;
  overrunPct: number;
}

function ScatterTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ScatterPoint;
  if (!d) return null;
  const isPositive = d.overrunPct >= 0;
  return (
    <div
      style={{
        background: "hsl(222 47% 10%)",
        border: "1px solid hsl(217 33% 22%)",
        borderRadius: 10,
        padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        maxWidth: 280,
      }}
    >
      <p style={{ color: "hsl(210 40% 92%)", fontSize: 12, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>
        {d.name}
      </p>
      <div style={{ borderTop: "1px solid hsl(217 33% 20%)", marginBottom: 8 }} />
      {[
        ["Original Value", formatBDT(d.original), "#3b82f6"],
        ["Revised Value", formatBDT(d.revised), "#ef4444"],
        ["Cost Overrun", `${isPositive ? "+" : ""}${d.overrunPct.toFixed(1)}%`, isPositive ? "#f59e0b" : "#22c55e"],
      ].map(([label, val, color]) => (
        <div key={label as string} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: "hsl(215 20% 55%)" }}>{label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: color as string }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

export default function RiskScatter({ data }: Props) {
  const points = useMemo<ScatterPoint[]>(() => {
    return data
      .filter((row) => {
        const revYear = row.Revision_Year?.trim();
        const revVal = parseValue(row.Revised_Value_BDT);
        return revYear && !isNaN(Number(revYear)) && revVal > 0;
      })
      .map((row) => {
        const original = parseValue(row.Original_Value_BDT);
        const revised = parseValue(row.Revised_Value_BDT);
        const overrunPct = original > 0 ? ((revised - original) / original) * 100 : 0;
        return {
          x: original,
          y: overrunPct,
          name: row.Project_Name || "—",
          original,
          revised,
          overrunPct,
        };
      });
  }, [data]);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Risk Analysis — Cost Overrun vs Contract Size
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Contracts with revisions only · X = Original Value · Y = Overrun % · Hover a dot for project details
        </p>
      </div>

      {points.length === 0 ? (
        <div className="h-72 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">No revised contracts available</p>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis
                type="number"
                dataKey="x"
                name="Original Value"
                tickFormatter={formatBDTShort}
                tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
                axisLine={{ stroke: "hsl(217 33% 17%)" }}
                tickLine={false}
                label={{ value: "Original Value (BDT)", position: "insideBottom", offset: -4, fill: "hsl(215 20% 45%)", fontSize: 10 }}
                height={36}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Overrun %"
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
                label={{ value: "Overrun %", angle: -90, position: "insideLeft", offset: 12, fill: "hsl(215 20% 45%)", fontSize: 10 }}
              />
              <ReferenceLine y={0} stroke="hsl(215 20% 40%)" strokeDasharray="4 4" />
              <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter
                data={points}
                fill="#f59e0b"
                fillOpacity={0.8}
                shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isHigh = payload.overrunPct > 50;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHigh ? 7 : 5}
                      fill={payload.overrunPct < 0 ? "#22c55e" : payload.overrunPct > 100 ? "#ef4444" : "#f59e0b"}
                      fillOpacity={0.85}
                      stroke={payload.overrunPct > 100 ? "#ef4444" : "transparent"}
                      strokeWidth={isHigh ? 2 : 0}
                    />
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-3 flex items-center gap-5 flex-wrap">
        {[
          ["#22c55e", "Below original cost"],
          ["#f59e0b", "1–100% overrun"],
          ["#ef4444", ">100% overrun"],
        ].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
