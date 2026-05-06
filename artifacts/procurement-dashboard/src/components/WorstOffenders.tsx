import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
  TooltipProps,
} from "recharts";
import { ProcurementRow, parseValue } from "../hooks/useProcurementData";
import { AlertTriangle } from "lucide-react";

interface Props {
  data: ProcurementRow[];
}

interface MinistryVariance {
  ministry: string;
  avgVariancePct: number;
  contractCount: number;
  maxVariancePct: number;
}

function OffenderTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as MinistryVariance;
  return (
    <div
      style={{
        background: "hsl(222 47% 10%)",
        border: "1px solid hsl(217 33% 22%)",
        borderRadius: 10,
        padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        minWidth: 220,
      }}
    >
      <p style={{ color: "hsl(210 40% 92%)", fontSize: 12, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>
        {label}
      </p>
      <div style={{ borderTop: "1px solid hsl(217 33% 20%)", marginBottom: 8 }} />
      {[
        ["Avg Overrun", `+${d?.avgVariancePct?.toFixed(1)}%`],
        ["Worst Contract", `+${d?.maxVariancePct?.toFixed(1)}%`],
        ["Revised Contracts", `${d?.contractCount}`],
      ].map(([lbl, val]) => (
        <div key={lbl as string} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 3 }}>
          <span style={{ fontSize: 11, color: "hsl(215 20% 55%)" }}>{lbl}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "hsl(210 40% 92%)" }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

const OFFENDER_COLORS = ["#ef4444", "#f59e0b", "#f97316"];

export default function WorstOffenders({ data }: Props) {
  const top3 = useMemo<MinistryVariance[]>(() => {
    const map = new Map<string, { variances: number[] }>();
    data.forEach((row) => {
      const revYear = row.Revision_Year?.trim();
      const revVal = parseValue(row.Revised_Value_BDT);
      if (!revYear || isNaN(Number(revYear)) || revVal <= 0) return;
      const origVal = parseValue(row.Original_Value_BDT);
      if (origVal <= 0) return;
      const pct = ((revVal - origVal) / origVal) * 100;
      const ministry = row.Ministry?.trim() || "Unknown";
      if (!map.has(ministry)) map.set(ministry, { variances: [] });
      map.get(ministry)!.variances.push(pct);
    });
    return Array.from(map.entries())
      .map(([ministry, { variances }]) => ({
        ministry,
        avgVariancePct: variances.reduce((s, v) => s + v, 0) / variances.length,
        maxVariancePct: Math.max(...variances),
        contractCount: variances.length,
      }))
      .sort((a, b) => b.avgVariancePct - a.avgVariancePct)
      .slice(0, 3);
  }, [data]);

  // Shorten ministry names for display
  const chartData = top3.map((d) => ({
    ...d,
    shortName: d.ministry.length > 28 ? d.ministry.substring(0, 26) + "…" : d.ministry,
  }));

  return (
    <div className="rounded-xl border border-red-500/20 bg-card p-6" style={{ boxShadow: "0 0 16px rgba(239,68,68,0.06)" }}>
      <div className="mb-5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Worst Offenders — Top 3 by Avg Cost Overrun
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Revised contracts only · Average variance % per ministry · Hover for details
          </p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-52 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">No data available</p>
        </div>
      ) : (
        <>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
                barSize={22}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(217 33% 17%)" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  tick={{ fill: "hsl(210 40% 85%)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={180}
                />
                <Tooltip content={<OffenderTooltip />} cursor={{ fill: "hsl(217 33% 20% / 0.4)" }} />
                <Bar dataKey="avgVariancePct" name="Avg Variance %" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={OFFENDER_COLORS[i]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ranked summary */}
          <div className="mt-4 flex flex-col gap-2">
            {top3.map((d, i) => (
              <div key={d.ministry} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{ background: OFFENDER_COLORS[i] }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{d.ministry}</p>
                </div>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: OFFENDER_COLORS[i] }}>
                  +{d.avgVariancePct.toFixed(1)}% avg
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
