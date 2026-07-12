import { useState, useEffect, useCallback, useMemo } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import Button from "../../../components/ui/button/Button";
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
import { getExpiringRedemptionsReport } from "../../../services/protected/reports.services";
import { getPharmacies } from "../../../services/protected/pharmacies.services";
import { PharmacyData } from "../../../types/services/protected/pharmacies.types";
import * as XLSX from "xlsx";

const DAYS_OPTIONS = [
  { value: "3", label: "3 días" },
  { value: "7", label: "7 días" },
  { value: "15", label: "15 días" },
  { value: "30", label: "30 días" },
];

interface ExpiringRedemption {
  id: number;
  pharmacy_name: string;
  patient: { id: number; full_name: string; identification_number: string; phone: string };
  product: { id: number; name: string; dose: string };
  issue_date: string;
  expiration_date: string;
  days_remaining: number;
}

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-ES", {
    year: "numeric", month: "short", day: "numeric",
  });
};

const getDaysBadgeClass = (days: number) => {
  if (days <= 3)
    return "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  if (days <= 7)
    return "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
};

export default function CanjesPorExpirarPage() {
  const [pharmacies, setPharmacies] = useState<PharmacyData[]>([]);
  const [redemptions, setRedemptions] = useState<ExpiringRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [filterDays, setFilterDays] = useState("7");
  const [filterPharmacyId, setFilterPharmacyId] = useState("");

  useEffect(() => {
    getPharmacies()
      .then((res) => { if (res.status === 200 && Array.isArray(res.data)) setPharmacies(res.data); })
      .catch(() => {});
  }, []);

  const loadRedemptions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const params: { days?: number; pharmacy_id?: number } = { days: Number(filterDays) };
      if (filterPharmacyId) params.pharmacy_id = Number(filterPharmacyId);
      const res = await getExpiringRedemptionsReport(params);
      if (res.status === 200) {
        setRedemptions(res.data);
        setHasSearched(true);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Ocurrió un error al obtener el reporte");
      setRedemptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterDays, filterPharmacyId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadRedemptions();
  };

  const resetFilters = () => {
    setFilterDays("7");
    setFilterPharmacyId("");
    setRedemptions([]);
    setHasSearched(false);
    setErrorMessage("");
  };

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const dataToExport = redemptions.map((r) => ({
        "Farmacia/Sucursal": r.pharmacy_name,
        "Paciente": r.patient.full_name,
        "Cédula": r.patient.identification_number,
        "Teléfono": r.patient.phone,
        "Producto": r.product.name,
        "Presentación": r.product.dose,
        "Fecha Emisión": formatDate(r.issue_date),
        "Fecha Vencimiento": formatDate(r.expiration_date),
        "Días Restantes": r.days_remaining,
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Canjes por Expirar");
      worksheet["!cols"] = [
        { wch: 28 }, { wch: 28 }, { wch: 14 }, { wch: 14 },
        { wch: 24 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 14 },
      ];
      const timestamp = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `CanjesPorExpirar_${timestamp}.xlsx`);
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

  return (
    <>
      <PageMeta title="Canjes por Expirar | Alter Pharma" description="Reporte de canjes próximos a vencer" />
      <div className="flex flex-col gap-6">
        <PageBreadcrumb pageTitle="Canjes por Expirar" />

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Canjes por Expirar</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Canjes disponibles próximos a vencer — filtrá por rango de días y farmacia
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
                <Label>Rango de días</Label>
                <Select options={DAYS_OPTIONS} value={filterDays} onChange={setFilterDays} />
              </div>
              <div>
                <Label>Farmacia</Label>
                <Select options={pharmacyOptions} value={filterPharmacyId} onChange={setFilterPharmacyId} placeholder="Todas las farmacias" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Buscando..." : "Buscar"}
              </Button>
              <Button type="button" variant="outline" onClick={resetFilters}>
                Limpiar
              </Button>
              {hasSearched && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {redemptions.length} resultado{redemptions.length !== 1 ? "s" : ""}
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
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Farmacia/Sucursal</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Paciente</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Teléfono</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Producto</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha Emisión</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha Vencimiento</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Días Restantes</TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {redemptions.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{r.pharmacy_name}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{r.patient.full_name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{r.patient.identification_number}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                        {r.patient.phone}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{r.product.name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{r.product.dose}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                        {formatDate(r.issue_date)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                        {formatDate(r.expiration_date)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <span className={getDaysBadgeClass(r.days_remaining)}>
                          {r.days_remaining} {r.days_remaining === 1 ? "día" : "días"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {redemptions.length === 0 && !isLoading && (
                <div className="px-5 py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">Sin resultados</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    No hay canjes que vencen en los próximos {filterDays} días.
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
          </div>
        )}
      </div>
    </>
  );
}
