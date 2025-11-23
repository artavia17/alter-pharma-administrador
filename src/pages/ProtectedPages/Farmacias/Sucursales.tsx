import { useEffect, useState, useMemo } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Select from "../../../components/form/Select";
import Button from "../../../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { getPharmaciesByCountry, getSubPharmacies, toggleSubPharmacyStatus, deleteSubPharmacy } from "../../../services/protected/sub-pharmacies.services";
import { getCountries } from "../../../services/protected/countries.services";
import { SubPharmacyData } from "../../../types/services/protected/sub-pharmacies.types";
import { CountryData } from "../../../types/services/protected/countries.types";
import { formatDate } from "../../../helper/formatData";
import AddSubPharmacyModal from "../../../components/sub-pharmacies/AddSubPharmacyModal";
import BulkUploadSubPharmacyModal from "../../../components/sub-pharmacies/BulkUploadSubPharmacyModal";
import { useModal } from "../../../hooks/useModal";
import * as XLSX from 'xlsx';

interface PharmacyOption {
  id: number;
  commercial_name: string;
  country_id: number;
}

export default function SucursalesPage() {
  const [subPharmacies, setSubPharmacies] = useState<SubPharmacyData[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [pharmacyFilter, setPharmacyFilter] = useState<string>("");

  // Search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modales
  const { isOpen: isAddModalOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isBulkModalOpen, openModal: openBulkModal, closeModal: closeBulkModal } = useModal();
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  // Ciudad para la sucursal a eliminar
  const [subPharmacyToDelete, setSubPharmacyToDelete] = useState<SubPharmacyData | null>(null);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (countryFilter) {
      loadPharmaciesByCountry(parseInt(countryFilter));
    } else {
      setPharmacies([]);
      setPharmacyFilter("");
      setSubPharmacies([]);
    }
  }, [countryFilter]);

  useEffect(() => {
    if (pharmacyFilter) {
      loadSubPharmacies(parseInt(pharmacyFilter));
    } else {
      setSubPharmacies([]);
    }
  }, [pharmacyFilter]);

  const loadCountries = async () => {
    try {
      const response = await getCountries();
      if (response.status === 200 && Array.isArray(response.data)) {
        setCountries(response.data);
      }
    } catch (error) {
      console.error("Error cargando países:", error);
    }
  };

  const loadPharmaciesByCountry = async (countryId: number) => {
    setIsLoading(true);
    try {
      const response = await getPharmaciesByCountry(countryId);
      if (response.status === 200 && Array.isArray(response.data)) {
        // Filtrar solo farmacias que son cadenas (is_chain: true)
        const chainPharmacies = response.data.filter(p => p.is_chain === true);
        setPharmacies(chainPharmacies.map(p => ({
          id: p.id,
          commercial_name: p.commercial_name,
          country_id: p.country_id
        })));
      }
    } catch (error) {
      console.error("Error cargando farmacias:", error);
      setPharmacies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubPharmacies = async (pharmacyId: number) => {
    setIsLoading(true);
    try {
      const response = await getSubPharmacies(pharmacyId);
      if (response.status === 200 && Array.isArray(response.data)) {
        setSubPharmacies(response.data);
      }
    } catch (error) {
      console.error("Error cargando sucursales:", error);
      setSubPharmacies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (subPharmacyId: number) => {
    if (!pharmacyFilter) return;

    try {
      await toggleSubPharmacyStatus(parseInt(pharmacyFilter), subPharmacyId);
      loadSubPharmacies(parseInt(pharmacyFilter));
    } catch (error) {
      console.error("Error cambiando ciudad:", error);
    }
  };

  const openDelete = (subPharmacy: SubPharmacyData) => {
    setSubPharmacyToDelete(subPharmacy);
    openDeleteModal();
  };

  const handleCloseDelete = () => {
    setSubPharmacyToDelete(null);
    closeDeleteModal();
  };

  const handleDeleteSubPharmacy = async () => {
    if (!pharmacyFilter || !subPharmacyToDelete) return;
    setIsLoading(true);

    try {
      await deleteSubPharmacy(parseInt(pharmacyFilter), subPharmacyToDelete.id);
      await loadSubPharmacies(parseInt(pharmacyFilter));
      setSubPharmacyToDelete(null);
      closeDeleteModal();
    } catch (error) {
      console.error("Error eliminando sucursal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalSuccess = () => {
    if (pharmacyFilter) {
      loadSubPharmacies(parseInt(pharmacyFilter));
    }
  };

  const selectedPharmacy = pharmacies.find(p => p.id === parseInt(pharmacyFilter || "0"));

  // Opciones para select de países
  const countryFilterOptions = useMemo(() => {
    return countries
      .filter(country => country.status)
      .map(country => ({
        value: country.id.toString(),
        label: country.name
      }));
  }, [countries]);

  // Opciones para select de farmacias
  const pharmacyFilterOptions = useMemo(() => {
    return pharmacies.map(pharmacy => ({
      value: pharmacy.id.toString(),
      label: pharmacy.commercial_name
    }));
  }, [pharmacies]);

  // Filtrar sucursales por búsqueda
  const filteredSubPharmacies = useMemo(() => {
    if (!searchQuery.trim()) return subPharmacies;

    const query = searchQuery.toLowerCase();
    return subPharmacies.filter(subPharmacy =>
      subPharmacy.commercial_name.toLowerCase().includes(query) ||
      subPharmacy.pharmacy.commercial_name.toLowerCase().includes(query) ||
      subPharmacy.pharmacy.legal_name.toLowerCase().includes(query) ||
      subPharmacy.physical_address?.toLowerCase().includes(query) ||
      subPharmacy.email?.toLowerCase().includes(query) ||
      subPharmacy.phone?.toLowerCase().includes(query) ||
      subPharmacy.administrator_name?.toLowerCase().includes(query)
    );
  }, [subPharmacies, searchQuery]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredSubPharmacies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubPharmacies = filteredSubPharmacies.slice(startIndex, endIndex);

  // Resetear a la página 1 cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  const hasActiveFilters = countryFilter && pharmacyFilter;

  // Función para exportar a Excel
  const handleExportToExcel = () => {
    // Preparar los datos para exportar
    const dataToExport = filteredSubPharmacies.map(subPharmacy => ({
      'ID': subPharmacy.id,
      'Nombre Comercial': subPharmacy.commercial_name,
      'Farmacéutica': subPharmacy.pharmacy.commercial_name,
      'Distribuidor': subPharmacy.default_distributor?.business_name || 'N/A',
      'Dirección Física': subPharmacy.physical_address || 'N/A',
      'País': subPharmacy.pharmacy.country.name,
      'Teléfono': subPharmacy.phone || 'N/A',
      'Email': subPharmacy.email || 'N/A',
      'Administrador': subPharmacy.administrator_name || 'N/A',
      'Estado': subPharmacy.status ? 'Activo' : 'Inactivo',
      'Fecha de Creación': formatDate(subPharmacy.created_at)
    }));

    // Crear libro de trabajo
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sucursales');

    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 5 },   // ID
      { wch: 30 },  // Nombre Comercial
      { wch: 35 },  // Farmacéutica
      { wch: 30 },  // Distribuidor
      { wch: 40 },  // Dirección Física
      { wch: 25 },  // País
      { wch: 15 },  // Teléfono
      { wch: 30 },  // Email
      { wch: 30 },  // Administrador
      { wch: 12 },  // Estado
      { wch: 18 }   // Fecha de Creación
    ];
    worksheet['!cols'] = columnWidths;

    // Generar archivo Excel
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Sucursales_${timestamp}.xlsx`);
  };

  return (
    <>
      <PageMeta
        title="Sucursales - Farmacias | Alter Pharma"
        description="Visualización de sucursales por farmacia"
      />
      <PageBreadcrumb pageTitle="Sucursales" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Sucursales de Farmacias
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Visualiza las sucursales registradas por farmacia
            </p>
          </div>
          {hasActiveFilters && (
            <div className="flex items-center gap-3">
              <Button onClick={handleExportToExcel} size="md" variant="outline" disabled={filteredSubPharmacies.length === 0}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 mr-2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Exportar a Excel
              </Button>
              <Button onClick={openBulkModal} size="md" variant="outline">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Carga Masiva
              </Button>
              <Button onClick={openAddModal} size="md">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar Sucursal
              </Button>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2">País *</Label>
              <Select
                options={countryFilterOptions}
                placeholder="Selecciona un país"
                onChange={(value) => setCountryFilter(value)}
                value={countryFilter}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2">Farmacia *</Label>
              <Select
                options={pharmacyFilterOptions}
                placeholder="Selecciona una farmacia"
                onChange={(value) => setPharmacyFilter(value)}
                value={pharmacyFilter}
                disabled={!countryFilter || pharmacies.length === 0}
              />
            </div>
            {hasActiveFilters && (
              <div className="flex items-center gap-2 self-end pb-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {subPharmacies.length} sucursal{subPharmacies.length !== 1 ? 'es' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Buscador */}
        {hasActiveFilters && subPharmacies.length > 0 && (
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
                placeholder="Buscar por nombre, dirección, teléfono, email, administrador..."
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
                Mostrando {filteredSubPharmacies.length} de {subPharmacies.length} sucursales
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
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Sucursal</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Farmacia Matriz</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Distribuidor</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Contacto</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Administrador</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Creado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {paginatedSubPharmacies.map((subPharmacy) => (
                  <TableRow key={subPharmacy.id}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{subPharmacy.id}</TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{subPharmacy.commercial_name}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{subPharmacy.pharmacy.commercial_name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{subPharmacy.pharmacy.legal_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {subPharmacy.default_distributor?.business_name || 'N/A'}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{subPharmacy.email}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{subPharmacy.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {subPharmacy.administrator_name}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        subPharmacy.status
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {subPharmacy.status ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {formatDate(subPharmacy.created_at)}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(subPharmacy.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            subPharmacy.status
                              ? "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                              : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          }`}
                          title={subPharmacy.status ? "Desactivar" : "Activar"}
                        >
                          {subPharmacy.status ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => openDelete(subPharmacy)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!hasActiveFilters && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">Selecciona filtros</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Selecciona un país y una farmacia para ver sus sucursales.
                </p>
              </div>
            )}

            {hasActiveFilters && subPharmacies.length > 0 && paginatedSubPharmacies.length === 0 && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">No se encontraron resultados</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No se encontraron sucursales que coincidan con "{searchQuery}".
                </p>
              </div>
            )}

            {hasActiveFilters && subPharmacies.length === 0 && !isLoading && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">No hay sucursales</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Esta farmacia no tiene sucursales registradas.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Paginación */}
        {filteredSubPharmacies.length > 0 && (
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
                    <span className="font-medium">{Math.min(endIndex, filteredSubPharmacies.length)}</span> de{' '}
                    <span className="font-medium">{filteredSubPharmacies.length}</span> resultados
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

      {/* Modales */}
      {selectedPharmacy && (
        <>
          <AddSubPharmacyModal
            isOpen={isAddModalOpen}
            onClose={closeAddModal}
            onSuccess={handleModalSuccess}
            pharmacyId={selectedPharmacy.id}
            countryId={selectedPharmacy.country_id}
          />
          <BulkUploadSubPharmacyModal
            isOpen={isBulkModalOpen}
            onClose={closeBulkModal}
            onSuccess={handleModalSuccess}
            pharmacyId={selectedPharmacy.id}
            pharmacyName={selectedPharmacy.commercial_name}
            countryId={selectedPharmacy.country_id}
          />
        </>
      )}

      {/* Modal: Eliminar Sucursal */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDelete} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Eliminar Sucursal</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que deseas eliminar la sucursal <strong>{subPharmacyToDelete?.commercial_name}</strong>?
            </p>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={handleCloseDelete}>Cancelar</Button>
            <Button
              size="sm"
              onClick={handleDeleteSubPharmacy}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
