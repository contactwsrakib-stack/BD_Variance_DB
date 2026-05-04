import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
  TooltipProps,
} from "recharts";
import { ProcurementRow, parseValue, formatBDT } from "../hooks/useProcurementData";
import { AlertTriangle } from "lucide-react";

interface Props {
  data: ProcurementRow[];
}

interface YearPoint {
  year: number;
  originalValue: number;
  revisedValue: number;
  originalProjects: ProcurementRow[];
  revisedProjects: ProcurementRow[];
}

function DrillTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null;

  const point = payload[0]?.payload as YearPoint;
  if (!point) return null;

  const allProjects = [
    ...point.originalProjects.map((p) => ({
      name: p.Project_Name,
      value: parseValue(p.Original_Value_BDT),
      type: "original" as const,
      note: p.Additional_Note,
      flag: p.Red_Flag,
    })),
    ...point.revisedProjects.map((p) => ({
      name: p.Project_Name,
      value: parseValue(p.Revised_Value_BDT),
      type: "revised" as const,
      note: p.Additional_Note,
      flag: p.Red_Flag,
    })),
  ].filter((p) => p.value > 0);

  return (
    <div
      className="z-50 max-w-sm"
      style={{
        background: "hsl(222 47% 10%)",
        border: "1px solid hsl(217 33% 22%)",
        borderRadius: "10px",
        padding: "14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        maxHeight: "360px",
        overflowY: "auto",
      }}
    >
      <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">
        Year {label} &mdash; Deep Drill
      </p>

      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: p.color }}
          />
          <span className="text-xs text-muted-foreground">{p.name}:</span>
          <span className="text-xs font-semibold" style={{ color: p.color }}>
            {formatBDT(p.value as number)}
          </span>
        </div>
      ))}

      {allProjects.length > 0 && (
        <>
          <div
            className="my-2"
            style={{ borderTop: "1px solid hsl(217 33% 20%)" }}
          />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Contributing Projects
          </p>
          <div className="flex flex-col gap-2.5">
            {allProjects.map((p, i) => (
              <div key={i}>
                <div className="flex items-start gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                    style={{
                      background: p.type === "original" ? "#3b82f6" : "#ef4444",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground leading-tight">
                      {p.name}
                    </p>
                    <p
                      className="text-xs font-semibold mt-0.5"
                      style={{
                        color: p.type === "original" ? "#3b82f6" : "#ef4444",
                      }}
                    >
                      {formatBDT(p.value)}
                    </p>
                    {p.note && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {p.note}
                      </p>
                    )}
                    {p.flag && (
                      <div className="flex items-start gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-400 leading-relaxed">{p.flag}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SpendLineChart({ data }: Props) {
  const chartData = useMemo(() => {
    const yearMap = new Map<number, YearPoint>();

    data.forEach((row) => {
      const origYear = parseInt(row.Original_Award_Year);
      const revYear = parseInt(row.Revision_Year);

      if (!isNaN(origYear) && origYear > 0) {
        if (!yearMap.has(origYear)) {
          yearMap.set(origYear, {
            year: origYear,
            originalValue: 0,
            revisedValue: 0,
            originalProjects: [],
            revisedProjects: [],
          });
        }
        const pt = yearMap.get(origYear)!;
        pt.originalValue += parseValue(row.Original_Value_BDT);
        pt.originalProjects.push(row);
      }

      if (!isNaN(revYear) && revYear > 0) {
        if (!yearMap.has(revYear)) {
          yearMap.set(revYear, {
            year: revYear,
            originalValue: 0,
            revisedValue: 0,
            originalProjects: [],
            revisedProjects: [],
          });
        }
        const pt = yearMap.get(revYear)!;
        pt.revisedValue += parseValue(row.Revised_Value_BDT);
        pt.revisedProjects.push(row);
      }
    });

    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  }, [data]);

  const maxVal = useMemo(
    () =>
      Math.max(
        ...chartData.map((d) => Math.max(d.originalValue, d.revisedValue))
      ),
    [chartData]
  );

  const tickFormatter = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(0)}B`;
    if (val >= 1e7) return `${(val / 1e7).toFixed(0)}Cr`;
    if (val >= 1e5) return `${(val / 1e5).toFixed(0)}L`;
    return `${val}`;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Spend Trajectory Over Time
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hover any data point for a project-level deep drill
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-blue-400 inline-block rounded" />
            <span className="text-muted-foreground">Original Award</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-red-400 inline-block rounded" />
            <span className="text-muted-foreground">Revised Value</span>
          </span>
        </div>
      </div>

      <div className="h-72 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(217 33% 17%)"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
              axisLine={{ stroke: "hsl(217 33% 17%)" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={tickFormatter}
              tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, maxVal * 1.1]}
            />
            <Tooltip
              content={<DrillTooltip />}
              cursor={{
                stroke: "hsl(217 33% 30%)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />
            <Line
              type="monotone"
              dataKey="originalValue"
              name="Original Award"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#3b82f6", stroke: "#1e40af", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="revisedValue"
              name="Revised Value"
              stroke="#ef4444"
              strokeWidth={2.5}
              strokeDasharray="5 3"
              dot={{ fill: "#ef4444", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#ef4444", stroke: "#7f1d1d", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
