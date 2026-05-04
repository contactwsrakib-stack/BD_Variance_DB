import { useState, useEffect } from "react";
import Papa from "papaparse";

export interface ProcurementRow {
  Project_Name: string;
  Original_Value_BDT: string;
  Revised_Value_BDT: string;
  Contractor_Origin: string;
  Original_Award_Year: string;
  Revision_Year: string;
  Additional_Note: string;
  Red_Flag: string;
  "Found_in_EGP_Portal?": string;
  Contractor: string;
  Source_APA_Reference: string;
  [key: string]: string;
}

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/1znaGclNLDettAV0K5PtGhurccZ_fsiN3/export?format=csv";

/** Normalize a CSV column header: replace spaces with underscores */
function normalizeKey(key: string): string {
  return key.replace(/ /g, "_");
}

/** Remap every row's keys so spaces become underscores */
function normalizeRow(raw: Record<string, string>): ProcurementRow {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[normalizeKey(k)] = v;
  }
  return out as ProcurementRow;
}

export function useProcurementData() {
  const [data, setData] = useState<ProcurementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Papa.parse<Record<string, string>>(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Filter out summary/totals rows (rows with no Project_Name)
        const clean = results.data
          .map(normalizeRow)
          .filter((r) => r.Project_Name?.trim() !== "");
        setData(clean);
        setLoading(false);
      },
      error: (err) => {
        setError(err.message);
        setLoading(false);
      },
    });
  }, []);

  return { data, loading, error };
}

/** Strip commas and parse BDT numeric string to float */
export function parseValue(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/,/g, "").replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

export function formatBDT(value: number): string {
  if (value >= 1e12) return `Tk ${(value / 1e12).toFixed(2)} Trillion`;
  if (value >= 1e9) return `Tk ${(value / 1e9).toFixed(2)} Billion`;
  if (value >= 1e7) return `Tk ${(value / 1e7).toFixed(2)} Cr`;
  if (value >= 1e5) return `Tk ${(value / 1e5).toFixed(2)} Lakh`;
  return `Tk ${value.toLocaleString()}`;
}

export function formatBDTShort(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e7) return `${(value / 1e7).toFixed(1)}Cr`;
  return `${(value / 1e5).toFixed(0)}L`;
}
