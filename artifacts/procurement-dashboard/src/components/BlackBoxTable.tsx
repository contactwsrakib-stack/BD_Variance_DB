import { useMemo } from "react";
import { ProcurementRow, parseValue, formatBDT } from "../hooks/useProcurementData";
import { AlertTriangle, ExternalLink, Search } from "lucide-react";

interface Props {
  data: ProcurementRow[];
}

export default function BlackBoxTable({ data }: Props) {
  const missing = useMemo(
    () =>
      data.filter(
        (row) =>
          row["Found_in_EGP_Portal?"]?.trim().toLowerCase() === "no"
      ),
    [data]
  );

  return (
    <div className="rounded-xl border border-red-500/30 bg-card overflow-hidden" style={{ boxShadow: "0 0 20px rgba(239, 68, 68, 0.08)" }}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-red-500/20 bg-red-500/5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Search className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-red-400 leading-snug">
              Targeted Transparency Audit (Sample Size: {missing.length} contracts)
            </h2>
            <p className="text-xs text-red-400/70 mt-1.5 italic leading-relaxed">
              Methodology Note: This table highlights a targeted sample of high-value mega-projects manually audited for public visibility. None of these contracts were accessible via the public EGP or Citizen portals.
            </p>
          </div>
        </div>
      </div>

      {missing.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">No projects flagged as missing from the EGP Portal.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-red-500/10">
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-widest text-red-400/80">
                  Project Name
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-widest text-red-400/80">
                  Original Value BDT
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-widest text-red-400/80">
                  Revised Value BDT
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-widest text-red-400/80">
                  Contractor
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-widest text-red-400/80">
                  Source Link
                </th>
              </tr>
            </thead>
            <tbody>
              {missing.map((row, i) => {
                const origVal = parseValue(row.Original_Value_BDT);
                const revVal = parseValue(row.Revised_Value_BDT);
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
                          {row.Project_Name || row["Project Name"] || "—"}
                        </span>
                      </div>
                      {(row.Red_Flag || row["Red Flag"]) && (
                        <div className="mt-1.5 ml-3.5 flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-red-400/80 leading-relaxed">
                            {row.Red_Flag || row["Red Flag"]}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm tabular-nums text-blue-400">
                        {origVal > 0 ? formatBDT(origVal) : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-red-400 tabular-nums">
                        {revVal > 0 ? formatBDT(revVal) : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-muted-foreground">
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
                          <span className="truncate max-w-[200px]">View Source</span>
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
      )}
    </div>
  );
}
