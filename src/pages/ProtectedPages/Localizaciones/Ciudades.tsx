import { useEffect, useState, useMemo } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Select from "../../../components/form/Select";
import Switch from "../../../components/form/switch/Switch";
import Alert from "../../../components/ui/alert/Alert";
import { useModal } from "../../../hooks/useModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { getStates, createState, updateState, toggleStateStatus, deleteState } from "../../../services/protected/states.services";
import { getCountries } from "../../../services/protected/countries.services";
import { StateData } from "../../../types/services/protected/states.types";
import { CountryData } from "../../../types/services/protected/countries.types";
import { formatDate } from "../../../helper/formatData";
import BulkUploadStateModal from "../../../components/states/BulkUploadStateModal";

export default function CiudadesPage() {
  const [states, setStates] = useState<StateData[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [countryFilter, setCountryFilter] = useState<string>("");

  // Search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form fields
  const [stateName, setStateName] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);

  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modals
  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isBulkUploadOpen, openModal: openBulkUploadModal, closeModal: closeBulkUploadModal } = useModal();

  useEffect(() => {
    loadStates();
    loadCountries();
  }, []);

  const loadStates = async () => {
    try {
      const response = await getStates();
      if (response.status === 200 && Array.isArray(response.data)) {
        setStates(response.data);
      }
    } catch (error) {
      console.error("Error cargando ciudades:", error);
    }
  };

  const loadCountries = async () => {
    setIsLoadingCountries(true);
    try {
      const response = await getCountries();
      if (response.status === 200 && Array.isArray(response.data)) {
        setCountries(response.data);
      }
    } catch (error) {
      console.error("Error cargando países:", error);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  // Filtrar ciudades por país y búsqueda
  const filteredStates = useMemo(() => {
    let filtered = states;

    // Filtrar por país si hay un país seleccionado
    if (countryFilter) {
      const filterValue = countryFilter.toString();
      filtered = filtered.filter(state => {
        const stateCountryId = state.country_id.toString();
        return stateCountryId === filterValue;
      });
    }

    // Filtrar por búsqueda si hay un query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(state =>
        state.name.toLowerCase().includes(query) ||
        state.country.name.toLowerCase().includes(query) ||
        state.country.code.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [states, countryFilter, searchQuery]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredStates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStates = filteredStates.slice(startIndex, endIndex);

  // Resetear a la página 1 cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, countryFilter]);

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas con puntos suspensivos
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

  // Opciones para el select de países (filtro)
  const countryFilterOptions = useMemo(() => {
    return countries
      .filter(country => country.status)
      .map(country => ({
        value: country.id.toString(),
        label: country.name
      }));
  }, [countries]);

  // Opciones para el select de países (formulario)
  const countryOptions = useMemo(() => {
    return countries
      .filter(country => country.status)
      .map(country => ({
        value: country.id.toString(),
        label: country.name
      }));
  }, [countries]);

  const handleAddState = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountryId) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await createState(stateName, selectedCountryId);
      if (response.status === 200 || response.status === 201) {
        await loadStates();
        setStateName("");
        setSelectedCountryId(null);
        closeAddModal();
      }
    } catch (error: any) {
      console.error("Error creando ciudad:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al crear la ciudad/provincia" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditState = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedState || !selectedCountryId) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await updateState(selectedState.id, stateName, selectedCountryId);
      if (response.status === 200) {
        await loadStates();
        setStateName("");
        setSelectedCountryId(null);
        setSelectedState(null);
        closeEditModal();
      }
    } catch (error: any) {
      console.error("Error editando ciudad:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al actualizar la ciudad/provincia" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (state: StateData) => {
    try {
      await toggleStateStatus(state.id);
      await loadStates();
    } catch (error) {
      console.error("Error cambiando ciudad del ciudad:", error);
    }
  };

  const handleDeleteState = async () => {
    if (!selectedState) return;
    setIsLoading(true);

    try {
      await deleteState(selectedState.id);
      await loadStates();
      setSelectedState(null);
      closeDeleteModal();
    } catch (error) {
      console.error("Error eliminando ciudad:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAdd = () => {
    setStateName("");
    setSelectedCountryId(null);
    setSelectedState(null);
    setErrors({});
    closeAddModal();
  };

  const openEdit = (state: StateData) => {
    setSelectedState(state);
    setStateName(state.name);
    setSelectedCountryId(state.country_id);
    openEditModal();
  };

  const handleCloseEdit = () => {
    setStateName("");
    setSelectedCountryId(null);
    setSelectedState(null);
    setErrors({});
    closeEditModal();
  };

  const openDelete = (state: StateData) => {
    setSelectedState(state);
    openDeleteModal();
  };

  const handleCloseDelete = () => {
    setSelectedState(null);
    setErrors({});
    closeDeleteModal();
  };

  return (
    <>
      <PageMeta
        title="Ciudades/Provincias - Localización | Alter Pharma"
        description="Gestión de ciudades y provincias en el sistema"
      />
      <PageBreadcrumb pageTitle="Ciudades/Provincias" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Gestión de Ciudades/Provincias
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra las ciudades y ciudades por país
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={openBulkUploadModal} size="md" variant="outline">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Carga Masiva
            </Button>
            <Button onClick={openAddModal} size="md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar Ciudad/Provincias
            </Button>
          </div>
        </div>

        {/* Buscador */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre de ciudad/provincia o país..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-white/[0.05] rounded-lg bg-white dark:bg-white/[0.03] text-gray-800 dark:text-white/90 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Mostrando {filteredStates.length} de {states.length} ciudades/provincias
            </p>
          )}
        </div>

        {/* Filtro por país */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
          <div className="flex items-center gap-4">
            <Label className="whitespace-nowrap">Filtrar por país:</Label>
            <div className="w-full max-w-xs">
              <Select
                options={countryFilterOptions}
                placeholder={isLoadingCountries ? "Cargando países..." : "Todos los países"}
                onChange={(value) => setCountryFilter(value)}
                value={countryFilter}
                disabled={isLoadingCountries}
              />
            </div>
            {countryFilter && !isLoadingCountries && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {filteredStates.length} de {states.length} ciudades/provincias
              </span>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ciudad/Provincia</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">País</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ciudad</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Creado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {paginatedStates.map((state) => (
                  <TableRow key={state.id}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{state.id}</TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{state.name}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-800 dark:text-white/90">{state.country.name}</span>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {state.country.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Switch
                        label={state.status ? "Activo" : "Inactivo"}
                        defaultChecked={state.status}
                        onChange={() => handleToggleStatus(state)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(state.created_at)}</TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(state)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20" title="Editar ciudad/provincia">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button onClick={() => openDelete(state)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20" title="Eliminar ciudad/provincia">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {paginatedStates.length === 0 && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">
                  {searchQuery || countryFilter ? "No se encontraron resultados" : "No hay ciudades/provincias"}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery
                    ? `No se encontraron ciudades/provincias que coincidan con "${searchQuery}".`
                    : countryFilter
                      ? "No se encontraron ciudades/provincias para el país seleccionado."
                      : "Comienza agregando una nueva ciudad/provincia."
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Paginación */}
        {filteredStates.length > 0 && (
          <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-white/[0.05] text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-white/[0.05] text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredStates.length)}</span> de{' '}
                    <span className="font-medium">{filteredStates.length}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Anterior</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {getPageNumbers().map((page, index) => (
                      page === '...' ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'bg-white dark:bg-white/[0.03] border-gray-300 dark:border-white/[0.05] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.05]'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    ))}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Siguiente</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Agregar Ciudad/Provincia */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAdd} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Agregar Nueva Ciudad/Provincia</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completa los datos para crear una nueva ciudad/provincia</p>
          </div>
          {Object.keys(errors).length > 0 && (
            <div className="px-2 mb-4">
              <Alert
                variant="error"
                title="Error de validación"
                message={errors.general || Object.values(errors)[0] || "Por favor corrige los errores en el formulario"}
              />
            </div>
          )}
          <form onSubmit={handleAddState} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4">
              <div>
                <Label>País</Label>
                <Select
                  options={countryOptions}
                  placeholder="Selecciona un país"
                  onChange={(value) => setSelectedCountryId(parseInt(value))}
                  defaultValue=""
                />
              </div>
              <div>
                <Label>Nombre de la ciudad/provincia</Label>
                <Input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="Ej: Santo Domingo"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseAdd}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !stateName || !selectedCountryId}>{isLoading ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Editar Ciudad/Provincia */}
      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Editar Ciudad/Provincia</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Modifica los datos de la ciudad/provincia seleccionada</p>
          </div>
          {Object.keys(errors).length > 0 && (
            <div className="px-2 mb-4">
              <Alert
                variant="error"
                title="Error de validación"
                message={errors.general || Object.values(errors)[0] || "Por favor corrige los errores en el formulario"}
              />
            </div>
          )}
          <form onSubmit={handleEditState} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4">
              <div>
                <Label>País</Label>
                <Select
                  options={countryOptions}
                  placeholder="Selecciona un país"
                  onChange={(value) => setSelectedCountryId(parseInt(value))}
                  defaultValue={selectedCountryId?.toString() || ""}
                />
              </div>
              <div>
                <Label>Nombre de la ciudad/provincia</Label>
                <Input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="Ej: Santo Domingo"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseEdit}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !stateName || !selectedCountryId}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Eliminar Ciudad/Provincia */}
      <Modal isOpen={isDeleteOpen} onClose={handleCloseDelete} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Eliminar Ciudad/Provincia</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que deseas eliminar la ciudad/provincia <strong>{selectedState?.name}</strong>?
            </p>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={handleCloseDelete}>Cancelar</Button>
            <Button size="sm" onClick={handleDeleteState} disabled={isLoading} className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700">
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Carga Masiva */}
      <BulkUploadStateModal
        isOpen={isBulkUploadOpen}
        onClose={closeBulkUploadModal}
        onSuccess={loadStates}
      />
    </>
  );
}
