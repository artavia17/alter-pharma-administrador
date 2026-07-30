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
  const [currentPage, setCurrentPage] = useState(1);

  const [rows, setRows] = useState<FraudRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const buildParams = useCallback(() => {
    const params: Record<string, unknown> = { per_page: perPage };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (search) params.search = search;
    return params;
  }, [startDate, endDate, search, perPage]);

  const loadReport = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await getFraudReport({ ...buildParams(), page } as Parameters<typeof getFraudReport>[0]);
      if (res.status === 200 && res.data) {
        setRows(res.data.data ?? []);
        setPagination({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          per_page: res.data.per_page,
          total: res.data.total,
          from: res.data.from,
          to: res.data.to,
        });
        setCurrentPage(res.data.current_page);
        setHasSearched(true);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMessage(e.response?.data?.message || "Ocurrió un error al obtener el reporte");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadReport(1);
  };

  const resetFilters = () => {
    setStartDate(firstOfYear);
    setEndDate(today);
    setSearch("");
    setCurrentPage(1);
    setRows([]);
    setPagination(null);
    setHasSearched(false);
    setErrorMessage("");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadReport(page);
  };

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const res = await getFraudReport({ ...buildParams(), per_page: 9999, page: 1 } as Parameters<typeof getFraudReport>[0]);
      const data = (res.data?.data ?? []) as FraudRow[];

      const dataToExport = data.map((r) => ({
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
        "Nivel de riesgo": r.transaction_count >= 4 ? "Crítico" : r.transaction_count === 3 ? "Alto" : "Medio",
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Fraudes");
      worksheet["!cols"] = [
        { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 20 },
        { wch: 30 }, { wch: 45 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 12 },
      ];
      XLSX.writeFile(workbook, `Reporte_Fraudes_${today}.xlsx`);
    } catch {
      setErrorMessage("Ocurrió un error al exportar el reporte");
    } finally {
      setIsExporting(false);
    }
  };

  const pharmacyOptions = useMemo(() => [], []);

  return (
    <>
      <PageMeta title="Reporte de Fraudes | Alter Pharma" description="Pacientes con compras duplicadas del mismo producto en el mismo día y farmacia" />
      <div className="flex flex-col gap-6">
        <PageBreadcrumb pageTitle="Reporte de Fraudes" />

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Reporte de Fraudes</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Pacientes que compraron el mismo producto en la misma farmacia más de una vez en el mismo día
            </p>
          </div>
          {hasSearched && rows.length > 0 && (
            <Button onClick={handleExportToExcel} size="md" variant="outline" disabled={isExporting}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {isExporting ? "Exportando..." : "Exportar a Excel"}
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          {errorMessage && (
            <div className="mb-4">
              <Alert variant="error" title="Error" message={errorMessage} />
            </div>
          )}
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Fecha inicio</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>Fecha fin</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div>
                <Label>Buscar paciente</Label>
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nombre o cédula..."
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
            <div className="flex items-center gap-3 mt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Buscando..." : "Buscar"}
              </Button>
              <Button type="button" variant="outline" onClick={resetFilters}>
                Limpiar
              </Button>
              {pagination && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-red-600 dark:text-red-400">{pagination.total}</span> caso{pagination.total !== 1 ? "s" : ""} detectado{pagination.total !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Tabla */}
        {hasSearched && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Paciente</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Medicamento</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Farmacia / Cadena</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ubicaciones</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Riesgo</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Unidades</TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {rows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{row.patient_name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{row.identification_number} · {row.phone}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{row.product_name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{row.dose}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block text-sm text-gray-800 dark:text-white/90">{row.pharmacy_name}</span>
                        {row.is_chain && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Cadena</span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                        {formatDate(row.transaction_date)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{row.locations}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <RiskBadge count={row.transaction_count} />
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                          {row.total_quantity}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {rows.length === 0 && !isLoading && (
                <div className="px-5 py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">Sin casos detectados</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    No se encontraron compras duplicadas con los filtros aplicados.
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="px-5 py-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status">
                    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Cargando...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Paginación */}
            {pagination && pagination.total > 0 && (
              <div className="border-t border-gray-200 dark:border-white/[0.05] px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Página {pagination.current_page} de {pagination.last_page} — {pagination.total} registros
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading}>
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {currentPage} / {pagination.last_page}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.last_page || isLoading}>
                      Siguiente
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
