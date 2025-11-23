import { useEffect, useState, useMemo } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import Alert from "../../../components/ui/alert/Alert";
import Badge from "../../../components/ui/badge/Badge";
import { useModal } from "../../../hooks/useModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { getPharmacyRequests, updatePharmacyRequestStatus } from "../../../services/protected/pharmacy-requests.services";
import { getDistributors } from "../../../services/protected/distributors.services";
import { PharmacyRequestData, PharmacyRequestStatus } from "../../../types/services/protected/pharmacy-requests.types";
import { DistributorData } from "../../../types/services/protected/distributors.types";
import { formatDate } from "../../../helper/formatData";

export default function SolicitudesFarmaciasPage() {
  const [requests, setRequests] = useState<PharmacyRequestData[]>([]);
  const [distributors, setDistributors] = useState<DistributorData[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PharmacyRequestData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Update status form
  const [newStatus, setNewStatus] = useState<PharmacyRequestStatus>("pending");
  const [selectedDistributorId, setSelectedDistributorId] = useState<number | null>(null);

  // Alerts
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Modals
  const { isOpen: isDetailOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();
  const { isOpen: isUpdateStatusOpen, openModal: openUpdateStatusModal, closeModal: closeUpdateStatusModal } = useModal();

  useEffect(() => {
    loadRequests();
    loadDistributors();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await getPharmacyRequests();
      if (response.status === 200 && Array.isArray(response.data)) {
        setRequests(response.data);
      }
    } catch (error) {
      console.error("Error cargando solicitudes:", error);
    }
  };

  const loadDistributors = async () => {
    try {
      const response = await getDistributors();
      if (response.status === 200 && Array.isArray(response.data)) {
        setDistributors(response.data);
      }
    } catch (error) {
      console.error("Error cargando distribuidores:", error);
    }
  };

  // Filtrar solicitudes
  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Filtrar por estado
    if (statusFilter) {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(request =>
        request.legal_name.toLowerCase().includes(query) ||
        request.commercial_name.toLowerCase().includes(query) ||
        request.identification_number?.toLowerCase().includes(query) ||
        request.email?.toLowerCase().includes(query) ||
        request.administrator_name?.toLowerCase().includes(query) ||
        request.phone?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [requests, statusFilter, searchQuery]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Resetear a la página 1 cuando cambia la búsqueda o filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

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

  // Opciones para select de filtro
  const statusFilterOptions = [
    { value: "", label: "Todos los estados" },
    { value: "pending", label: "Pendiente" },
    { value: "approved", label: "Aprobado" },
    { value: "rejected", label: "Rechazado" },
  ];

  const statusOptions = [
    { value: "pending", label: "Pendiente" },
    { value: "approved", label: "Aprobado" },
    { value: "rejected", label: "Rechazado" },
  ];

  const distributorOptions = useMemo(() => {
    return distributors
      .filter(d => d.status)
      .map(d => ({
        value: d.id.toString(),
        label: d.business_name
      }));
  }, [distributors]);

  const handleViewDetails = (request: PharmacyRequestData) => {
    setSelectedRequest(request);
    openDetailModal();
  };

  const handleOpenUpdateStatus = (request: PharmacyRequestData) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setSelectedDistributorId(request.distributor_id);
    setSuccessMessage("");
    setErrorMessage("");
    openUpdateStatusModal();
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;

    // Validar que si es "approved" debe tener distribuidor
    if (newStatus === "approved" && !selectedDistributorId) {
      setErrorMessage("Para aprobar la solicitud, debe seleccionar un distribuidor");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const params: { status: PharmacyRequestStatus; distributor_id?: number } = {
        status: newStatus,
      };

      if (newStatus === "approved" && selectedDistributorId) {
        params.distributor_id = selectedDistributorId;
      }

      const response = await updatePharmacyRequestStatus(selectedRequest.id, params);

      if (response.status === 200) {
        setSuccessMessage("Estado actualizado correctamente");
        loadRequests();
        setTimeout(() => {
          closeUpdateStatusModal();
          setSuccessMessage("");
        }, 1500);
      } else {
        setErrorMessage("Error al actualizar el estado");
      }
    } catch (error: any) {
      console.error("Error actualizando estado:", error);
      setErrorMessage(error?.response?.data?.message || "Error al actualizar el estado");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: PharmacyRequestStatus) => {
    switch (status) {
      case "pending":
        return <Badge color="warning">Pendiente</Badge>;
      case "approved":
        return <Badge color="success">Aprobado</Badge>;
      case "rejected":
        return <Badge color="error">Rechazado</Badge>;
      default:
        return <Badge color="light">{status}</Badge>;
    }
  };

  return (
    <>
      <PageMeta
        title="Solicitudes de Farmacias | Alter Pharma"
        description="Gestión de solicitudes de registro de farmacias"
      />
      <PageBreadcrumb pageTitle="Solicitudes de Farmacias" />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Filtros y búsqueda */}
        <div className="flex flex-col gap-4 p-5 border-b border-gray-200 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Buscador */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar solicitudes..."
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

            {/* Filtro por estado */}
            <div className="w-full sm:w-48">
              <Select
                options={statusFilterOptions}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                placeholder="Filtrar por estado"
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
                  Nombre Comercial
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Razón Social
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Email
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Teléfono
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Distribuidor
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Estado
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Fecha Solicitud
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.length > 0 ? (
                paginatedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {request.commercial_name}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                        {request.legal_name}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                        {request.email}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                        {request.phone}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                        {request.distributor?.business_name || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                        {formatDate(request.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="flex items-center gap-2">
                        {/* Ver detalles */}
                        <button
                          onClick={() => handleViewDetails(request)}
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
                        {/* Actualizar estado - solo si no está aprobado */}
                        {request.status !== "approved" && (
                        <button
                          onClick={() => handleOpenUpdateStatus(request)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                          title="Actualizar estado"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
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
                  <TableCell className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron solicitudes
                  </TableCell>
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
                  <span className="font-medium">{Math.min(endIndex, filteredRequests.length)}</span> de{" "}
                  <span className="font-medium">{filteredRequests.length}</span> resultados
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
                            ? 'z-10 bg-brand-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'
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
            Detalles de la Solicitud
          </h2>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Nombre Comercial
                  </label>
                  <p className="text-gray-800 dark:text-white">{selectedRequest.commercial_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Razón Social
                  </label>
                  <p className="text-gray-800 dark:text-white">{selectedRequest.legal_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Identificación
                  </label>
                  <p className="text-gray-800 dark:text-white">{selectedRequest.identification_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Email
                  </label>
                  <p className="text-gray-800 dark:text-white">{selectedRequest.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Teléfono
                  </label>
                  <p className="text-gray-800 dark:text-white">{selectedRequest.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Administrador
                  </label>
                  <p className="text-gray-800 dark:text-white">{selectedRequest.administrator_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Dirección
                  </label>
                  <p className="text-gray-800 dark:text-white">{selectedRequest.street_address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Es Cadena
                  </label>
                  <p className="text-gray-800 dark:text-white">{selectedRequest.is_chain ? "Sí" : "No"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    País
                  </label>
                  <p className="text-gray-800 dark:text-white">{selectedRequest.country?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Estado/Provincia
                  </label>
                  <p className="text-gray-800 dark:text-white">{selectedRequest.state?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Municipio
                  </label>
                  <p className="text-gray-800 dark:text-white">{selectedRequest.municipality?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Distribuidor
                  </label>
                  <p className="text-gray-800 dark:text-white">{selectedRequest.distributor?.business_name || "-"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Estado
                  </label>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Fecha de Solicitud
                  </label>
                  <p className="text-gray-800 dark:text-white">{formatDate(selectedRequest.created_at)}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={closeDetailModal}>
                  Cerrar
                </Button>
                {selectedRequest.status !== "approved" && (
                <Button onClick={() => {
                  closeDetailModal();
                  handleOpenUpdateStatus(selectedRequest);
                }}>
                  Actualizar Estado
                </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de actualizar estado */}
      <Modal isOpen={isUpdateStatusOpen} onClose={closeUpdateStatusModal} className="max-w-md m-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
            Actualizar Estado de Solicitud
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

          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Solicitud de: <span className="font-medium text-gray-800 dark:text-white">{selectedRequest.commercial_name}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado <span className="text-red-500">*</span>
                </label>
                <Select
                  options={statusOptions}
                  value={newStatus}
                  onChange={(value) => setNewStatus(value as PharmacyRequestStatus)}
                  placeholder="Selecciona un estado"
                />
              </div>

              {newStatus === "approved" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Distribuidor <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={distributorOptions}
                    value={selectedDistributorId?.toString() || ""}
                    onChange={(value) => setSelectedDistributorId(value ? Number(value) : null)}
                    placeholder="Selecciona un distribuidor"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Requerido para aprobar la solicitud
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={closeUpdateStatusModal} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateStatus} disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
