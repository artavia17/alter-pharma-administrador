import { useState, useCallback, useMemo } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Select from "../../../components/form/Select";
import Alert from "../../../components/ui/alert/Alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { getFraudReport } from "../../../services/protected/reports.services";
import * as XLSX from "xlsx";

interface FraudRow {
  patient_id: number;
  patient_name: string;
  identification_number: string;
  phone: string;
  product_id: number;
  product_name: string;
  dose: string;
  pharmacy_id: number;
  pharmacy_name: string;
  is_chain: boolean;
  transaction_date: string;
  transaction_count: number;
  total_quantity: number;
  locations: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

const PER_PAGE_OPTIONS = [
  { value: "15", label: "15 por página" },
  { value: "25", label: "25 por página" },
  { value: "50", label: "50 por página" },
  { value: "100", label: "100 por página" },
];

const formatDate = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("es-ES", {
    year: "numeric", month: "short", day: "numeric",
  });
};

function RiskBadge({ count }: { count: number }) {
  if (count >= 4)
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400">
        Crítico · {count}
      </span>
    );
  if (count === 3)
    return (
      <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
        Alto · {count}
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
      Medio · {count}
    </span>
  );
}

export default function ReporteFraudesPage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfYear = `${new Date().getFullYear()}-01-01`;

  const [startDate, setStartDate] = useState(firstOfYear);
  const [endDate, setEndDate] = useState(today);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<FraudRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  const fetchReport = useCallback(async (pg = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await getFraudReport({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: search || undefined,
        per_page: perPage,
        page: pg,
      });
      setRows(res.data?.data ?? []);
      setMeta(res.data
        ? { current_page: res.data.current_page, last_page: res.data.last_page, per_page: res.data.per_page, total: res.data.total, from: res.data.from, to: res.data.to }
        : null
      );
      setPage(pg);
      setHasFetched(true);
    } catch {
      setError("Error al cargar el reporte de fraudes.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, search, perPage]);

  const handleBuscar = () => fetchReport(1);

  const handlePageChange = (pg: number) => fetchReport(pg);

  const handleExport = () => {
    if (!rows.length) return;
    const data = rows.map((r) => ({
      "Paciente": r.patient_name,
      "Cédula": r.identification_number,
      "Teléfono": r.phone,
      "Medicamento": r.product_name,
      "Presentación": r.dose,
      "Farmacia / Cadena": r.pharmacy_name,
      "Ubicaciones": r.locations,
      "Fecha": r.transaction_date,
      "# Transacciones": r.transaction_count,
      "Unidades totales": r.total_quantity,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fraudes");
    XLSX.writeFile(wb, `reporte-fraudes-${today}.xlsx`);
  };

  const pages = useMemo(() => {
    if (!meta) return [];
    const arr: number[] = [];
    for (let i = Math.max(1, meta.current_page - 2); i <= Math.min(meta.last_page, meta.current_page + 2); i++) arr.push(i);
    return arr;
  }, [meta]);

  return (
    <>
      <PageMeta title="Reporte de Fraudes | Alter Pharma" description="Pacientes con compras duplicadas del mismo producto en el mismo día y farmacia" />
      <PageBreadcrumb pageTitle="Reporte de Fraudes" />

      {/* ── Filtros ── */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Desde</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>Hasta</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <Label>Buscar paciente</Label>
            <Input
              placeholder="Nombre o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <Label>Resultados por página</Label>
            <Select
              options={PER_PAGE_OPTIONS}
              value={String(perPage)}
              onChange={(v) => setPerPage(Number(v))}
              placeholder="Por página"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={handleBuscar} disabled={loading}>
            {loading ? "Cargando..." : "Buscar"}
          </Button>
          <button
            onClick={handleExport}
            disabled={!rows.length}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar Excel
          </button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* ── Resumen ── */}
      {hasFetched && meta && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-red-600 dark:text-red-400">{meta.total}</span> caso{meta.total !== 1 ? "s" : ""} detectado{meta.total !== 1 ? "s" : ""}
            {meta.total > 0 && ` (mostrando ${meta.from}–${meta.to})`}
          </p>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {!hasFetched ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-50">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="text-sm">Selecciona un rango de fechas y presiona Buscar</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-50">
              <path d="M9 12l2 2 4-4"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-sm font-medium">Sin casos de fraude detectados en el período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Paciente</TableCell>
                  <TableCell isHeader>Medicamento</TableCell>
                  <TableCell isHeader>Farmacia / Cadena</TableCell>
                  <TableCell isHeader>Fecha</TableCell>
                  <TableCell isHeader>Ubicaciones</TableCell>
                  <TableCell isHeader className="text-center">Riesgo</TableCell>
                  <TableCell isHeader className="text-right">Unidades</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <p className="font-medium text-gray-800 dark:text-white/90">{row.patient_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{row.identification_number} · {row.phone}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-gray-700 dark:text-gray-300">{row.product_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{row.dose}</p>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{row.pharmacy_name}</span>
                      {row.is_chain && (
                        <span className="ml-1.5 inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Cadena</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700 dark:text-gray-300">{formatDate(row.transaction_date)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{row.locations}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <RiskBadge count={row.transaction_count} />
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-800 dark:text-white/90">
                      {row.total_quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Paginación ── */}
      {meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/[0.05]"
          >
            ‹
          </button>
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05]"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === meta.last_page}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/[0.05]"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}
