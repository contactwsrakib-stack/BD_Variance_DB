import { useMemo } from "react";
import { ProcurementRow, parseValue, formatBDT } from "../hooks/useProcurementData";
import { TrendingUp, DollarSign, Crown, Clock } from "lucide-react";

interface Props {
  data: ProcurementRow[];
}

export default function KpiCards({ data }: Props) {
  const totalOriginal = useMemo(
    () => data.reduce((sum, row) => sum + parseValue(row.Original_Value_BDT), 0),
    [data]
  );

  const totalRevised = useMemo(
    () => data.reduce((sum, row) => sum + parseValue(row.Revised_Value_BDT), 0),
    [data]
  );

  const overrunPct =
    totalOriginal > 0
      ? (((totalRevised - totalOriginal) / totalOriginal) * 100).toFixed(1)
      : "0";

  const megaProject = useMemo(() => {
    if (!data.length) return null;
    return data.reduce((best, row) => {
      return parseValue(row.Revised_Value_BDT) > parseValue(best.Revised_Value_BDT)
        ? row
        : best;
    }, data[0]);
  }, [data]);

  const avgDelay = useMemo(() => {
    const revised = data.filter((row) => {
      const revYear = Number(row.Revision_Year?.trim());
      const origYear = Number(row.Original_Award_Year?.trim());
      const revVal = parseValue(row.Revised_Value_BDT);
      return revVal > 0 && !isNaN(revYear) && revYear > 0 && !isNaN(origYear) && origYear > 0;
    });
    if (!revised.length) return null;
    const totalDelay = revised.reduce((sum, row) => {
      return sum + (Number(row.Revision_Year) - Number(row.Original_Award_Year));
    }, 0);
    return { avg: totalDelay / revised.length, count: revised.length };
  }, [data]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Total Original Spend */}
      <div className="rounded-xl border border-blue-500/20 bg-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Total Original Spend
          </p>
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground leading-tight">
          {formatBDT(totalOriginal)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Across {data.length} procurement contracts
        </p>
      </div>

      {/* Total Revised Spend */}
      <div className="rounded-xl border border-red-500/20 bg-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Total Revised Spend
          </p>
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-red-400" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground leading-tight">
          {formatBDT(totalRevised)}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <TrendingUp className="w-3.5 h-3.5 text-red-400" />
          <p className="text-xs text-red-400 font-medium">
            +{overrunPct}% overrun from original
          </p>
        </div>
      </div>

      {/* Largest Single Mega-Project */}
      <div className="rounded-xl border border-amber-500/20 bg-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Largest Mega-Project
          </p>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        {megaProject ? (
          <>
            <p className="text-sm font-bold text-foreground leading-snug line-clamp-2 mb-3">
              {megaProject.Project_Name || "—"}
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-14 flex-shrink-0">Original</span>
                <span className="text-xs font-semibold text-blue-400">
                  {formatBDT(parseValue(megaProject.Original_Value_BDT))}
                </span>
                {megaProject.Original_Award_Year && (
                  <span className="text-xs text-muted-foreground">
                    {megaProject.Original_Award_Year}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-14 flex-shrink-0">Revised</span>
                <span className="text-xs font-bold text-amber-400">
                  {formatBDT(parseValue(megaProject.Revised_Value_BDT))}
                </span>
                {megaProject.Revision_Year && (
                  <span className="text-xs text-muted-foreground">
                    {megaProject.Revision_Year}
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No data available</p>
        )}
      </div>

      {/* Average Time-to-Revision */}
      <div className="rounded-xl border border-purple-500/20 bg-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Avg Time-to-Revision
          </p>
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
        </div>

        {avgDelay ? (
          <>
            <p className="text-2xl font-bold text-purple-400 leading-tight">
              {avgDelay.avg.toFixed(1)} yrs
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Average delay across {avgDelay.count} revised contracts
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No revision data</p>
        )}
      </div>
    </div>
  );
}
