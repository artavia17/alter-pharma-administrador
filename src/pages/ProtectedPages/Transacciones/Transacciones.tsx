import { useState, useEffect, useMemo } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Select from "../../../components/form/Select";
import Alert from "../../../components/ui/alert/Alert";
import { useModal } from "../../../hooks/useModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { getTransactions } from "../../../services/protected/transactions.services";
import { getPharmacies } from "../../../services/protected/pharmacies.services";
import { TransactionData, TransactionsPagination } from "../../../types/services/protected/transactions.types";
import { PharmacyData } from "../../../types/services/protected/pharmacies.types";
import { formatDate } from "../../../helper/formatData";

export default function TransaccionesPage() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [pagination, setPagination] = useState<TransactionsPagination | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionData | null>(null);

  // Filtros
  const [filterName, setFilterName] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterIdentification, setFilterIdentification] = useState("");
  const [filterPharmacyId, setFilterPharmacyId] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterEntryType, setFilterEntryType] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modals
  const { isOpen: isDetailOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();

  useEffect(() => {
    loadPharmacies();
    loadTransactions();
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

  const loadTransactions = async (page: number = 1) => {
    setIsLoading(true);
    setErrors({});

    try {
      const params: any = {
        page,
        per_page: perPage,
      };

      if (filterName) params.name = filterName;
      if (filterEmail) params.email = filterEmail;
      if (filterIdentification) params.identification_number = filterIdentification;
      if (filterPharmacyId) params.pharmacy_id = parseInt(filterPharmacyId);
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;
      if (filterEntryType) params.entry_type = filterEntryType;

      const response = await getTransactions(params);
      if (response.status === 200 && response.data) {
        setPagination(response.data);
        setTransactions(response.data.data);
        setCurrentPage(response.data.current_page);
      }
    } catch (error: any) {
      console.error("Error cargando transacciones:", error);
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al cargar las transacciones" });
      }
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadTransactions(1);
  };

  const resetFilters = () => {
    setFilterName("");
    setFilterEmail("");
    setFilterIdentification("");
    setFilterPharmacyId("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterEntryType("");
    setCurrentPage(1);
    loadTransactions(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadTransactions(page);
  };

  const openDetail = (transaction: TransactionData) => {
    setSelectedTransaction(transaction);
    openDetailModal();
  };

  const handleCloseDetail = () => {
    setSelectedTransaction(null);
    closeDetailModal();
  };

  // Opciones para select de farmacias
  const pharmacyOptions = useMemo(() => {
    return [
      { value: "", label: "Todas las farmacias" },
      ...pharmacies
        .filter(pharmacy => pharmacy.status)
        .map(pharmacy => ({
          value: pharmacy.id.toString(),
          label: pharmacy.commercial_name
        }))
    ];
  }, [pharmacies]);

  // Opciones para tipo de entrada
  const entryTypeOptions = [
    { value: "", label: "Todos los tipos" },
    { value: "automatic", label: "Automático" },
    { value: "manual", label: "Manual" },
  ];

  // Opciones para items por página
  const perPageOptions = [
    { value: "10", label: "10 por página" },
    { value: "20", label: "20 por página" },
    { value: "50", label: "50 por página" },
    { value: "100", label: "100 por página" },
  ];

  const hasActiveFilters = filterName || filterEmail || filterIdentification || filterPharmacyId || filterDateFrom || filterDateTo || filterEntryType;

  return (
    <>
      <PageMeta title="Transacciones" />
      <div className="flex flex-col gap-6">
        <PageBreadcrumb
          pageTitle="Transacciones"
          items={[
            { name: "Dashboard", path: "/" },
            { name: "Transacciones", path: "/transacciones" },
          ]}
        />

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Transacciones</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Listado de todas las transacciones del sistema
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          {Object.keys(errors).length > 0 && (
            <div className="mb-4">
              <Alert
                variant="error"
                title="Error"
                message={errors.general || "Ocurrió un error al cargar las transacciones"}
              />
            </div>
          )}
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Nombre del paciente</Label>
                <Input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="Ej: Carlos"
                />
              </div>
              <div>
                <Label>Email del paciente</Label>
                <Input
                  type="email"
                  value={filterEmail}
                  onChange={(e) => setFilterEmail(e.target.value)}
                  placeholder="Ej: paciente@example.com"
                />
              </div>
              <div>
                <Label>Identificación del paciente</Label>
                <Input
                  type="text"
                  value={filterIdentification}
                  onChange={(e) => setFilterIdentification(e.target.value)}
                  placeholder="Ej: 001-123456"
                />
              </div>
              <div>
                <Label>Farmacia</Label>
                <Select
                  options={pharmacyOptions}
                  value={filterPharmacyId}
                  onChange={(value) => setFilterPharmacyId(value)}
                />
              </div>
              <div>
                <Label>Fecha desde</Label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label>Fecha hasta</Label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
              <div>
                <Label>Tipo de entrada</Label>
                <Select
                  options={entryTypeOptions}
                  value={filterEntryType}
                  onChange={(value) => setFilterEntryType(value)}
                />
              </div>
              <div>
                <Label>Items por página</Label>
                <Select
                  options={perPageOptions}
                  value={perPage.toString()}
                  onChange={(value) => {
                    setPerPage(parseInt(value));
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Buscando...' : 'Buscar'}
              </Button>
              <Button type="button" variant="outline" onClick={resetFilters}>
                Limpiar filtros
              </Button>
              {hasActiveFilters && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {transactions.length} resultado{transactions.length !== 1 ? 's' : ''} encontrado{transactions.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Tabla de transacciones */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Paciente</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Farmacia</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Producto/Dosis</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tipo</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{transaction.id}</TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {transaction.patient?.first_name} {transaction.patient?.last_name}
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {transaction.patient?.identification_number}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="block text-sm text-gray-800 dark:text-white/90">
                        {transaction.pharmacy?.commercial_name}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {transaction.product_dose?.product.name}
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {transaction.product_dose?.dose}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        transaction.entry_type === 'automatic'
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                      }`}>
                        {transaction.entry_type === 'automatic' ? 'Automático' : 'Manual'}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {formatDate(transaction.redemption_date)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <button onClick={() => openDetail(transaction)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg dark:text-purple-400 dark:hover:bg-purple-900/20" title="Ver detalles">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {transactions.length === 0 && !isLoading && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">No hay transacciones</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {hasActiveFilters ? "No se encontraron resultados con los filtros aplicados." : "No hay transacciones registradas."}
                </p>
              </div>
            )}

            {isLoading && (
              <div className="px-5 py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
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
                  Mostrando {pagination.from} a {pagination.to} de {pagination.total} transacciones
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Página {currentPage} de {pagination.last_page}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.last_page || isLoading}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Ver Detalles de Transacción */}
      <Modal isOpen={isDetailOpen} onClose={handleCloseDetail} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Transacción #{selectedTransaction?.id}
            </h4>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                selectedTransaction?.entry_type === 'automatic'
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
              }`}>
                {selectedTransaction?.entry_type === 'automatic' ? 'Automático' : 'Manual'}
              </span>
            </div>
          </div>
          <div className="px-2 pb-4 space-y-4">
            <div>
              <Label>Información del paciente</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Nombre:</span> {selectedTransaction?.patient?.first_name} {selectedTransaction?.patient?.last_name}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Identificación:</span> {selectedTransaction?.patient?.identification_number}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Email:</span> {selectedTransaction?.patient?.email}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Teléfono:</span> {selectedTransaction?.patient?.phone}
                </p>
              </div>
            </div>

            <div>
              <Label>Información de la farmacia</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Nombre comercial:</span> {selectedTransaction?.pharmacy?.commercial_name}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Razón social:</span> {selectedTransaction?.pharmacy?.legal_name}
                </p>
              </div>
            </div>

            <div>
              <Label>Producto y dosis</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Producto:</span> {selectedTransaction?.product_dose?.product.name}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Dosis:</span> {selectedTransaction?.product_dose?.dose}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Promoción:</span> Compra {selectedTransaction?.product_dose?.promotion_buy} Lleva {selectedTransaction?.product_dose?.promotion_get}
                </p>
              </div>
            </div>

            <div>
              <Label>Fechas</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Fecha de canje:</span> {selectedTransaction && formatDate(selectedTransaction.redemption_date)}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Fecha de creación:</span> {selectedTransaction && formatDate(selectedTransaction.created_at)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" onClick={handleCloseDetail}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
