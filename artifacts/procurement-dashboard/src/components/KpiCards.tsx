import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ProcurementRow, parseValue, formatBDT } from "../hooks/useProcurementData";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface Props {
  data: ProcurementRow[];
}

const ORIGIN_COLORS: Record<string, string> = {
  Foreign: "#3b82f6",
  Local: "#22c55e",
  JV: "#f59e0b",
  "Joint Venture": "#f59e0b",
  Other: "#8b5cf6",
};

const getOriginColor = (origin: string): string => {
  const key = Object.keys(ORIGIN_COLORS).find((k) =>
    origin.toLowerCase().includes(k.toLowerCase())
  );
  return key ? ORIGIN_COLORS[key] : "#6b7280";
};

export default function KpiCards({ data }: Props) {
  const totalOriginal = useMemo(
    () => data.reduce((sum, row) => sum + parseValue(row.Original_Value_BDT), 0),
    [data]
  );

  const totalRevised = useMemo(
    () => data.reduce((sum, row) => sum + parseValue(row.Revised_Value_BDT), 0),
    [data]
  );

  const overrun = totalRevised - totalOriginal;
  const overrunPct = totalOriginal > 0 ? ((overrun / totalOriginal) * 100).toFixed(1) : "0";

  const originCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((row) => {
      const origin = row.Contractor_Origin?.trim() || "Unknown";
      counts[origin] = (counts[origin] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const total = originCounts.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Total Original Spend */}
      <div className="rounded-xl border border-blue-500/20 bg-card p-6 glow-blue relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Total Original Spend
            </p>
            <p className="text-3xl font-bold text-foreground mt-2 leading-tight">
              {formatBDT(totalOriginal)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-blue-400" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Across {data.length} procurement contracts
        </p>
      </div>

      {/* Total Revised Spend */}
      <div className="rounded-xl border border-red-500/20 bg-card p-6 glow-red relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Total Revised Spend
            </p>
            <p className="text-3xl font-bold text-foreground mt-2 leading-tight">
              {formatBDT(totalRevised)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-red-400" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-red-400" />
          <p className="text-xs text-red-400 font-medium">
            +{overrunPct}% overrun &mdash; {formatBDT(overrun)} excess
          </p>
        </div>
      </div>

      {/* Contractor Origin Split */}
      <div className="rounded-xl border border-border bg-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent pointer-events-none" />
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Contractor Origin Split
        </p>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={originCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {originCounts.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getOriginColor(entry.name)}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(222 47% 11%)",
                    border: "1px solid hsl(217 33% 20%)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "hsl(210 40% 92%)",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} (${((value / total) * 100).toFixed(1)}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            {originCounts.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: getOriginColor(entry.name) }}
                />
                <span className="text-xs text-muted-foreground truncate">{entry.name}</span>
                <span className="text-xs font-semibold text-foreground ml-auto flex-shrink-0">
                  {((entry.value / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
