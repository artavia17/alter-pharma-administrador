import { useEffect, useState, useMemo } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import Alert from "../../../components/ui/alert/Alert";
import Badge from "../../../components/ui/badge/Badge";
import Label from "../../../components/form/Label";
import { useModal } from "../../../hooks/useModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  getInvoiceGaps,
  getInvoiceGapStatistics,
  getInvoiceGapById,
  resolveInvoiceGap,
} from "../../../services/protected/invoice-gaps.services";
import { getPharmacies } from "../../../services/protected/pharmacies.services";
import { InvoiceGapData, InvoiceGapStatistics } from "../../../types/services/protected/invoice-gaps.types";
import { PharmacyData } from "../../../types/services/protected/pharmacies.types";
import { formatDate } from "../../../helper/formatData";

export default function SaltosFacturacionPage() {
  const [gaps, setGaps] = useState<InvoiceGapData[]>([]);
  const [pharmacies, setPharmacies] = useState<PharmacyData[]>([]);
  const [statistics, setStatistics] = useState<InvoiceGapStatistics | null>(null);
  const [selectedGap, setSelectedGap] = useState<InvoiceGapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [pharmacyFilter, setPharmacyFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Resolve form
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Modals
  const { isOpen: isDetailOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();
  const { isOpen: isResolveOpen, openModal: openResolveModal, closeModal: closeResolveModal } = useModal();

  useEffect(() => {
    loadGaps();
    loadPharmacies();
    loadStatistics();
  }, []);

  useEffect(() => {
    loadGaps();
  }, [pharmacyFilter, statusFilter, fromDate, toDate]);

  const loadGaps = async () => {
    try {
      const params: any = {};

      if (pharmacyFilter) params.pharmacy_id = parseInt(pharmacyFilter);
      if (statusFilter !== "") params.is_resolved = statusFilter === "true";
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const response = await getInvoiceGaps(params);
      if (response.status === 200 && Array.isArray(response.data)) {
        setGaps(response.data);
      }
    } catch (error) {
      console.error("Error cargando saltos de facturación:", error);
    }
  };

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

  const loadStatistics = async () => {
    try {
      const response = await getInvoiceGapStatistics();
      if (response.status === 200) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  const handleViewDetails = async (gap: InvoiceGapData) => {
    try {
      const response = await getInvoiceGapById(gap.id);
      if (response.status === 200) {
        setSelectedGap(response.data);
        openDetailModal();
      }
    } catch (error) {
      console.error("Error cargando detalles:", error);
    }
  };

  const handleOpenResolve = (gap: InvoiceGapData) => {
    setSelectedGap(gap);
    setResolutionNotes("");
    setSuccessMessage("");
    setErrorMessage("");
    openResolveModal();
  };

  const handleResolveGap = async () => {
    if (!selectedGap) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await resolveInvoiceGap(selectedGap.id, {
        resolution_notes: resolutionNotes || undefined,
      });

      if (response.status === 200) {
        setSuccessMessage("Salto marcado como resuelto exitosamente");
        loadGaps();
        loadStatistics();
        setTimeout(() => {
          closeResolveModal();
          setSuccessMessage("");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error resolviendo salto:", error);
      setErrorMessage(error?.response?.data?.message || "Error al resolver el salto");
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar gaps
  const filteredGaps = useMemo(() => {
    let filtered = gaps;

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(gap =>
        gap.pharmacy.commercial_name.toLowerCase().includes(query) ||
        gap.pharmacy.legal_name.toLowerCase().includes(query) ||
        gap.received_pattern.toLowerCase().includes(query) ||
        gap.expected_pattern.toLowerCase().includes(query) ||
        gap.transaction.invoice_number.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [gaps, searchQuery]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredGaps.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGaps = filteredGaps.slice(startIndex, endIndex);

  // Resetear a la página 1 cuando cambia la búsqueda o filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pharmacyFilter, statusFilter, fromDate, toDate]);

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Opciones para select de filtros
  const pharmacyFilterOptions = useMemo(() => {
    return pharmacies
      .filter(pharmacy => pharmacy.status)
      .map(pharmacy => ({
        value: pharmacy.id.toString(),
        label: pharmacy.commercial_name
      }));
  }, [pharmacies]);

  const statusFilterOptions = [
    { value: "", label: "Todos los estados" },
    { value: "false", label: "No resueltos" },
    { value: "true", label: "Resueltos" },
  ];

  const getStatusBadge = (isResolved: boolean) => {
    return isResolved ? (
      <Badge color="success">Resuelto</Badge>
    ) : (
      <Badge color="warning">Pendiente</Badge>
    );
  };

  return (
    <>
      <PageMeta
        title="Control de Ingresos | Alter Pharma"
        description="Gestión de saltos en consecutivos de facturación"
      />
      <PageBreadcrumb pageTitle="Control de Ingresos" />

      {/* Estadísticas */}
      {statistics && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total de Saltos</p>
                <p className="text-2xl font-semibold text-gray-800 dark:text-white mt-1">
                  {statistics.total_gaps}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">No Resueltos</p>
                <p className="text-2xl font-semibold text-gray-800 dark:text-white mt-1">
                  {statistics.unresolved_gaps}
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/20">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Resueltos</p>
                <p className="text-2xl font-semibold text-gray-800 dark:text-white mt-1">
                  {statistics.resolved_gaps}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Este Mes</p>
                <p className="text-2xl font-semibold text-gray-800 dark:text-white mt-1">
                  {statistics.gaps_this_month}
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Filtros y búsqueda */}
        <div className="flex flex-col gap-4 p-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Buscador */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar saltos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 rounded-lg border border-gray-300 bg-transparent py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 fill-gray-500 dark:fill-gray-400"
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.04175 9.37508C3.04175 5.87617 5.87617 3.04175 9.37508 3.04175C12.874 3.04175 15.7084 5.87617 15.7084 9.37508C15.7084 12.874 12.874 15.7084 9.37508 15.7084C5.87617 15.7084 3.04175 12.874 3.04175 9.37508ZM9.37508 1.54175C5.04774 1.54175 1.54175 5.04774 1.54175 9.37508C1.54175 13.7024 5.04774 17.2084 9.37508 17.2084C11.2674 17.2084 13.003 16.5469 14.3638 15.4436L17.6364 18.7162C17.9293 19.0091 18.4042 19.0091 18.6971 18.7162C18.99 18.4233 18.99 17.9484 18.6971 17.6555L15.4436 14.3638C16.5469 13.003 17.2084 11.2674 17.2084 9.37508C17.2084 5.04774 13.7024 1.54175 9.37508 1.54175Z"
                />
              </svg>
            </div>
          </div>

          {/* Filtros adicionales */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Filtro por farmacia */}
            <div>
              <Select
                options={pharmacyFilterOptions}
                value={pharmacyFilter}
                onChange={(value) => setPharmacyFilter(value)}
                placeholder="Filtrar por farmacia"
              />
            </div>

            {/* Filtro por estado */}
            <div>
              <Select
                options={statusFilterOptions}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                placeholder="Filtrar por estado"
              />
            </div>

            {/* Fecha desde */}
            <div>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Desde"
              />
            </div>

            {/* Fecha hasta */}
            <div>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Hasta"
              />
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Farmacia
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Patrón Recibido
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Patrón Esperado
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Similitud
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Fecha Detección
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Estado
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGaps.length > 0 ? (
                paginatedGaps.map((gap) => (
                  <TableRow key={gap.id}>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {gap.pharmacy.commercial_name}
                      </span>
                      {gap.sub_pharmacy && (
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {gap.sub_pharmacy.commercial_name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="font-medium text-gray-800 text-theme-sm dark:text-white">
                        {gap.received_pattern}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                        {gap.expected_pattern}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className={`font-medium text-theme-sm ${
                        parseFloat(gap.similarity_score) < 30
                          ? 'text-red-600 dark:text-red-400'
                          : parseFloat(gap.similarity_score) < 60
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {parseFloat(gap.similarity_score).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                        {formatDate(gap.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      {getStatusBadge(gap.is_resolved)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="flex items-center gap-2">
                        {/* Ver detalles */}
                        <button
                          onClick={() => handleViewDetails(gap)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                          title="Ver detalles"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        {/* Resolver - solo si no está resuelto */}
                        {!gap.is_resolved && (
                          <button
                            onClick={() => handleOpenResolve(gap)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-green-600 dark:hover:bg-gray-800 dark:hover:text-green-400"
                            title="Marcar como resuelto"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron anomalías de facturación
                  </td>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando <span className="font-medium">{startIndex + 1}</span> a{" "}
                  <span className="font-medium">{Math.min(endIndex, filteredGaps.length)}</span> de{" "}
                  <span className="font-medium">{filteredGaps.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-gray-800"
                  >
                    <span className="sr-only">Anterior</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 dark:text-gray-300 dark:ring-gray-700">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page as number)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          currentPage === page
                            ? 'z-10 bg-brand-600 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-800'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-gray-800"
                  >
                    <span className="sr-only">Siguiente</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      <Modal isOpen={isDetailOpen} onClose={closeDetailModal} className="max-w-2xl m-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
            Detalles del Control de Ingreso
          </h2>

          {selectedGap && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Farmacia
                  </label>
                  <p className="text-gray-800 dark:text-white">{selectedGap.pharmacy.commercial_name}</p>
                </div>
                {selectedGap.sub_pharmacy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Sucursal
                    </label>
                    <p className="text-gray-800 dark:text-white">{selectedGap.sub_pharmacy.commercial_name}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Patrón Recibido
                  </label>
                  <p className="text-gray-800 dark:text-white font-medium">{selectedGap.received_pattern}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Patrón Esperado
                  </label>
                  <p className="text-gray-800 dark:text-white">{selectedGap.expected_pattern}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Similitud
                  </label>
                  <p className={`font-semibold ${
                    parseFloat(selectedGap.similarity_score) < 30
                      ? 'text-red-600 dark:text-red-400'
                      : parseFloat(selectedGap.similarity_score) < 60
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {parseFloat(selectedGap.similarity_score).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Tipo
                  </label>
                  <p className="text-gray-800 dark:text-white font-medium">{selectedGap.missing_range}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Razón de la Anomalía
                  </label>
                  <p className="text-gray-800 dark:text-white">{selectedGap.anomaly_details.reason}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Facturas Recientes de Ejemplo
                  </label>
                  <div className="space-y-1">
                    {selectedGap.anomaly_details.recent_invoices_sample.map((invoice, idx) => (
                      <p key={idx} className="text-sm text-gray-600 dark:text-gray-300">• {invoice}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Similitud del Patrón
                  </label>
                  <p className="text-gray-800 dark:text-white">{selectedGap.anomaly_details.pattern_similarity.toFixed(2)}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Fecha de Detección
                  </label>
                  <p className="text-gray-800 dark:text-white">{formatDate(selectedGap.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Estado
                  </label>
                  {getStatusBadge(selectedGap.is_resolved)}
                </div>
                {selectedGap.is_resolved && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Resuelto por
                      </label>
                      <p className="text-gray-800 dark:text-white">
                        {selectedGap.resolved_by_user?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Fecha de Resolución
                      </label>
                      <p className="text-gray-800 dark:text-white">
                        {selectedGap.resolved_at ? formatDate(selectedGap.resolved_at) : "-"}
                      </p>
                    </div>
                    {selectedGap.resolution_notes && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Notas de Resolución
                        </label>
                        <p className="text-gray-800 dark:text-white">{selectedGap.resolution_notes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={closeDetailModal}>
                  Cerrar
                </Button>
                {!selectedGap.is_resolved && (
                  <Button onClick={() => {
                    closeDetailModal();
                    handleOpenResolve(selectedGap);
                  }}>
                    Marcar como Resuelto
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de resolver */}
      <Modal isOpen={isResolveOpen} onClose={closeResolveModal} className="max-w-md m-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
            Marcar como Resuelto
          </h2>

          {successMessage && (
            <div className="mb-4">
              <Alert variant="success" title="Éxito" message={successMessage} />
            </div>
          )}

          {errorMessage && (
            <div className="mb-4">
              <Alert variant="error" title="Error" message={errorMessage} />
            </div>
          )}

          {selectedGap && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Anomalía en farmacia: <span className="font-medium text-gray-800 dark:text-white">{selectedGap.pharmacy.commercial_name}</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Patrón recibido: <span className="font-medium text-gray-800 dark:text-white">{selectedGap.received_pattern}</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Similitud: <span className={`font-semibold ${
                    parseFloat(selectedGap.similarity_score) < 30
                      ? 'text-red-600 dark:text-red-400'
                      : parseFloat(selectedGap.similarity_score) < 60
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>{parseFloat(selectedGap.similarity_score).toFixed(1)}%</span>
                </p>
              </div>

              <div>
                <Label>Notas de Resolución (Opcional)</Label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe por qué se resolvió este salto..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={closeResolveModal} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button onClick={handleResolveGap} disabled={isLoading}>
                  {isLoading ? "Resolviendo..." : "Marcar como Resuelto"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
