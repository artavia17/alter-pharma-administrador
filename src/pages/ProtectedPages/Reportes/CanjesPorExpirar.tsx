import { useState, useEffect, useCallback } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import Button from "../../../components/ui/button/Button";
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

const getDaysColor = (days: number) => {
  if (days <= 3) return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" };
  if (days <= 7) return { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" };
  return { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" };
};

export default function CanjesPorExpirarPage() {
  const [pharmacies, setPharmacies] = useState<PharmacyData[]>([]);
  const [redemptions, setRedemptions] = useState<ExpiringRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [filterDays, setFilterDays] = useState("7");
  const [filterPharmacyId, setFilterPharmacyId] = useState("");

  useEffect(() => {
    getPharmacies()
      .then((res) => { if (res.status === 200) setPharmacies(res.data); })
      .catch(() => {});
  }, []);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const params: { days?: number; pharmacy_id?: number } = {
        days: Number(filterDays),
      };
      if (filterPharmacyId) params.pharmacy_id = Number(filterPharmacyId);
      const res = await getExpiringRedemptionsReport(params);
      if (res.status === 200) {
        setRedemptions(res.data);
        setHasSearched(true);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Error al obtener el reporte");
    } finally {
      setIsLoading(false);
    }
  }, [filterDays, filterPharmacyId]);

  const pharmacyOptions = [
    { value: "", label: "Todas las farmacias" },
    ...pharmacies.map((p) => ({ value: String(p.id), label: p.commercial_name })),
  ];

  const exportToExcel = () => {
    const data = redemptions.map((r) => ({
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
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 28 }, { wch: 28 }, { wch: 14 }, { wch: 14 },
      { wch: 24 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Canjes por Expirar");
    const now = new Date();
    XLSX.writeFile(wb, `CanjesPorExpirar_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.xlsx`);
  };

  const urgentCount = redemptions.filter((r) => r.days_remaining <= 3).length;
  const warningCount = redemptions.filter((r) => r.days_remaining > 3 && r.days_remaining <= 7).length;

  return (
    <>
      <PageMeta title="Canjes por Expirar" description="Reporte de canjes próximos a vencer" />
      <PageBreadcrumb pageTitle="Canjes por Expirar" />

      <div className="space-y-6">
        {/* Filters */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rango de días</label>
              <Select
                options={DAYS_OPTIONS}
                value={filterDays}
                onChange={(val) => setFilterDays(val)}
                placeholder="Selecciona días"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farmacia</label>
              <Select
                options={pharmacyOptions}
                value={filterPharmacyId}
                onChange={(val) => setFilterPharmacyId(val)}
                placeholder="Todas las farmacias"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={loadReport} disabled={isLoading}>
                {isLoading ? "Cargando..." : "Consultar"}
              </Button>
              {redemptions.length > 0 && (
                <Button onClick={exportToExcel} variant="outline">
                  Exportar Excel
                </Button>
              )}
            </div>
          </div>
        </div>

        {errorMessage && (
          <Alert variant="error" title="Error" message={errorMessage} />
        )}

        {/* Stats */}
        {hasSearched && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
              <p className="text-sm font-semibold uppercase text-gray-500 mb-1">Total</p>
              <p className="text-3xl font-bold text-teal-400">{redemptions.length}</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center shadow-sm">
              <p className="text-sm font-semibold uppercase text-red-600 mb-1">Críticos (≤3 días)</p>
              <p className="text-3xl font-bold text-red-600">{urgentCount}</p>
            </div>
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-center shadow-sm">
              <p className="text-sm font-semibold uppercase text-yellow-600 mb-1">Próximos (4–7 días)</p>
              <p className="text-3xl font-bold text-yellow-600">{warningCount}</p>
            </div>
          </div>
        )}

        {/* Table */}
        {hasSearched && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {redemptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <p className="text-lg font-medium text-gray-500">Sin canjes por expirar</p>
                <p className="text-sm mt-1">No hay canjes que venzan en los próximos {filterDays} días</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>Farmacia/Sucursal</TableCell>
                      <TableCell isHeader>Paciente</TableCell>
                      <TableCell isHeader>Cédula</TableCell>
                      <TableCell isHeader>Teléfono</TableCell>
                      <TableCell isHeader>Producto</TableCell>
                      <TableCell isHeader>Presentación</TableCell>
                      <TableCell isHeader>Fecha Emisión</TableCell>
                      <TableCell isHeader>Fecha Vencimiento</TableCell>
                      <TableCell isHeader>Días Restantes</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redemptions.map((r) => {
                      const badgeStyle = getDaysColor(r.days_remaining);
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-semibold">{r.pharmacy_name}</TableCell>
                          <TableCell className="font-semibold">{r.patient.full_name}</TableCell>
                          <TableCell className="text-blue-600 font-semibold">{r.patient.identification_number}</TableCell>
                          <TableCell className="text-gray-500">{r.patient.phone}</TableCell>
                          <TableCell className="font-semibold">{r.product.name}</TableCell>
                          <TableCell className="text-purple-600 font-semibold">{r.product.dose}</TableCell>
                          <TableCell className="text-gray-500 whitespace-nowrap">{formatDate(r.issue_date)}</TableCell>
                          <TableCell className="text-gray-500 whitespace-nowrap">{formatDate(r.expiration_date)}</TableCell>
                          <TableCell>
                            <span style={{ ...badgeStyle, padding: "4px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                              {r.days_remaining} {r.days_remaining === 1 ? "día" : "días"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
