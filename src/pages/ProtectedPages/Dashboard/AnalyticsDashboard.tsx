import { useState, useEffect, useCallback } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { getDashboard } from "../../../services/protected/dashboard.services";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Summary {
  total_pharmacies: number;
  total_chains: number;
  total_independents: number;
  total_branches: number;
  new_patients: number;
  total_purchases: number;
  total_redemptions: number;
}

interface PharmacyMonthRow {
  month: string;
  label: string;
  chains: number;
  pos_chains: number;
  independents: number;
}

interface ProductMonthRow {
  month: string;
  label: string;
  total: number;
  by_product: Record<string, number>;
}

interface ProductMonthly {
  months: ProductMonthRow[];
  products: string[];
}

interface TopEntry {
  rank: number;
  name: string;
  count: number;
  percentage: number;
}

interface DashboardData {
  period: { start: string; end: string };
  summary: Summary;
  pharmacies_monthly: PharmacyMonthRow[];
  patients_monthly: ProductMonthly;
  purchases_monthly: ProductMonthly;
  redemptions_monthly: ProductMonthly;
  top_pharmacies_purchases: TopEntry[];
  top_pharmacies_redemptions: TopEntry[];
  top_branches_purchases: TopEntry[];
  top_branches_redemptions: TopEntry[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCT_COLORS: Record<string, string> = {
  "MAXERECT": "#3B82F6",
  "CINFAVAL BCC PLUS": "#86EFAC",
  "EZMOGARD": "#F59E0B",
  "PROLATEM": "#1E3A5F",
  "PRELIZAT": "#D97706",
  "IRBEA": "#A855F7",
  "IRBEA PLUS": "#14B8A6",
  "OLMEPRESS": "#7C3AED",
  "OLMEPRESS PLUS": "#84CC16",
  "OLMEPRESSAM": "#92400E",
  "ROSVACOR": "#EF4444",
  "NOSADEX": "#4D7C0F",
};

const FALLBACK_COLORS = [
  "#06B6D4", "#F43F5E", "#10B981", "#6366F1", "#F97316",
  "#8B5CF6", "#EC4899", "#14B8A6", "#EAB308", "#64748B",
];

function getProductColor(product: string, index: number): string {
  return PRODUCT_COLORS[product] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getDefaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return {
    start: toDateStr(start),
    end: toDateStr(now),
  };
}

type Preset = "3m" | "6m" | "year" | "custom";

function computePresetDates(preset: Preset): { start: string; end: string } | null {
  const now = new Date();
  if (preset === "3m") {
    return { start: toDateStr(new Date(now.getFullYear(), now.getMonth() - 2, 1)), end: toDateStr(now) };
  }
  if (preset === "6m") {
    return { start: toDateStr(new Date(now.getFullYear(), now.getMonth() - 5, 1)), end: toDateStr(now) };
  }
  if (preset === "year") {
    return { start: `${now.getFullYear()}-01-01`, end: toDateStr(now) };
  }
  return null;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyChart() {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-gray-400 dark:text-gray-500">
      Sin datos para el período seleccionado
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}

function KpiCard({ label, value, sub, color = "blue" }: KpiCardProps) {
  const accent: Record<string, string> = {
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    purple: "text-purple-600 dark:text-purple-400",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent[color] ?? accent.blue}`}>
        {typeof value === "number" ? value.toLocaleString("es") : value}
      </p>
      {sub && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

// ─── Stacked bar chart ────────────────────────────────────────────────────────

interface StackedBarProps {
  title: string;
  data: ProductMonthly | null;
  loading: boolean;
}

function StackedBarChart({ title, data, loading }: StackedBarProps) {
  const isEmpty = !data || data.months.length === 0 || data.products.length === 0;

  const series: ApexAxisChartSeries = isEmpty
    ? []
    : data.products.map((prod, i) => ({
        name: prod,
        data: data.months.map((m) => m.by_product[prod] ?? 0),
        color: getProductColor(prod, i),
      }));

  const options: ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
      background: "transparent",
      toolbar: { show: false },
    },
    xaxis: {
      categories: isEmpty ? [] : data.months.map((m) => m.label),
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
    },
    dataLabels: { enabled: false },
    theme: { mode: "light" },
    plotOptions: {
      bar: { columnWidth: "60%" },
    },
    grid: {
      borderColor: "#e5e7eb",
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      {loading ? (
        <Spinner />
      ) : isEmpty ? (
        <EmptyChart />
      ) : (
        <ReactApexChart
          type="bar"
          series={series}
          options={options}
          height={320}
          width="100%"
        />
      )}
    </div>
  );
}

// ─── Pharmacies monthly table ──────────────────────────────────────────────────

interface PharmaciesTableProps {
  rows: PharmacyMonthRow[];
  loading: boolean;
}

function PharmaciesTable({ rows, loading }: PharmaciesTableProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
        Farmacias Afiliadas por Mes
      </h3>
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyChart />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/[0.05]">
                <th className="pb-3 text-left font-medium text-gray-500 dark:text-gray-400">Mes</th>
                <th className="pb-3 text-right font-medium text-gray-500 dark:text-gray-400">Cadenas</th>
                <th className="pb-3 text-right font-medium text-gray-500 dark:text-gray-400">POS Cadenas</th>
                <th className="pb-3 text-right font-medium text-gray-500 dark:text-gray-400">Independientes</th>
                <th className="pb-3 text-right font-medium text-gray-500 dark:text-gray-400">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.month}
                  className="border-b border-gray-100 last:border-0 dark:border-white/[0.03]"
                >
                  <td className="py-2.5 text-gray-700 dark:text-gray-300">{row.label} {row.month.slice(0, 4)}</td>
                  <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">{row.chains}</td>
                  <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">{row.pos_chains}</td>
                  <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">{row.independents}</td>
                  <td className="py-2.5 text-right font-semibold text-gray-800 dark:text-white/90">
                    {row.chains + row.pos_chains + row.independents}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Top ranked list ──────────────────────────────────────────────────────────

interface TopListProps {
  title: string;
  entries: TopEntry[];
  loading: boolean;
}

function TopList({ title, entries, loading }: TopListProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      {loading ? (
        <Spinner />
      ) : entries.length === 0 ? (
        <EmptyChart />
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.rank} className="flex items-center gap-3">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {entry.rank}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                {entry.name}
              </span>
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {entry.count.toLocaleString("es")}
              </span>
              <span className="w-14 text-right text-sm text-blue-600 dark:text-blue-400">
                {entry.percentage}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Pie chart ────────────────────────────────────────────────────────────────

interface BranchesPieProps {
  title: string;
  entries: TopEntry[];
  loading: boolean;
}

function BranchesPie({ title, entries, loading }: BranchesPieProps) {
  const isEmpty = entries.length === 0;

  const series = isEmpty ? [] : entries.map((e) => e.count);
  const labels = isEmpty ? [] : entries.map((e) => e.name);
  const colors = isEmpty
    ? []
    : entries.map((_, i) => FALLBACK_COLORS[i % FALLBACK_COLORS.length]);

  const options: ApexOptions = {
    chart: {
      type: "pie",
      background: "transparent",
      toolbar: { show: false },
    },
    labels,
    colors,
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "12px",
    },
    dataLabels: {
      enabled: true,
      formatter: (_val: number, opts: { seriesIndex: number; w: { globals: { series: number[] } } }) => {
        const total = opts.w.globals.series.reduce((a: number, b: number) => a + b, 0);
        const count = opts.w.globals.series[opts.seriesIndex];
        return total > 0 ? `${((count / total) * 100).toFixed(1)}%` : "0%";
      },
    },
    theme: { mode: "light" },
    tooltip: {
      y: {
        formatter: (val: number) => val.toLocaleString("es"),
      },
    },
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      {loading ? (
        <Spinner />
      ) : isEmpty ? (
        <EmptyChart />
      ) : (
        <ReactApexChart
          type="pie"
          series={series}
          options={options}
          height={340}
          width="100%"
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const defaults = getDefaultDates();

  const [preset, setPreset] = useState<Preset>("3m");
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [pendingStart, setPendingStart] = useState(defaults.start);
  const [pendingEnd, setPendingEnd] = useState(defaults.end);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async (start: string, end: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await getDashboard({ start_date: start, end_date: end });
      setData(result);
    } catch {
      setError("Error al cargar los datos del dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(startDate, endDate);
  }, [fetchData, startDate, endDate]);

  function handlePresetClick(p: Preset) {
    setPreset(p);
    if (p !== "custom") {
      const dates = computePresetDates(p);
      if (dates) {
        setPendingStart(dates.start);
        setPendingEnd(dates.end);
        setStartDate(dates.start);
        setEndDate(dates.end);
      }
    }
  }

  function handleActualizar() {
    setStartDate(pendingStart);
    setEndDate(pendingEnd);
  }

  const summary = data?.summary;

  const presetBtnClass = (p: Preset) =>
    `px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
      preset === p
        ? "bg-blue-600 text-white"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.10]"
    }`;

  return (
    <>
      <PageMeta
        title="Dashboard Analytics | Alter Pharma"
        description="Dashboard analítico con métricas de farmacias, pacientes, compras y canjes"
      />
      <PageBreadcrumb pageTitle="Dashboard Analytics" />

      {/* ── Filter Bar ── */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-2">
            <button className={presetBtnClass("3m")} onClick={() => handlePresetClick("3m")}>
              Últimos 3M
            </button>
            <button className={presetBtnClass("6m")} onClick={() => handlePresetClick("6m")}>
              Últimos 6M
            </button>
            <button className={presetBtnClass("year")} onClick={() => handlePresetClick("year")}>
              Este año
            </button>
            <button className={presetBtnClass("custom")} onClick={() => handlePresetClick("custom")}>
              Personalizado
            </button>
          </div>

          {preset === "custom" && (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Desde
                </label>
                <input
                  type="date"
                  value={pendingStart}
                  onChange={(e) => setPendingStart(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-gray-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Hasta
                </label>
                <input
                  type="date"
                  value={pendingEnd}
                  onChange={(e) => setPendingEnd(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-gray-200"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleActualizar}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Cargando..." : "Actualizar"}
          </button>

          {data?.period && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Período: {data.period.start} — {data.period.end}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Farmacias Activas"
          value={summary?.total_pharmacies ?? 0}
          sub={`${summary?.total_chains ?? 0} cadenas · ${summary?.total_independents ?? 0} independientes`}
          color="blue"
        />
        <KpiCard
          label="Nuevos Pacientes"
          value={summary?.new_patients ?? 0}
          sub="Inscritos en el período"
          color="green"
        />
        <KpiCard
          label="Compras"
          value={summary?.total_purchases ?? 0}
          sub="Transacciones registradas"
          color="amber"
        />
        <KpiCard
          label="Canjes"
          value={summary?.total_redemptions ?? 0}
          sub="Canjes realizados"
          color="purple"
        />
      </div>

      {/* ── Pharmacies table + Patients chart ── */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PharmaciesTable
          rows={data?.pharmacies_monthly ?? []}
          loading={loading}
        />
        <StackedBarChart
          title="Pacientes Inscritos por Mes"
          data={data?.patients_monthly ?? null}
          loading={loading}
        />
      </div>

      {/* ── Purchases stacked bar (full width) ── */}
      <div className="mb-6">
        <StackedBarChart
          title="Compras Registradas por Mes"
          data={data?.purchases_monthly ?? null}
          loading={loading}
        />
      </div>

      {/* ── Redemptions stacked bar (full width) ── */}
      <div className="mb-6">
        <StackedBarChart
          title="Canjes Registrados por Mes"
          data={data?.redemptions_monthly ?? null}
          loading={loading}
        />
      </div>

      {/* ── Top 10 by Pharmacy ── */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopList
          title="Top 10 Farmacias por Compras"
          entries={data?.top_pharmacies_purchases ?? []}
          loading={loading}
        />
        <TopList
          title="Top 10 Farmacias por Canjes"
          entries={data?.top_pharmacies_redemptions ?? []}
          loading={loading}
        />
      </div>

      {/* ── Pie charts by branch ── */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BranchesPie
          title="Distribución Compras por Sucursal"
          entries={data?.top_branches_purchases ?? []}
          loading={loading}
        />
        <BranchesPie
          title="Distribución Canjes por Sucursal"
          entries={data?.top_branches_redemptions ?? []}
          loading={loading}
        />
      </div>
    </>
  );
}
