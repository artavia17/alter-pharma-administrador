import { useEffect, useState, useMemo } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
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
import { getCountries, createCountry, updateCountry, toggleCountryStatus } from "../../../services/protected/countries.services";
import { CountryData } from "../../../types/services/protected/countries.types";
import { formatDate } from "../../../helper/formatData";
import * as XLSX from 'xlsx';

export default function PaisesPage() {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);

  // Search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form fields
  const [countryName, setCountryName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [identificationMinLength, setIdentificationMinLength] = useState("");
  const [identificationMaxLength, setIdentificationMaxLength] = useState("");
  const [phoneMinLength, setPhoneMinLength] = useState("");
  const [phoneMaxLength, setPhoneMaxLength] = useState("");

  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modals
  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();

  useEffect(() => {
    loadCountries();
  }, []);

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

  const handleAddCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validación: min no puede ser mayor que max
    const idMinLen = parseInt(identificationMinLength);
    const idMaxLen = parseInt(identificationMaxLength);
    const phoneMin = parseInt(phoneMinLength);
    const phoneMax = parseInt(phoneMaxLength);

    if (idMinLen > idMaxLen) {
      setErrors({ general: "La longitud mínima de identificación no puede ser mayor que la máxima" });
      setIsLoading(false);
      return;
    }

    if (phoneMin > phoneMax) {
      setErrors({ general: "La longitud mínima de teléfono no puede ser mayor que la máxima" });
      setIsLoading(false);
      return;
    }

    try {
      const response = await createCountry(
        countryName,
        countryCode,
        phoneCode,
        idMinLen,
        idMaxLen,
        phoneMin,
        phoneMax
      );
      if (response.status === 200 || response.status === 201) {
        await loadCountries();
        setCountryName("");
        setCountryCode("");
        setPhoneCode("");
        setIdentificationMinLength("");
        setIdentificationMaxLength("");
        setPhoneMinLength("");
        setPhoneMaxLength("");
        closeAddModal();
      }
    } catch (error: any) {
      console.error("Error creando país:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al crear el país" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountry) return;

    setIsLoading(true);
    setErrors({});

    // Validación: min no puede ser mayor que max
    const idMinLen = parseInt(identificationMinLength);
    const idMaxLen = parseInt(identificationMaxLength);
    const phoneMin = parseInt(phoneMinLength);
    const phoneMax = parseInt(phoneMaxLength);

    if (idMinLen > idMaxLen) {
      setErrors({ general: "La longitud mínima de identificación no puede ser mayor que la máxima" });
      setIsLoading(false);
      return;
    }

    if (phoneMin > phoneMax) {
      setErrors({ general: "La longitud mínima de teléfono no puede ser mayor que la máxima" });
      setIsLoading(false);
      return;
    }

    try {
      const response = await updateCountry(
        selectedCountry.id,
        countryName,
        countryCode,
        phoneCode,
        idMinLen,
        idMaxLen,
        phoneMin,
        phoneMax
      );
      if (response.status === 200) {
        await loadCountries();
        setCountryName("");
        setCountryCode("");
        setPhoneCode("");
        setIdentificationMinLength("");
        setIdentificationMaxLength("");
        setPhoneMinLength("");
        setPhoneMaxLength("");
        setSelectedCountry(null);
        closeEditModal();
      }
    } catch (error: any) {
      console.error("Error editando país:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al actualizar el país" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (country: CountryData) => {
    try {
      await toggleCountryStatus(country.id);
      await loadCountries();
    } catch (error) {
      console.error("Error cambiando ciudad del país:", error);
    }
  };

  const handleCloseAdd = () => {
    setCountryName("");
    setCountryCode("");
    setPhoneCode("");
    setIdentificationMinLength("");
    setIdentificationMaxLength("");
    setPhoneMinLength("");
    setPhoneMaxLength("");
    setSelectedCountry(null);
    setErrors({});
    closeAddModal();
  };

  const openEdit = (country: CountryData) => {
    setSelectedCountry(country);
    setCountryName(country.name);
    setCountryCode(country.code);
    setPhoneCode(country.phone_code);
    setIdentificationMinLength(country.identification_min_length.toString());
    setIdentificationMaxLength(country.identification_max_length.toString());
    setPhoneMinLength(country.phone_min_length.toString());
    setPhoneMaxLength(country.phone_max_length.toString());
    openEditModal();
  };

  const handleCloseEdit = () => {
    setCountryName("");
    setCountryCode("");
    setPhoneCode("");
    setIdentificationMinLength("");
    setIdentificationMaxLength("");
    setPhoneMinLength("");
    setPhoneMaxLength("");
    setSelectedCountry(null);
    setErrors({});
    closeEditModal();
  };

  // Filtrar países por búsqueda
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countries;

    const query = searchQuery.toLowerCase();
    return countries.filter(country =>
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query) ||
      country.phone_code.toLowerCase().includes(query)
    );
  }, [countries, searchQuery]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredCountries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCountries = filteredCountries.slice(startIndex, endIndex);

  // Resetear a la página 1 cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  // Función para exportar a Excel
  const handleExportToExcel = () => {
    // Preparar los datos para exportar
    const dataToExport = filteredCountries.map(country => ({
      'ID': country.id,
      'País': country.name,
      'Código': country.code,
      'Código Telefónico': `+${country.phone_code}`,
      'Long. Mín. Identificación': country.identification_min_length,
      'Long. Máx. Identificación': country.identification_max_length,
      'Long. Mín. Teléfono': country.phone_min_length,
      'Long. Máx. Teléfono': country.phone_max_length,
      'Cantidad de Ciudades': country.states?.length || 0,
      'Estado': country.status ? 'Activo' : 'Inactivo',
      'Fecha de Creación': formatDate(country.created_at)
    }));

    // Crear libro de trabajo
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Países');

    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 5 },   // ID
      { wch: 25 },  // País
      { wch: 10 },  // Código
      { wch: 18 },  // Código Telefónico
      { wch: 25 },  // Long. Mín. Identificación
      { wch: 25 },  // Long. Máx. Identificación
      { wch: 20 },  // Long. Mín. Teléfono
      { wch: 20 },  // Long. Máx. Teléfono
      { wch: 20 },  // Cantidad de Ciudades
      { wch: 12 },  // Estado
      { wch: 18 }   // Fecha de Creación
    ];
    worksheet['!cols'] = columnWidths;

    // Generar archivo Excel
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Paises_${timestamp}.xlsx`);
  };

  return (
    <>
      <PageMeta
        title="Países - Localización | Alter Pharma"
        description="Gestión de países en el sistema"
      />
      <PageBreadcrumb pageTitle="Países" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Gestión de Países
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra los países y sus códigos en el sistema
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleExportToExcel} size="md" variant="outline" disabled={filteredCountries.length === 0}>
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
              Agregar País
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
              placeholder="Buscar por nombre, código de país o código telefónico..."
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
              Mostrando {filteredCountries.length} de {countries.length} países
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">País</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Código</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Cód. Tel.</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Long. Identificación</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Long. Teléfono</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ciudades</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Creado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {paginatedCountries.map((country) => (
                  <TableRow key={country.id}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{country.id}</TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{country.name}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {country.code}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      +{country.phone_code}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {country.identification_min_length} - {country.identification_max_length}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {country.phone_min_length} - {country.phone_max_length}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {country.states?.length || 0} ciudad(s)
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Switch
                        label={country.status ? "Activo" : "Inactivo"}
                        defaultChecked={country.status}
                        onChange={() => handleToggleStatus(country)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(country.created_at)}</TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(country)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20" title="Editar país">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {paginatedCountries.length === 0 && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">
                  {searchQuery ? "No se encontraron resultados" : "No hay países"}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery
                    ? `No se encontraron países que coincidan con "${searchQuery}".`
                    : "Comienza agregando un nuevo país al sistema."
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Paginación */}
        {filteredCountries.length > 0 && (
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
                    <span className="font-medium">{Math.min(endIndex, filteredCountries.length)}</span> de{' '}
                    <span className="font-medium">{filteredCountries.length}</span> resultados
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

      {/* Modal: Agregar País */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAdd} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Agregar Nuevo País</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completa los datos para crear un nuevo país</p>
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
          <form onSubmit={handleAddCountry} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4">
              <div>
                <Label>Nombre del país</Label>
                <Input
                  type="text"
                  value={countryName}
                  onChange={(e) => setCountryName(e.target.value)}
                  placeholder="Ej: República Dominicana"
                />
              </div>
              <div>
                <Label>Código del país</Label>
                <Input
                  type="text"
                  value={countryCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (value.length <= 2) {
                      setCountryCode(value);
                    }
                  }}
                  placeholder="Ej: DO"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Código de 2 letras (ISO 3166-1 alpha-2)
                </p>
              </div>
              <div>
                <Label>Código telefónico</Label>
                <Input
                  type="text"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  placeholder="Ej: 1809"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Long. mín. identificación</Label>
                  <Input
                    type="number"
                    value={identificationMinLength}
                    onChange={(e) => setIdentificationMinLength(e.target.value)}
                    placeholder="Ej: 11"
                    min="1"
                  />
                </div>
                <div>
                  <Label>Long. máx. identificación</Label>
                  <Input
                    type="number"
                    value={identificationMaxLength}
                    onChange={(e) => setIdentificationMaxLength(e.target.value)}
                    placeholder="Ej: 13"
                    min="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Long. mín. teléfono</Label>
                  <Input
                    type="number"
                    value={phoneMinLength}
                    onChange={(e) => setPhoneMinLength(e.target.value)}
                    placeholder="Ej: 10"
                    min="1"
                  />
                </div>
                <div>
                  <Label>Long. máx. teléfono</Label>
                  <Input
                    type="number"
                    value={phoneMaxLength}
                    onChange={(e) => setPhoneMaxLength(e.target.value)}
                    placeholder="Ej: 10"
                    min="1"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseAdd}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !countryName || !countryCode || !phoneCode || !identificationMinLength || !identificationMaxLength || !phoneMinLength || !phoneMaxLength}>{isLoading ? 'Guardando...' : 'Guardar País'}</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Editar País */}
      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Editar País</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Modifica los datos del país seleccionado</p>
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
          <form onSubmit={handleEditCountry} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4">
              <div>
                <Label>Nombre del país</Label>
                <Input
                  type="text"
                  value={countryName}
                  onChange={(e) => setCountryName(e.target.value)}
                  placeholder="Ej: República Dominicana"
                />
              </div>
              <div>
                <Label>Código del país</Label>
                <Input
                  type="text"
                  value={countryCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (value.length <= 2) {
                      setCountryCode(value);
                    }
                  }}
                  placeholder="Ej: DO"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Código de 2 letras (ISO 3166-1 alpha-2)
                </p>
              </div>
              <div>
                <Label>Código telefónico</Label>
                <Input
                  type="text"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  placeholder="Ej: 1809"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Long. mín. identificación</Label>
                  <Input
                    type="number"
                    value={identificationMinLength}
                    onChange={(e) => setIdentificationMinLength(e.target.value)}
                    placeholder="Ej: 11"
                    min="1"
                  />
                </div>
                <div>
                  <Label>Long. máx. identificación</Label>
                  <Input
                    type="number"
                    value={identificationMaxLength}
                    onChange={(e) => setIdentificationMaxLength(e.target.value)}
                    placeholder="Ej: 13"
                    min="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Long. mín. teléfono</Label>
                  <Input
                    type="number"
                    value={phoneMinLength}
                    onChange={(e) => setPhoneMinLength(e.target.value)}
                    placeholder="Ej: 10"
                    min="1"
                  />
                </div>
                <div>
                  <Label>Long. máx. teléfono</Label>
                  <Input
                    type="number"
                    value={phoneMaxLength}
                    onChange={(e) => setPhoneMaxLength(e.target.value)}
                    placeholder="Ej: 10"
                    min="1"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseEdit}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !countryName || !countryCode || !phoneCode || !identificationMinLength || !identificationMaxLength || !phoneMinLength || !phoneMaxLength}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
