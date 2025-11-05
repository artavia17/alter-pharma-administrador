import { useState, useEffect, useMemo } from "react";
import PageMeta from "../../../../components/common/PageMeta";
import { getPharmacyRedemptionReport, getRedemptionDetailsReport, getProductRedemptionReport } from "../../../../services/protected/redemptions.services";
import { getPharmacies } from "../../../../services/protected/pharmacies.services";
import {
  PharmacyRedemptionData,
  RedemptionDetailPagination,
  ProductRedemptionData,
} from "../../../../types/services/protected/redemptions.types";
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

export default function Redemptions() {
  // Filter states
  const [pharmacies, setPharmacies] = useState<PharmacyData[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reports data states
  const [pharmacyReport, setPharmacyReport] = useState<PharmacyRedemptionData[]>([]);
  const [detailsReport, setDetailsReport] = useState<RedemptionDetailPagination | null>(null);
  const [productReport, setProductReport] = useState<ProductRedemptionData[]>([]);

  // Loading states
  const [loadingPharmacy, setLoadingPharmacy] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

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
    loadAllReports();
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

  const loadAllReports = () => {
    loadPharmacyReport();
    loadDetailsReport();
    loadProductReport();
  };

  const loadPharmacyReport = async () => {
    setLoadingPharmacy(true);
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await getPharmacyRedemptionReport(params);
      if (response.status === 200) {
        setPharmacyReport(response.data);
      }
    } catch (error) {
      console.error("Error cargando reporte de farmacias:", error);
    } finally {
      setLoadingPharmacy(false);
    }
  };

  const loadDetailsReport = async () => {
    setLoadingDetails(true);
    try {
      const params: any = { page: currentPage };
      if (selectedPharmacyId) params.pharmacy_id = selectedPharmacyId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await getRedemptionDetailsReport(params);
      if (response.status === 200) {
        setDetailsReport(response.data);
      }
    } catch (error) {
      console.error("Error cargando detalles de canjes:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadProductReport = async () => {
    setLoadingProduct(true);
    try {
      const params: any = {};
      if (selectedPharmacyId) params.pharmacy_id = selectedPharmacyId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await getProductRedemptionReport(params);
      if (response.status === 200) {
        setProductReport(response.data);
      }
    } catch (error) {
      console.error("Error cargando reporte de productos:", error);
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadAllReports();
  };

  const handleClearFilters = () => {
    setSelectedPharmacyId(null);
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    setTimeout(() => {
      loadAllReports();
    }, 100);
  };

  const handlePreviousPage = () => {
    if (detailsReport && currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setTimeout(() => loadDetailsReport(), 100);
    }
  };

  const handleNextPage = () => {
    if (detailsReport && currentPage < detailsReport.last_page) {
      setCurrentPage(currentPage + 1);
      setTimeout(() => loadDetailsReport(), 100);
    }
  };

  return (
    <>
      <PageMeta
        title="Reportes de Canjes | Administrador"
        description="Reportes y estadísticas de canjes del sistema"
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes de Canjes</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visualiza estadísticas de canjes por farmacia, producto y detalles completos
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Filtros</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <Button onClick={handleClearFilters} variant="secondary">
                Limpiar
              </Button>
            </div>
          </div>
        </div>

        {/* Pharmacy Redemption Report */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Canjes por Farmacia</h2>
          </div>

          {loadingPharmacy ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
            </div>
          ) : pharmacyReport.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Farmacia</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">RNC</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Total Canjes</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Cant. Canjeada</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Cant. Recibida</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Pacientes</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Productos</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {pharmacyReport.map((pharmacy) => (
                    <TableRow key={pharmacy.id}>
                      <TableCell className="px-5 py-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">{pharmacy.commercial_name}</TableCell>
                      <TableCell className="px-5 py-4 font-mono text-sm text-gray-500 dark:text-gray-400">{pharmacy.identification_number}</TableCell>
                      <TableCell className="px-5 py-4 text-center font-semibold text-blue-600 dark:text-blue-400">{pharmacy.total_redemptions}</TableCell>
                      <TableCell className="px-5 py-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">{pharmacy.total_quantity_redeemed}</TableCell>
                      <TableCell className="px-5 py-4 text-center font-semibold text-green-600 dark:text-green-400">{pharmacy.total_quantity_received}</TableCell>
                      <TableCell className="px-5 py-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">{pharmacy.unique_patients}</TableCell>
                      <TableCell className="px-5 py-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">{pharmacy.unique_products}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No hay datos de canjes por farmacia</p>
            </div>
          )}
        </div>

        {/* Redemption Details Report */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detalle de Canjes</h2>
          </div>

          {loadingDetails ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
            </div>
          ) : detailsReport && detailsReport.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Farmacia</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Paciente</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Producto</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Canjeada</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Recibida</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Notas</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {detailsReport.data.map((redemption) => (
                      <TableRow key={redemption.id}>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{redemption.id}</TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(redemption.redemption_date)}</TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {redemption.pharmacy_name}
                          </span>
                          {redemption.sub_pharmacy_name && (
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                              {redemption.sub_pharmacy_name}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {redemption.patient_name}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {redemption.patient_identification}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {redemption.product_name}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {redemption.product_dose}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center font-semibold text-blue-600 dark:text-blue-400">
                          {redemption.quantity_redeemed}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center font-semibold text-green-600 dark:text-green-400">
                          {redemption.quantity_received}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {redemption.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Mostrando {detailsReport.from} a {detailsReport.to} de{' '}
                  {detailsReport.total} resultados
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-3 text-sm text-gray-700 dark:text-gray-300">
                    Página {currentPage} de {detailsReport.last_page}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleNextPage}
                    disabled={currentPage === detailsReport.last_page}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No hay detalles de canjes para mostrar</p>
            </div>
          )}
        </div>

        {/* Product Redemption Report */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Canjes por Producto</h2>
          </div>

          {loadingProduct ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
            </div>
          ) : productReport.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Producto</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Dosis</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Total Canjes</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Cant. Canjeada</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Cant. Recibida</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Farmacias</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Pacientes</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {productReport.map((product, index) => (
                    <TableRow key={`${product.id}-${product.dose}-${index}`}>
                      <TableCell className="px-5 py-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">{product.name}</TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{product.dose}</TableCell>
                      <TableCell className="px-5 py-4 text-center font-semibold text-blue-600 dark:text-blue-400">{product.total_redemptions}</TableCell>
                      <TableCell className="px-5 py-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">{product.total_quantity_redeemed}</TableCell>
                      <TableCell className="px-5 py-4 text-center font-semibold text-green-600 dark:text-green-400">{product.total_quantity_received}</TableCell>
                      <TableCell className="px-5 py-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">{product.pharmacies_count}</TableCell>
                      <TableCell className="px-5 py-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">{product.patients_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No hay datos de canjes por producto</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
