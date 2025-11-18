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
import { getMunicipalities, createMunicipality, updateMunicipality, toggleMunicipalityStatus, deleteMunicipality } from "../../../services/protected/municipalities.services";
import { getCountries } from "../../../services/protected/countries.services";
import { getStates } from "../../../services/protected/states.services";
import { MunicipalityData } from "../../../types/services/protected/municipalities.types";
import { CountryData, StateData } from "../../../types/services/protected/countries.types";
import { formatDate } from "../../../helper/formatData";
import BulkUploadMunicipalityModal from "../../../components/municipalities/BulkUploadMunicipalityModal";

export default function MunicipiosPage() {
  const [municipalities, setMunicipalities] = useState<MunicipalityData[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingStates, setIsLoadingStates] = useState(true);
  const [selectedMunicipality, setSelectedMunicipality] = useState<MunicipalityData | null>(null);

  // Filtros
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("");

  // Search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form fields
  const [municipalityName, setMunicipalityName] = useState("");
  const [selectedCountryIdForm, setSelectedCountryIdForm] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modals
  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isBulkUploadOpen, openModal: openBulkUploadModal, closeModal: closeBulkUploadModal } = useModal();

  useEffect(() => {
    loadCountries();
    loadStates();
  }, []);

  useEffect(() => {
    if (stateFilter) {
      loadMunicipalities(parseInt(stateFilter));
    } else {
      setMunicipalities([]);
    }
  }, [stateFilter]);

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

  const loadStates = async () => {
    setIsLoadingStates(true);
    try {
      const response = await getStates();
      if (response.status === 200 && Array.isArray(response.data)) {
        setStates(response.data);
      }
    } catch (error) {
      console.error("Error cargando ciudades:", error);
    } finally {
      setIsLoadingStates(false);
    }
  };

  const loadMunicipalities = async (stateId: number) => {
    try {
      const response = await getMunicipalities(stateId);
      if (response.status === 200 && Array.isArray(response.data)) {
        setMunicipalities(response.data);
      }
    } catch (error) {
      console.error("Error cargando municipios:", error);
      setMunicipalities([]);
    }
  };

  // Opciones de filtro de países
  const countryFilterOptions = useMemo(() => {
    return countries
      .filter(country => country.status)
      .map(country => ({
        value: country.id.toString(),
        label: country.name
      }));
  }, [countries]);

  // Opciones de filtro de ciudades (filtrados por país)
  const stateFilterOptions = useMemo(() => {
    if (!countryFilter) return [];
    // Comparar como strings para evitar problemas de tipo
    const filterValue = countryFilter.toString();
    return states
      .filter(state => state.country_id.toString() === filterValue && state.status)
      .map(state => ({
        value: state.id.toString(),
        label: state.name
      }));
  }, [states, countryFilter]);

  // Opciones de países para formularios
  const countryFormOptions = useMemo(() => {
    return countries
      .filter(country => country.status)
      .map(country => ({
        value: country.id.toString(),
        label: country.name
      }));
  }, [countries]);

  // Opciones para el formulario (ciudades filtrados por país seleccionado)
  const stateFormOptions = useMemo(() => {
    if (!selectedCountryIdForm) return [];
    // Comparar como strings para evitar problemas de tipo
    const countryIdStr = selectedCountryIdForm.toString();
    return states
      .filter(state => state.country_id.toString() === countryIdStr && state.status)
      .map(state => ({
        value: state.id.toString(),
        label: state.name
      }));
  }, [states, selectedCountryIdForm]);

  const handleCountryFilterChange = (value: string) => {
    setCountryFilter(value);
    setStateFilter(""); // Resetear ciudad cuando cambia el país
  };

  const handleCountryFormChange = (value: string) => {
    setSelectedCountryIdForm(parseInt(value));
    setSelectedStateId(null); // Resetear ciudad cuando cambia el país
  };

  const handleAddMunicipality = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStateId) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await createMunicipality(selectedStateId, municipalityName);
      if (response.status === 200 || response.status === 201) {
        if (stateFilter) {
          await loadMunicipalities(parseInt(stateFilter));
        }
        setMunicipalityName("");
        setSelectedStateId(null);
        closeAddModal();
      }
    } catch (error: any) {
      console.error("Error creando municipio:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al crear el municipio" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMunicipality = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMunicipality || !selectedStateId) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await updateMunicipality(selectedMunicipality.state_id, selectedMunicipality.id, municipalityName);
      if (response.status === 200) {
        if (stateFilter) {
          await loadMunicipalities(parseInt(stateFilter));
        }
        setMunicipalityName("");
        setSelectedStateId(null);
        setSelectedMunicipality(null);
        closeEditModal();
      }
    } catch (error: any) {
      console.error("Error editando municipio:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al actualizar el municipio" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (municipality: MunicipalityData) => {
    try {
      await toggleMunicipalityStatus(municipality.state_id, municipality.id);
      if (stateFilter) {
        await loadMunicipalities(parseInt(stateFilter));
      }
    } catch (error) {
      console.error("Error cambiando ciudad del municipio:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedMunicipality) return;

    setIsLoading(true);
    try {
      await deleteMunicipality(selectedMunicipality.state_id, selectedMunicipality.id);
      if (stateFilter) {
        await loadMunicipalities(parseInt(stateFilter));
      }
      setSelectedMunicipality(null);
      closeDeleteModal();
    } catch (error) {
      console.error("Error eliminando municipio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAdd = () => {
    setMunicipalityName("");
    setSelectedCountryIdForm(null);
    setSelectedStateId(null);
    setSelectedMunicipality(null);
    setErrors({});
    closeAddModal();
  };

  const openEdit = (municipality: MunicipalityData) => {
    setSelectedMunicipality(municipality);
    setMunicipalityName(municipality.name);
    setSelectedStateId(municipality.state_id);

    // Encontrar el país del ciudad seleccionado
    const state = states.find(s => s.id === municipality.state_id);
    if (state) {
      setSelectedCountryIdForm(state.country_id);
    }

    openEditModal();
  };

  const handleCloseEdit = () => {
    setMunicipalityName("");
    setSelectedCountryIdForm(null);
    setSelectedStateId(null);
    setSelectedMunicipality(null);
    setErrors({});
    closeEditModal();
  };

  const openDelete = (municipality: MunicipalityData) => {
    setSelectedMunicipality(municipality);
    openDeleteModal();
  };

  const handleCloseDelete = () => {
    setSelectedMunicipality(null);
    closeDeleteModal();
  };

  // Filtrar municipios por búsqueda
  const filteredMunicipalities = useMemo(() => {
    if (!searchQuery.trim()) return municipalities;

    const query = searchQuery.toLowerCase();
    return municipalities.filter(municipality =>
      municipality.name.toLowerCase().includes(query)
    );
  }, [municipalities, searchQuery]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredMunicipalities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMunicipalities = filteredMunicipalities.slice(startIndex, endIndex);

  // Resetear a la página 1 cuando cambia la búsqueda o los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, countryFilter, stateFilter]);

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

  // Determinar qué empty state mostrar
  const getEmptyState = () => {
    if (!countryFilter) {
      return {
        icon: (
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        ),
        title: "Selecciona un país",
        description: "Por favor selecciona un país para ver los ciudades disponibles."
      };
    }

    if (!stateFilter) {
      return {
        icon: (
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        ),
        title: "Selecciona una ciudad",
        description: "Por favor selecciona una ciudad para ver los municipios disponibles."
      };
    }

    return {
      icon: (
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      title: "No hay municipios",
      description: "No se encontraron municipios para el ciudad seleccionado. Comienza agregando un nuevo municipio."
    };
  };

  const emptyState = getEmptyState();

  return (
    <>
      <PageMeta
        title="Municipios - Localización | Alter Pharma"
        description="Gestión de municipios en el sistema"
      />
      <PageBreadcrumb pageTitle="Municipios/Cantones" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Gestión de Municipios/Cantones
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra los municipios por ciudad y país
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
              Agregar Municipio/Cantón
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Filtrar por país:</Label>
              <Select
                options={countryFilterOptions}
                placeholder={isLoadingCountries ? "Cargando países..." : "Selecciona un país"}
                value={countryFilter}
                onChange={handleCountryFilterChange}
                disabled={isLoadingCountries}
              />
            </div>
            <div>
              <Label>Filtrar por ciudad:</Label>
              <Select
                options={stateFilterOptions}
                placeholder={isLoadingStates ? "Cargando ciudades..." : "Selecciona una ciudad"}
                value={stateFilter}
                onChange={(value) => setStateFilter(value)}
                disabled={!countryFilter || isLoadingStates}
              />
            </div>
          </div>
        </div>

        {/* Buscador */}
        {stateFilter && (
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
                placeholder="Buscar por nombre de municipio..."
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
                Mostrando {filteredMunicipalities.length} de {municipalities.length} municipios
              </p>
            )}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Municipio/Cantón</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ciudad</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Creado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {paginatedMunicipalities.map((municipality) => (
                  <TableRow key={municipality.id}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{municipality.id}</TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{municipality.name}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Switch
                        label={municipality.status ? "Activo" : "Inactivo"}
                        defaultChecked={municipality.status}
                        onChange={() => handleToggleStatus(municipality)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(municipality.created_at)}</TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(municipality)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20" title="Editar municipio">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button onClick={() => openDelete(municipality)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20" title="Eliminar municipio">
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

            {paginatedMunicipalities.length === 0 && (
              <div className="px-5 py-12 text-center">
                {emptyState.icon}
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">
                  {searchQuery && stateFilter ? "No se encontraron resultados" : emptyState.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery && stateFilter
                    ? `No se encontraron municipios que coincidan con "${searchQuery}".`
                    : emptyState.description
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Paginación */}
        {filteredMunicipalities.length > 0 && stateFilter && (
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
                    <span className="font-medium">{Math.min(endIndex, filteredMunicipalities.length)}</span> de{' '}
                    <span className="font-medium">{filteredMunicipalities.length}</span> resultados
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

      {/* Modal: Agregar Municipio/Cantón */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAdd} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Agregar Nuevo Municipio/Cantón</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completa los datos para crear un nuevo municipio</p>
          </div>
          <div className="mb-6">
            <Alert variant="warning" title="Importante" message="Para crear un nuevo municipio, asegúrate de que ya existan un país y una ciudad registrados." showLink={false} />
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
          <form onSubmit={handleAddMunicipality} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4">
              <div>
                <Label>País *</Label>
                <Select
                  options={countryFormOptions}
                  placeholder={isLoadingCountries ? "Cargando países..." : "Selecciona un país"}
                  onChange={handleCountryFormChange}
                  value={selectedCountryIdForm !== null ? selectedCountryIdForm.toString() : ""}
                  disabled={isLoadingCountries}
                />
              </div>
              <div>
                <Label>Ciudad *</Label>
                <Select
                  options={stateFormOptions}
                  placeholder={isLoadingStates ? "Cargando ciudades..." : "Selecciona una ciudad"}
                  onChange={(value) => setSelectedStateId(parseInt(value))}
                  value={selectedStateId !== null ? selectedStateId.toString() : ""}
                  disabled={!selectedCountryIdForm || isLoadingStates}
                />
              </div>
              <div>
                <Label>Nombre del municipio *</Label>
                <Input
                  type="text"
                  value={municipalityName}
                  onChange={(e) => setMunicipalityName(e.target.value)}
                  placeholder="Ej: Santo Domingo Este"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseAdd}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !municipalityName || !selectedStateId}>{isLoading ? 'Guardando...' : 'Guardar Municipio/Cantón'}</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Editar Municipio/Cantón */}
      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Editar Municipio/Cantón</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Modifica los datos del municipio seleccionado</p>
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
          <form onSubmit={handleEditMunicipality} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4">
              <div>
                <Label>Nombre del municipio *</Label>
                <Input
                  type="text"
                  value={municipalityName}
                  onChange={(e) => setMunicipalityName(e.target.value)}
                  placeholder="Ej: Santo Domingo Este"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseEdit}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !municipalityName}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Eliminar Municipio/Cantón */}
      <Modal isOpen={isDeleteOpen} onClose={handleCloseDelete} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Eliminar Municipio/Cantón</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">¿Estás seguro de que deseas eliminar este municipio?</p>
          </div>
          <div className="px-2 pb-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Estás a punto de eliminar el municipio <span className="font-semibold">{selectedMunicipality?.name}</span>. Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" type="button" onClick={handleCloseDelete}>Cancelar</Button>
            <Button size="sm" onClick={handleDelete} disabled={isLoading} className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700">
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Carga Masiva */}
      <BulkUploadMunicipalityModal
        isOpen={isBulkUploadOpen}
        onClose={closeBulkUploadModal}
        onSuccess={(stateId) => {
          if (stateFilter) {
            loadMunicipalities(parseInt(stateFilter));
          } else {
            loadMunicipalities(stateId);
            setStateFilter(stateId.toString());
          }
        }}
      />
    </>
  );
}
