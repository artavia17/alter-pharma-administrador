import { useState, useEffect, useMemo } from "react";
import PageMeta from "../../../../components/common/PageMeta";
import { getPatientProductRedemptionReport } from "../../../../services/protected/redemptions.services";
import { getPharmacies } from "../../../../services/protected/pharmacies.services";
import { PatientProductRedemptionPagination } from "../../../../types/services/protected/redemptions.types";
import { PharmacyData } from "../../../../types/services/protected/pharmacies.types";
import { formatDate } from "../../../../helper/formatData";
import Label from "../../../../components/form/Label";
import Input from "../../../../components/form/input/InputField";
import Button from "../../../../components/ui/button/Button";
import Select from "../../../../components/form/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";

export default function PatientProductRedemptions() {
  // Filter states
  const [pharmacies, setPharmacies] = useState<PharmacyData[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Report data state
  const [report, setReport] = useState<PatientProductRedemptionPagination | null>(null);

  // Loading state
  const [loading, setLoading] = useState(false);

  // Pharmacy options for select
  const pharmacyOptions = useMemo(() => {
    return [
      { value: "", label: "Todas las farmacias" },
      ...pharmacies.map(pharmacy => ({
        value: pharmacy.id.toString(),
        label: pharmacy.commercial_name
      }))
    ];
  }, [pharmacies]);

  // Load pharmacies on mount
  useEffect(() => {
    loadPharmacies();
    loadReport();
  }, []);

  const loadPharmacies = async () => {
    try {
      const response = await getPharmacies();
      if (response.status === 200 && Array.isArray(response.data)) {
        setPharmacies(response.data);
      }
    } catch (error) {
      console.error("Error cargando farmacias:", error);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params: any = { page: currentPage };
      if (selectedPharmacyId) params.pharmacy_id = selectedPharmacyId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (searchTerm) params.search = searchTerm;

      const response = await getPatientProductRedemptionReport(params);
      if (response.status === 200) {
        setReport(response.data);
      }
    } catch (error) {
      console.error("Error cargando reporte:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadReport();
  };

  const handleClearFilters = () => {
    setSelectedPharmacyId(null);
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
    setCurrentPage(1);
    setTimeout(() => {
      loadReport();
    }, 100);
  };

  const handlePreviousPage = () => {
    if (report && currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setTimeout(() => loadReport(), 100);
    }
  };

  const handleNextPage = () => {
    if (report && currentPage < report.last_page) {
      setCurrentPage(currentPage + 1);
      setTimeout(() => loadReport(), 100);
    }
  };

  return (
    <>
      <PageMeta
        title="Productos Canjeados por Pacientes | Administrador"
        description="Reporte de productos canjeados por cada paciente"
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Productos Canjeados por Pacientes</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visualiza qué productos ha canjeado cada paciente, agrupado por paciente y producto
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Filtros</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label>Buscar paciente</Label>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre, cédula o email"
              />
            </div>

            <div>
              <Label>Farmacia</Label>
              <Select
                options={pharmacyOptions}
                placeholder="Todas las farmacias"
                onChange={(value) => setSelectedPharmacyId(value ? parseInt(value) : null)}
                defaultValue=""
              />
            </div>

            <div>
              <Label>Fecha inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Fecha final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleApplyFilters} className="flex-1">
                Aplicar
              </Button>
              <Button onClick={handleClearFilters} variant="outline">
                Limpiar
              </Button>
            </div>
          </div>
        </div>

        {/* Report Table */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reporte de canjes</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
            </div>
          ) : report && report.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Paciente</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Producto</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Total Canjes</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Cant. Canjeada</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Cant. Recibida</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Último Canje</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Farmacias</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {report.data.map((item, index) => (
                      <TableRow key={`${item.patient_id}-${item.product_id}-${index}`}>
                        <TableCell className="px-5 py-4 text-start">
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {item.patient_name}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {item.patient_identification}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {item.patient_email}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {item.product_name}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {item.product_dose}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center font-semibold text-blue-600 dark:text-blue-400">
                          {item.total_redemptions}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">
                          {item.total_quantity_redeemed}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center font-semibold text-green-600 dark:text-green-400">
                          {item.total_quantity_received}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {formatDate(item.last_redemption_date)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">
                          {item.pharmacies_count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Mostrando {report.from} a {report.to} de{' '}
                  {report.total} resultados
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-3 text-sm text-gray-700 dark:text-gray-300">
                    Página {currentPage} de {report.last_page}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={currentPage === report.last_page}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No hay datos para mostrar</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
