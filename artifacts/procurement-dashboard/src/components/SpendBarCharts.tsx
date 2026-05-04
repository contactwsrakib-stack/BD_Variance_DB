import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  Cell,
} from "recharts";
import {
  ProcurementRow,
  parseValue,
  formatBDT,
  formatBDTShort,
} from "../hooks/useProcurementData";
import { AlertTriangle } from "lucide-react";

interface Props {
  data: ProcurementRow[];
}

interface YearBucket {
  year: string;
  value: number;
  projects: ProcurementRow[];
}

function buildBuckets(
  data: ProcurementRow[],
  yearKey: keyof ProcurementRow,
  valueKey: keyof ProcurementRow
): YearBucket[] {
  const map = new Map<string, YearBucket>();
  data.forEach((row) => {
    const yr = row[yearKey]?.toString().trim();
    if (!yr || yr === "" || yr === "0" || isNaN(Number(yr))) return;
    if (!map.has(yr)) map.set(yr, { year: yr, value: 0, projects: [] });
    const bucket = map.get(yr)!;
    bucket.value += parseValue(row[valueKey] as string);
    bucket.projects.push(row);
  });
  return Array.from(map.values()).sort((a, b) => Number(a.year) - Number(b.year));
}

function DrillTooltip({
  active,
  payload,
  label,
  valueKey,
}: TooltipProps<number, string> & { valueKey: keyof ProcurementRow }) {
  if (!active || !payload?.length) return null;
  const bucket = payload[0]?.payload as YearBucket;
  if (!bucket) return null;

  return (
    <div
      style={{
        background: "hsl(222 47% 10%)",
        border: "1px solid hsl(217 33% 22%)",
        borderRadius: "10px",
        padding: "14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        maxWidth: "340px",
        maxHeight: "360px",
        overflowY: "auto",
      }}
    >
      <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">
        Year {label} &mdash; {formatBDT(bucket.value)}
      </p>
      <div
        style={{ borderTop: "1px solid hsl(217 33% 20%)" }}
        className="mt-1 mb-2"
      />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Contributing Projects ({bucket.projects.length})
      </p>
      <div className="flex flex-col gap-3">
        {bucket.projects.map((p, i) => {
          const val = parseValue(p[valueKey] as string);
          return (
            <div key={i}>
              <p className="text-xs font-medium text-foreground leading-snug">
                {p.Project_Name}
              </p>
              <p className="text-xs font-bold text-blue-300 mt-0.5">
                {formatBDT(val)}
              </p>
              {p.Additional_Note && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {p.Additional_Note}
                </p>
              )}
              {p.Red_Flag && (
                <div className="flex items-start gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400 leading-relaxed">
                    {p.Red_Flag}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarChartPanel({
  title,
  subtitle,
  buckets,
  color,
  valueKey,
}: {
  title: string;
  subtitle: string;
  buckets: YearBucket[];
  color: string;
  valueKey: keyof ProcurementRow;
}) {
  const maxVal = Math.max(...buckets.map((b) => b.value), 1);

  return (
    <div className="rounded-xl border border-border bg-card p-6 flex-1 min-w-0">
      <div className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      {buckets.length === 0 ? (
        <div className="h-56 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">No data available</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={buckets}
              margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
              barSize={Math.max(12, Math.min(40, 320 / buckets.length - 4))}
            >
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
                tickFormatter={formatBDTShort}
                tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, maxVal * 1.12]}
                width={48}
              />
              <Tooltip
                content={(props) => (
                  <DrillTooltip {...props} valueKey={valueKey} />
                )}
                cursor={{ fill: "hsl(217 33% 20% / 0.5)" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {buckets.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={color}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function SpendBarCharts({ data }: Props) {
  const originalBuckets = useMemo(
    () => buildBuckets(data, "Original_Award_Year", "Original_Value_BDT"),
    [data]
  );
  const revisedBuckets = useMemo(
    () => buildBuckets(data, "Revision_Year", "Revised_Value_BDT"),
    [data]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <BarChartPanel
        title="Chart A — Original Awards by Year"
        subtitle="Hover a bar to see which projects drove the spend"
        buckets={originalBuckets}
        color="#3b82f6"
        valueKey="Original_Value_BDT"
      />
      <BarChartPanel
        title="Chart B — Revisions by Year"
        subtitle="Hover a bar to see cost-overrun projects and red flags"
        buckets={revisedBuckets}
        color="#ef4444"
        valueKey="Revised_Value_BDT"
      />
    </div>
  );
}
