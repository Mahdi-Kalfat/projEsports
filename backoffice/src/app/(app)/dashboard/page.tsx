import type { Metadata } from "next";
import { StatTile } from "@/components/charts/stat-tile";
import { Meter } from "@/components/charts/meter";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { getDashboardData } from "@/lib/dashboard-data";
import { formatCompactCurrency } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard — Back Office",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Active users"
          value={data.kpis.activeUsers.value}
          deltaPct={data.kpis.activeUsers.deltaPct}
          sparkline={data.kpis.activeUsers.sparkline}
        />
        <StatTile
          label="Signups today"
          value={data.kpis.signupsToday.value}
          deltaPct={data.kpis.signupsToday.deltaPct}
          sparkline={data.kpis.signupsToday.sparkline}
        />
        <StatTile
          label="Revenue (MTD)"
          value={data.kpis.revenueMtd.value}
          formattedValue={formatCompactCurrency(data.kpis.revenueMtd.value)}
          deltaPct={data.kpis.revenueMtd.deltaPct}
        />
        <StatTile label="Live tournaments" value={data.kpis.liveTournaments.value} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LineChart title="Signups — last 14 days" data={data.signups14d} />
        </div>
        <Meter
          label="DAU / MAU stickiness"
          ratio={data.dauMau}
          description="Share of monthly active users who also played today."
        />
      </div>

      <BarChart title="Registrations by game" data={data.topGames} />
    </div>
  );
}
