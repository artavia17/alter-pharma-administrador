import { useState, useEffect, useCallback, useMemo } from "react";
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
import { getRedemptionDetails, exportRedemptionDetails } from "../../../services/protected/redemptions-report.services";
import { getPharmacies } from "../../../services/protected/pharmacies.services";
import { getSubPharmacies } from "../../../services/protected/sub-pharmacies.services";
import { RedemptionDetailData, RedemptionsDetailPagination } from "../../../types/services/protected/redemptions-report.types";
import { PharmacyData } from "../../../types/services/protected/pharmacies.types";
import { formatDate } from "../../../helper/formatData";
import * as XLSX from "xlsx";

interface SubPharmacyOption {
  id: number;
  commercial_name: string;
  status: boolean;
}

const PER_PAGE_OPTIONS = [
  { value: "15", label: "15 por página" },
  { value: "30", label: "30 por página" },
  { value: "50", label: "50 por página" },
  { value: "100", label: "100 por página" },
];

const CHAIN_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "true", label: "Cadenas" },
  { value: "false", label: "Independientes" },
];

export default function CanjesFarmaciaPage() {
  const [pharmacies, setPharmacies] = useState<PharmacyData[]>([]);
  const [subPharmacies, setSubPharmacies] = useState<SubPharmacyOption[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionDetailData[]>([]);
  const [pagination, setPagination] = useState<RedemptionsDetailPagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Filtros
  const [filterIsChain, setFilterIsChain] = useState("");
  const [filterPharmacyId, setFilterPharmacyId] = useState("");
  const [filterSubPharmacyId, setFilterSubPharmacyId] = useState("");
  const [filterSubPharmacyName, setFilterSubPharmacyName] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [perPage, setPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoadingSubPharmacies, setIsLoadingSubPharmacies] = useState(false);

  useEffect(() => {
    loadPharmacies();
  }, []);

  const loadPharmacies = async () => {
    try {
      const res = await getPharmacies();
      if (res.status === 200 && Array.isArray(res.data)) {
        setPharmacies(res.data);
      }
    } catch {}
  };

  const handlePharmacyChange = async (value: string) => {
    setFilterPharmacyId(value);
    setFilterSubPharmacyId("");
    setSubPharmacies([]);

    if (!value) return;
    const pharmacy = pharmacies.find((p) => p.id.toString() === value);
    if (!pharmacy?.is_chain) return;

    setIsLoadingSubPharmacies(true);
    try {
      const res = await getSubPharmacies(parseInt(value));
      if (res.status === 200 && Array.isArray(res.data)) {
        setSubPharmacies(res.data as SubPharmacyOption[]);
      }
    } catch {} finally {
      setIsLoadingSubPharmacies(false);
    }
  };

  const buildParams = useCallback(() => {
    const params: any = { per_page: perPage };
    if (filterIsChain !== "") params.is_chain = filterIsChain === "true";
    if (filterPharmacyId) params.pharmacy_id = parseInt(filterPharmacyId);
    if (filterSubPharmacyId) params.sub_pharmacy_id = parseInt(filterSubPharmacyId);
    if (filterSubPharmacyName) params.sub_pharmacy_name = filterSubPharmacyName;
    if (filterStartDate) params.start_date = filterStartDate;
    if (filterEndDate) params.end_date = filterEndDate;
    return params;
  }, [filterIsChain, filterPharmacyId, filterSubPharmacyId, filterSubPharmacyName, filterStartDate, filterEndDate, perPage]);

  const loadRedemptions = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await getRedemptionDetails({ ...buildParams(), page });
      if (res.status === 200 && res.data) {
        setPagination(res.data);
        setRedemptions(res.data.data);
        setCurrentPage(res.data.current_page);
        setHasSearched(true);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Ocurrió un error al obtener los canjes");
      setRedemptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadRedemptions(1);
  };

  const resetFilters = () => {
    setFilterIsChain("");
    setFilterPharmacyId("");
    setFilterSubPharmacyId("");
    setFilterSubPharmacyName("");
    setFilterStartDate("");
    setFilterEndDate("");
    setSubPharmacies([]);
    setCurrentPage(1);
    setRedemptions([]);
    setPagination(null);
    setHasSearched(false);
    setErrorMessage("");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadRedemptions(page);
  };

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const res = await exportRedemptionDetails(buildParams());
      const rows = res.data?.data ?? [];

      const dataToExport = rows.map((r) => ({
        "ID": r.id,
        "Fecha de canje": r.redemption_date,
        "Creado en": formatDate(r.created_at),
        "Sucursal/Farmacia": r.sub_pharmacy_name ?? "Farmacia principal",
        "Paciente": r.patient_name,
        "Identificación": r.patient_identification,
        "Producto": r.product_name,
        "Presentación": r.product_dose,
        "Cant. Canjeada": r.quantity_redeemed,
        "Cant. Recibida": r.quantity_received,
        "Notas": r.notes ?? "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Canjes");
      worksheet["!cols"] = [
        { wch: 6 }, { wch: 14 }, { wch: 18 }, { wch: 35 }, { wch: 30 },
        { wch: 18 }, { wch: 30 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 25 },
      ];
      const timestamp = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `Canjes_Farmacia_${timestamp}.xlsx`);
    } catch {
      setErrorMessage("Ocurrió un error al exportar el reporte");
    } finally {
      setIsExporting(false);
    }
  };

  const pharmacyOptions = useMemo(() => [
    { value: "", label: "Todas las farmacias" },
    ...pharmacies.filter((p) => p.status).map((p) => ({
      value: p.id.toString(),
      label: p.commercial_name,
    })),
  ], [pharmacies]);

  const subPharmacyOptions = useMemo(() => [
    { value: "", label: "Todas las sucursales" },
    ...subPharmacies.filter((s) => s.status).map((s) => ({
      value: s.id.toString(),
      label: s.commercial_name,
    })),
  ], [subPharmacies]);

  const selectedPharmacy = pharmacies.find((p) => p.id.toString() === filterPharmacyId);
  const isChainSelected = selectedPharmacy?.is_chain === true;

  return (
    <>
      <PageMeta title="Canjes por Farmacia | Alter Pharma" description="Reporte de canjes detallados por farmacia" />
      <div className="flex flex-col gap-6">
        <PageBreadcrumb pageTitle="Canjes por Farmacia" />

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Canjes por Farmacia</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Detalle de canjes filtrados por farmacia, sucursal y rango de fechas
            </p>
          </div>
          {hasSearched && redemptions.length > 0 && (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Tipo de farmacia</Label>
                <Select options={CHAIN_OPTIONS} value={filterIsChain} onChange={setFilterIsChain} />
              </div>
              <div>
                <Label>Farmacia</Label>
                <Select options={pharmacyOptions} value={filterPharmacyId} onChange={handlePharmacyChange} placeholder="Todas las farmacias" />
              </div>
              {isChainSelected && (
                <div>
                  <Label>Sucursal {isLoadingSubPharmacies && <span className="text-xs text-gray-400">(cargando...)</span>}</Label>
                  <Select options={subPharmacyOptions} value={filterSubPharmacyId} onChange={setFilterSubPharmacyId} disabled={isLoadingSubPharmacies} placeholder="Todas las sucursales" />
                </div>
              )}
              {!isChainSelected && (
                <div>
                  <Label>Nombre de sucursal</Label>
                  <Input
                    type="text"
                    value={filterSubPharmacyName}
                    onChange={(e) => setFilterSubPharmacyName(e.target.value)}
                    placeholder="Buscar por nombre..."
                  />
                </div>
              )}
              <div>
                <Label>Fecha inicio</Label>
                <Input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
              </div>
              <div>
                <Label>Fecha fin</Label>
                <Input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
              </div>
              <div>
                <Label>Registros por página</Label>
                <Select
                  options={PER_PAGE_OPTIONS}
                  value={perPage.toString()}
                  onChange={(v) => setPerPage(parseInt(v))}
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
                  {pagination.total} resultado{pagination.total !== 1 ? "s" : ""}
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
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Sucursal / Farmacia</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Paciente</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Producto</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Cant. Canjeada</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Cant. Recibida</TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {redemptions.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{r.id}</TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{r.redemption_date}</TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block text-sm text-gray-800 dark:text-white/90">
                          {r.sub_pharmacy_name ?? (
                            <span className="italic text-gray-400">Farmacia principal</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{r.patient_name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{r.patient_identification}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{r.product_name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{r.product_dose}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {r.quantity_redeemed}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {r.quantity_received}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {redemptions.length === 0 && !isLoading && (
                <div className="px-5 py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">Sin resultados</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    No se encontraron canjes con los filtros aplicados.
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
