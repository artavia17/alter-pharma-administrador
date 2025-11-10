import { useState, useEffect, useMemo } from "react";
import PageMeta from "../../../../components/common/PageMeta";
import { getPurchaseReport, getPharmacySalesReport, getProductSalesReport } from "../../../../services/protected/reports.services";
import { getPharmacies } from "../../../../services/protected/pharmacies.services";
import {
  PurchaseReportData,
  PharmacySalesData,
  ProductSalesData,
  PurchaseTransaction
} from "../../../../types/services/protected/reports.types";
import { PharmacyData } from "../../../../types/services/protected/pharmacies.types";
import { formatDate } from "../../../../helper/formatData";
import Label from "../../../../components/form/Label";
import Input from "../../../../components/form/input/InputField";
import Button from "../../../../components/ui/button/Button";
import Select from "../../../../components/form/Select";
import { Modal } from "../../../../components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";

export default function Home() {
  // Filter states
  const [pharmacies, setPharmacies] = useState<PharmacyData[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [entryType, setEntryType] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reports data states
  const [purchaseReport, setPurchaseReport] = useState<PurchaseReportData | null>(null);
  const [pharmacySalesReport, setPharmacySalesReport] = useState<PharmacySalesData[]>([]);
  const [productSalesReport, setProductSalesReport] = useState<ProductSalesData[]>([]);

  // Loading states
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [loadingPharmacy, setLoadingPharmacy] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  // Modal states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PurchaseTransaction | null>(null);

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

  // Entry type options
  const entryTypeOptions = [
    { value: "", label: "Todos" },
    { value: "manual", label: "Manual" },
    { value: "automatic", label: "Automático" }
  ];

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
    loadPurchaseReport();
    loadPharmacySalesReport();
    loadProductSalesReport();
  };

  const loadPurchaseReport = async () => {
    setLoadingPurchase(true);
    try {
      const params: any = { page: currentPage };
      if (selectedPharmacyId) params.pharmacy_id = selectedPharmacyId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (entryType) params.entry_type = entryType;

      const response = await getPurchaseReport(params);
      if (response.status === 200) {
        setPurchaseReport(response.data);
      }
    } catch (error) {
      console.error("Error cargando reporte de compras:", error);
    } finally {
      setLoadingPurchase(false);
    }
  };

  const loadPharmacySalesReport = async () => {
    setLoadingPharmacy(true);
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await getPharmacySalesReport(params);
      if (response.status === 200) {
        setPharmacySalesReport(response.data);
      }
    } catch (error) {
      console.error("Error cargando reporte de farmacias:", error);
    } finally {
      setLoadingPharmacy(false);
    }
  };

  const loadProductSalesReport = async () => {
    setLoadingProduct(true);
    try {
      const params: any = {};
      if (selectedPharmacyId) params.pharmacy_id = selectedPharmacyId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await getProductSalesReport(params);
      if (response.status === 200) {
        setProductSalesReport(response.data);
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
    setEntryType("");
    setCurrentPage(1);
    setTimeout(() => {
      loadAllReports();
    }, 100);
  };

  const handleViewDetails = (transaction: PurchaseTransaction) => {
    setSelectedTransaction(transaction);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedTransaction(null);
  };

  const handlePreviousPage = () => {
    if (purchaseReport && currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setTimeout(() => loadPurchaseReport(), 100);
    }
  };

  const handleNextPage = () => {
    if (purchaseReport && currentPage < purchaseReport.transactions.last_page) {
      setCurrentPage(currentPage + 1);
      setTimeout(() => loadPurchaseReport(), 100);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${num.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      <PageMeta
        title="Reportes | Administrador"
        description="Reportes y estadísticas del sistema"
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes de Compras</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visualiza estadísticas y reportes de transacciones, farmacias y productos
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Filtros</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
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

            <div>
              <Label>Tipo de entrada</Label>
              <Select
                options={entryTypeOptions}
                placeholder="Todos"
                onChange={(value) => setEntryType(value)}
                defaultValue=""
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

        {/* Summary Cards - Purchase Report */}
        {purchaseReport && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Transacciones</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {purchaseReport.summary.total_transactions}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monto Total</p>
              <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(purchaseReport.summary.total_amount)}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Promedio</p>
              <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(purchaseReport.summary.average_transaction)}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Entradas Manuales</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {purchaseReport.summary.manual_entries}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Entradas Automáticas</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {purchaseReport.summary.automatic_entries}
              </p>
            </div>
          </div>
        )}

        {/* Purchase Report Table */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reporte de Compras</h2>
          </div>

          {loadingPurchase ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
            </div>
          ) : purchaseReport && purchaseReport.transactions.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Paciente</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Farmacia</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Factura</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tipo</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-right text-theme-xs dark:text-gray-400">Total</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {purchaseReport.transactions.data.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{transaction.id}</TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {transaction.patient.first_name} {transaction.patient.last_name}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {transaction.patient.identification_number}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-800 text-theme-sm dark:text-white/90">{transaction.pharmacy.commercial_name}</TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(transaction.transaction_date)}</TableCell>
                        <TableCell className="px-5 py-4 font-mono text-sm text-gray-500 dark:text-gray-400">{transaction.invoice_number}</TableCell>
                        <TableCell className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              transaction.entry_type === 'automatic'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}
                          >
                            {transaction.entry_type === 'automatic' ? 'Automático' : 'Manual'}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-right font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(transaction.total)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(transaction)}
                          >
                            Ver detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Mostrando {purchaseReport.transactions.from} a {purchaseReport.transactions.to} de{' '}
                  {purchaseReport.transactions.total} resultados
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
                    Página {currentPage} de {purchaseReport.transactions.last_page}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={currentPage === purchaseReport.transactions.last_page}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No hay transacciones para mostrar</p>
            </div>
          )}
        </div>

        {/* Pharmacy Sales Report */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ventas por Farmacia</h2>
          </div>

          {loadingPharmacy ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
            </div>
          ) : pharmacySalesReport.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Farmacia</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">RNC</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Transacciones</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-right text-theme-xs dark:text-gray-400">Total Ventas</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-right text-theme-xs dark:text-gray-400">Promedio</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Pacientes Únicos</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {pharmacySalesReport.map((pharmacy) => (
                    <TableRow key={pharmacy.id}>
                      <TableCell className="px-5 py-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">{pharmacy.commercial_name}</TableCell>
                      <TableCell className="px-5 py-4 font-mono text-sm text-gray-500 dark:text-gray-400">{pharmacy.identification_number}</TableCell>
                      <TableCell className="px-5 py-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">{pharmacy.total_transactions}</TableCell>
                      <TableCell className="px-5 py-4 text-right font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(pharmacy.total_sales)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right text-gray-500 text-theme-sm dark:text-gray-400">{formatCurrency(pharmacy.average_transaction)}</TableCell>
                      <TableCell className="px-5 py-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">{pharmacy.unique_patients}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No hay datos de farmacias para mostrar</p>
            </div>
          )}
        </div>

        {/* Product Sales Report */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ventas por Producto</h2>
          </div>

          {loadingProduct ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
            </div>
          ) : productSalesReport.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Producto</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Dosis</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Cantidad Vendida</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-right text-theme-xs dark:text-gray-400">Ingresos Totales</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Farmacias</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Pacientes</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {productSalesReport.map((product, index) => (
                    <TableRow key={`${product.id}-${product.dose}-${index}`}>
                      <TableCell className="px-5 py-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">{product.name}</TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{product.dose}</TableCell>
                      <TableCell className="px-5 py-4 text-center font-semibold text-gray-800 text-theme-sm dark:text-white/90">{product.total_quantity}</TableCell>
                      <TableCell className="px-5 py-4 text-right font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(product.total_revenue)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">{product.pharmacies_count}</TableCell>
                      <TableCell className="px-5 py-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">{product.patients_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No hay datos de productos para mostrar</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={handleCloseDetail} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Detalles de Transacción
            </h3>
            <button
              onClick={handleCloseDetail}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {selectedTransaction && (
            <div className="space-y-6">
              {/* Transaction Info */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Información de la Transacción
                </h4>
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID Transacción</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                      #{selectedTransaction.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Factura</p>
                    <p className="mt-1 font-mono text-sm font-medium text-gray-900 dark:text-white">
                      {selectedTransaction.invoice_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fecha</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedTransaction.transaction_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tipo</p>
                    <p className="mt-1">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          selectedTransaction.entry_type === 'automatic'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}
                      >
                        {selectedTransaction.entry_type === 'automatic' ? 'Automático' : 'Manual'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Patient Info */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Información del Paciente
                </h4>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedTransaction.patient.first_name} {selectedTransaction.patient.last_name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Cédula: {selectedTransaction.patient.identification_number}
                  </p>
                </div>
              </div>

              {/* Pharmacy Info */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Información de Farmacia
                </h4>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedTransaction.pharmacy.commercial_name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    RNC: {selectedTransaction.pharmacy.identification_number}
                  </p>
                </div>
              </div>

              {/* Products */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Productos ({selectedTransaction.products.length})
                </h4>
                <div className="space-y-3">
                  {selectedTransaction.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {product.product.name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Dosis: {product.product_dose.dose}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Cantidad: {product.quantity} × {formatCurrency(product.unit_price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(product.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">Total</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(selectedTransaction.total)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleCloseDetail}>Cerrar</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
