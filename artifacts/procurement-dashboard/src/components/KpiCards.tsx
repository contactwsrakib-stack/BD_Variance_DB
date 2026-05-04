import { useMemo } from "react";
import { ProcurementRow, parseValue, formatBDT } from "../hooks/useProcurementData";
import { TrendingUp, DollarSign, EyeOff } from "lucide-react";

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

  const opaqueCount = useMemo(
    () =>
      data.filter(
        (row) => row["Found in EGP Portal?"]?.trim().toLowerCase() === "no"
      ).length,
    [data]
  );

  const overrunPct =
    totalOriginal > 0
      ? (((totalRevised - totalOriginal) / totalOriginal) * 100).toFixed(1)
      : "0";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
        <p className="text-3xl font-bold text-foreground leading-tight">
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
        <p className="text-3xl font-bold text-foreground leading-tight">
          {formatBDT(totalRevised)}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <TrendingUp className="w-3.5 h-3.5 text-red-400" />
          <p className="text-xs text-red-400 font-medium">
            +{overrunPct}% overrun from original
          </p>
        </div>
      </div>

      {/* Opaque Contracts */}
      <div className="rounded-xl border border-amber-500/20 bg-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Opaque Contracts
          </p>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <EyeOff className="w-4 h-4 text-amber-400" />
          </div>
        </div>
        <p className="text-3xl font-bold text-amber-400 leading-tight">
          {opaqueCount}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Projects absent from EGP / citizen portals
        </p>
      </div>
    </div>
  );
}
