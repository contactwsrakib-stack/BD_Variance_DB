import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  TooltipProps,
} from "recharts";
import {
  ProcurementRow,
  parseValue,
  formatBDT,
  formatBDTShort,
} from "../hooks/useProcurementData";

interface Props {
  data: ProcurementRow[];
}

interface MinistryRow {
  ministry: string;
  original: number;
  revised: number;
  count: number;
  projects: string[];
}

function MinistryTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const orig = payload.find((p) => p.dataKey === "original")?.value ?? 0;
  const rev = payload.find((p) => p.dataKey === "revised")?.value ?? 0;
  const d = payload[0]?.payload as MinistryRow;
  const overrun = orig > 0 ? (((rev as number) - (orig as number)) / (orig as number)) * 100 : null;

  return (
    <div
      style={{
        background: "hsl(222 47% 10%)",
        border: "1px solid hsl(217 33% 22%)",
        borderRadius: 10,
        padding: "14px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        maxWidth: 300,
        maxHeight: 320,
        overflowY: "auto",
      }}
    >
      <p style={{ color: "hsl(210 40% 92%)", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
        {label}
      </p>
      <div style={{ borderTop: "1px solid hsl(217 33% 20%)", marginBottom: 8 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
        {[
          ["Original Spend", formatBDT(orig as number), "#3b82f6"],
          ["Revised Spend", formatBDT(rev as number), "#ef4444"],
        ].map(([label, val, color]) => (
          <div key={label as string} style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ fontSize: 11, color: "hsl(215 20% 55%)" }}>{label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: color as string }}>{val}</span>
          </div>
        ))}
        {overrun !== null && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ fontSize: 11, color: "hsl(215 20% 55%)" }}>Cost Overrun</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: overrun > 0 ? "#f59e0b" : "#22c55e" }}>
              {overrun > 0 ? "+" : ""}{overrun.toFixed(1)}%
            </span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ fontSize: 11, color: "hsl(215 20% 55%)" }}>Contracts</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "hsl(210 40% 92%)" }}>{d?.count}</span>
        </div>
      </div>
      {d?.projects?.length > 0 && (
        <>
          <div style={{ borderTop: "1px solid hsl(217 33% 20%)", marginBottom: 6 }} />
          <p style={{ fontSize: 10, color: "hsl(215 20% 45%)", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Projects
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {d.projects.slice(0, 5).map((name, i) => (
              <p key={i} style={{ fontSize: 11, color: "hsl(210 40% 80%)", lineHeight: 1.4 }}>
                • {name}
              </p>
            ))}
            {d.projects.length > 5 && (
              <p style={{ fontSize: 10, color: "hsl(215 20% 45%)", fontStyle: "italic" }}>
                +{d.projects.length - 5} more
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function MinistryChart({ data }: Props) {
  const ministryData = useMemo<MinistryRow[]>(() => {
    const map = new Map<string, { original: number; revised: number; count: number; projects: string[] }>();
    data.forEach((row) => {
      const ministry = row.Ministry?.trim() || "Unknown";
      if (!map.has(ministry)) map.set(ministry, { original: 0, revised: 0, count: 0, projects: [] });
      const entry = map.get(ministry)!;
      entry.original += parseValue(row.Original_Value_BDT);
      entry.revised += parseValue(row.Revised_Value_BDT);
      entry.count += 1;
      if (row.Project_Name) entry.projects.push(row.Project_Name);
    });
    return Array.from(map.entries())
      .map(([ministry, v]) => ({ ministry, ...v }))
      .sort((a, b) => (b.original + b.revised) - (a.original + a.revised));
  }, [data]);

  // Abbreviate long ministry names for the axis
  const abbreviated = ministryData.map((d) => ({
    ...d,
    shortName: d.ministry.length > 22
      ? d.ministry.replace(/\b(and|of|the|for|in)\b/gi, (m) => m[0].toUpperCase()).replace(/\s+/g, " ").substring(0, 22) + "…"
      : d.ministry,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Ministry-Level Spend Breakdown
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Original vs Revised total spend per ministry — hover a bar for full details
          </p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-500 opacity-85" />
            <span className="text-xs text-muted-foreground">Original</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500 opacity-85" />
            <span className="text-xs text-muted-foreground">Revised</span>
          </div>
        </div>
      </div>

      {ministryData.length === 0 ? (
        <div className="h-72 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">No ministry data available</p>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={abbreviated}
              margin={{ top: 4, right: 8, left: 4, bottom: 60 }}
              barSize={12}
              barCategoryGap="30%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(217 33% 17%)"
                vertical={false}
              />
              <XAxis
                dataKey="shortName"
                tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }}
                axisLine={{ stroke: "hsl(217 33% 17%)" }}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={65}
              />
              <YAxis
                tickFormatter={formatBDTShort}
                tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                content={<MinistryTooltip />}
                cursor={{ fill: "hsl(217 33% 20% / 0.4)" }}
              />
              <Legend wrapperStyle={{ display: "none" }} />
              <Bar
                dataKey="original"
                name="Original Spend"
                fill="#3b82f6"
                fillOpacity={0.85}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="revised"
                name="Revised Spend"
                fill="#ef4444"
                fillOpacity={0.85}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
