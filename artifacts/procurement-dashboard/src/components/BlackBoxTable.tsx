import { useMemo } from "react";
import { ProcurementRow, parseValue, formatBDT } from "../hooks/useProcurementData";
import { AlertTriangle, Eye, ExternalLink } from "lucide-react";

interface Props {
  data: ProcurementRow[];
}

export default function BlackBoxTable({ data }: Props) {
  const missing = useMemo(
    () =>
      data.filter(
        (row) =>
          row["Found in EGP Portal?"]?.trim().toLowerCase() === "no"
      ),
    [data]
  );

  if (missing.length === 0) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Eye className="w-5 h-5 text-red-400" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-red-400">
            Mega-Projects Missing from EGP/Citizen Portals
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">No projects flagged as missing from the EGP Portal.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-500/30 bg-card overflow-hidden glow-red">
      <div className="px-6 py-4 border-b border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-red-400">
              Mega-Projects Missing from EGP/Citizen Portals
            </h2>
            <p className="text-xs text-red-400/70 mt-0.5">
              {missing.length} project{missing.length !== 1 ? "s" : ""} not found in the public EGP Portal
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-red-500/10">
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-widest text-red-400/80">
                Project Name
              </th>
              <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-widest text-red-400/80">
                Revised Value (BDT)
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-widest text-red-400/80">
                Contractor
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-widest text-red-400/80">
                Source / APA Reference
              </th>
            </tr>
          </thead>
          <tbody>
            {missing.map((row, i) => {
              const val = parseValue(row.Revised_Value_BDT);
              const isUrl =
                row.Source_APA_Reference?.startsWith("http://") ||
                row.Source_APA_Reference?.startsWith("https://");
              return (
                <tr
                  key={i}
                  className="border-b border-red-500/10 hover:bg-red-500/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                      <span className="font-medium text-foreground leading-snug">
                        {row.Project_Name || "—"}
                      </span>
                    </div>
                    {row.Red_Flag && (
                      <div className="mt-1.5 ml-3.5 flex items-start gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-red-400/80 leading-relaxed">
                          {row.Red_Flag}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-red-400 tabular-nums">
                      {val > 0 ? formatBDT(val) : "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-muted-foreground text-xs">
                      {row.Contractor || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    {isUrl ? (
                      <a
                        href={row.Source_APA_Reference}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                      >
                        <span className="truncate">{row.Source_APA_Reference}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {row.Source_APA_Reference || "—"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
