import { useProcurementData } from "../hooks/useProcurementData";
import KpiCards from "../components/KpiCards";
import OriginDonut from "../components/OriginDonut";
import SpendBarCharts from "../components/SpendBarCharts";
import BlackBoxTable from "../components/BlackBoxTable";
import MasterTable from "../components/MasterTable";
import { Loader2, AlertCircle, Activity } from "lucide-react";

export default function Dashboard() {
  const { data, loading, error } = useProcurementData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Fetching procurement data</p>
            <p className="text-xs text-muted-foreground mt-1">Parsing live CSV from Google Sheets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 max-w-sm text-center p-6">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-sm font-semibold text-foreground">Failed to load data</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground">
            The Google Sheets CSV may require public access. Ensure the sheet is published for public viewing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-none">
                Procurement Anomaly Intelligence
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Live data — Bangladesh public procurement analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {data.length} contracts loaded
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">

        {/* Row 1: KPI Cards */}
        <section>
          <KpiCards data={data} />
        </section>

        {/* Row 2: Contractor Origin Donut */}
        <section>
          <OriginDonut data={data} />
        </section>

        {/* Row 3: Dual Bar Charts */}
        <section>
          <SpendBarCharts data={data} />
        </section>

        {/* Row 4: Black Box Table */}
        <section>
          <BlackBoxTable data={data} />
        </section>

        {/* Row 5: Master Database Table */}
        <section>
          <MasterTable data={data} />
        </section>

      </main>

      <footer className="border-t border-border mt-8 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs text-muted-foreground text-center">
            Data sourced live from published Google Sheets CSV export. All figures in BDT (Bangladeshi Taka).
          </p>
        </div>
      </footer>
    </div>
  );
}
