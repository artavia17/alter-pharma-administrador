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
import { getDoctors, createDoctor, updateDoctor, toggleDoctorStatus, deleteDoctor } from "../../../services/protected/doctors.services";
import { getCountries } from "../../../services/protected/countries.services";
import { getSpecialties } from "../../../services/protected/specialties.services";
import { DoctorData } from "../../../types/services/protected/doctors.types";
import { CountryData } from "../../../types/services/protected/countries.types";
import { SpecialtyData } from "../../../types/services/protected/specialties.types";
import { formatDate } from "../../../helper/formatData";
import BulkUploadDoctorModal from "../../../components/doctors/BulkUploadDoctorModal";
import * as XLSX from 'xlsx';

export default function DoctoresPage() {
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorData | null>(null);

  // Filtros
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("");

  // Search and pagination for doctors table
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form fields
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [doctorLicense, setDoctorLicense] = useState("");
  const [doctorBio, setDoctorBio] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<number[]>([]);
  const [phonePrefix, setPhonePrefix] = useState("");
  const [phoneMinLength, setPhoneMinLength] = useState<number>(0);
  const [phoneMaxLength, setPhoneMaxLength] = useState<number>(0);

  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Búsqueda y paginación de especialidades
  const [specialtySearchQuery, setSpecialtySearchQuery] = useState("");
  const [specialtyCurrentPage, setSpecialtyCurrentPage] = useState(1);
  const specialtiesPerPage = 5;

  // Modals
  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isDetailOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();
  const { isOpen: isBulkUploadOpen, openModal: openBulkUploadModal, closeModal: closeBulkUploadModal } = useModal();

  useEffect(() => {
    loadDoctors();
    loadCountries();
    loadSpecialties();
  }, []);

  const loadDoctors = async () => {
    try {
      const response = await getDoctors();
      if (response.status === 200 && Array.isArray(response.data)) {
        setDoctors(response.data);
      }
    } catch (error) {
      console.error("Error cargando doctores:", error);
    }
  };

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

  const loadSpecialties = async () => {
    try {
      const response = await getSpecialties();
      if (response.status === 200 && Array.isArray(response.data)) {
        setSpecialties(response.data);
      }
    } catch (error) {
      console.error("Error cargando especialidades:", error);
    }
  };

  // Filtrar doctores
  const filteredDoctors = useMemo(() => {
    let filtered = doctors;

    if (countryFilter) {
      filtered = filtered.filter(doctor => Number(doctor.country_id) === Number(countryFilter));
    }

    if (specialtyFilter) {
      filtered = filtered.filter(doctor =>
        doctor.specialties.some(s => Number(s.id) === Number(specialtyFilter))
      );
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(query) ||
        doctor.email?.toLowerCase().includes(query) ||
        doctor.phone?.toLowerCase().includes(query) ||
        doctor.license_number?.toLowerCase().includes(query) ||
        doctor.country.name.toLowerCase().includes(query) ||
        doctor.specialties.some(s => s.name.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [doctors, countryFilter, specialtyFilter, searchQuery]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDoctors = filteredDoctors.slice(startIndex, endIndex);

  // Resetear a la página 1 cuando cambia la búsqueda o los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, countryFilter, specialtyFilter]);

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

  // Opciones para selects de filtros
  const countryFilterOptions = useMemo(() => {
    return [
      { value: "", label: "Todos los países" },
      ...countries
        .filter(country => country.status)
        .map(country => ({
          value: country.id.toString(),
          label: country.name
        }))
    ];
  }, [countries]);

  const specialtyFilterOptions = useMemo(() => {
    return [
      { value: "", label: "Todas las especialidades" },
      ...specialties
        .filter(specialty => specialty.status)
        .map(specialty => ({
          value: specialty.id.toString(),
          label: specialty.name
        }))
    ];
  }, [specialties]);

  // Opciones para selects de formulario
  const countryOptions = useMemo(() => {
    return countries
      .filter(country => country.status)
      .map(country => ({
        value: country.id.toString(),
        label: country.name
      }));
  }, [countries]);

  const handleCountryChange = (countryId: string) => {
    const id = parseInt(countryId);
    setSelectedCountryId(id);

    // Encontrar el país seleccionado y establecer el prefijo
    const country = countries.find(c => Number(c.id) === Number(id));
    if (country) {
      const prefix = `+${country.phone_code} `;
      setPhonePrefix(prefix);
      setPhoneMinLength(country.phone_min_length);
      setPhoneMaxLength(country.phone_max_length);
      setDoctorPhone(prefix); // Inicializar teléfono con el prefijo
    } else {
      setPhonePrefix("");
      setPhoneMinLength(0);
      setPhoneMaxLength(0);
      setDoctorPhone("");
    }
  };

  const handlePhoneChange = (value: string) => {
    console.log('handlePhoneChange called with:', value);

    // Obtener el prefijo del país actual
    if (!selectedCountryId) {
      console.log('No selectedCountryId');
      return;
    }

    console.log('Selected country ID:', selectedCountryId, typeof selectedCountryId);
    console.log('Countries array:', countries);
    console.log('Countries length:', countries.length);

    // Buscar por ID, asegurando comparación numérica
    const country = countries.find(c => Number(c.id) === Number(selectedCountryId));
    if (!country) {
      console.log('Country not found for id:', selectedCountryId);
      console.log('Available country IDs:', countries.map(c => ({ id: c.id, type: typeof c.id })));
      return;
    }

    const prefix = `+${country.phone_code} `;
    console.log('Calculated prefix:', prefix);
    console.log('Value starts with prefix?', value.startsWith(prefix));

    // Si el usuario intenta borrar el prefijo, no lo permitimos
    if (!value.startsWith(prefix)) {
      console.log('Value does not start with prefix, returning');
      return;
    }

    // Solo permitir números después del prefijo
    const afterPrefix = value.substring(prefix.length);
    const onlyNumbers = afterPrefix.replace(/\D/g, '');

    console.log('After prefix:', afterPrefix);
    console.log('Only numbers:', onlyNumbers);
    console.log('Max length:', country.phone_max_length);
    console.log('Within limit?', onlyNumbers.length <= country.phone_max_length);

    // Limitar según la longitud máxima
    if (onlyNumbers.length <= country.phone_max_length) {
      const newPhone = prefix + onlyNumbers;
      console.log('Setting phone to:', newPhone);
      setDoctorPhone(newPhone);
    }
  };

  const handleLicenseChange = (value: string) => {
    // Solo permitir letras y números (sin espacios ni caracteres especiales) y limitar a 100 caracteres
    const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanValue.length <= 100) {
      setDoctorLicense(cleanValue);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountryId || selectedSpecialties.length === 0) return;

    setIsLoading(true);
    setErrors({});

    // Determinar si el teléfono tiene contenido real o solo el prefijo
    let finalPhone = "";
    if (doctorPhone) {
      const country = countries.find(c => Number(c.id) === Number(selectedCountryId));
      if (country) {
        const prefix = `+${country.phone_code} `;
        const phoneDigits = doctorPhone.substring(prefix.length).trim();

        // Si hay dígitos después del prefijo, validar
        if (phoneDigits.length > 0) {
          const minLength = country.phone_min_length;
          const maxLength = country.phone_max_length;

          if (phoneDigits.length < minLength || phoneDigits.length > maxLength) {
            setErrors({
              general: `El teléfono debe tener entre ${minLength} y ${maxLength} dígitos`
            });
            setIsLoading(false);
            return;
          }
          finalPhone = doctorPhone; // Solo asignar si tiene dígitos válidos
        }
        // Si no hay dígitos, finalPhone queda como "" (vacío)
      }
    }

    try {
      const params = {
        name: doctorName,
        country_id: selectedCountryId,
        specialties: selectedSpecialties,
        ...(doctorEmail && { email: doctorEmail }),
        ...(finalPhone && { phone: finalPhone }),
        ...(doctorLicense && { license_number: doctorLicense }),
        ...(doctorBio && { bio: doctorBio }),
      };

      const response = await createDoctor(params);
      if (response.status === 200 || response.status === 201) {
        await loadDoctors();
        resetForm();
        closeAddModal();
      }
    } catch (error: any) {
      console.error("Error creando doctor:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al crear el doctor" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedCountryId || selectedSpecialties.length === 0) return;

    setIsLoading(true);
    setErrors({});

    // Determinar si el teléfono tiene contenido real o solo el prefijo
    let finalPhone = "";
    if (doctorPhone) {
      const country = countries.find(c => Number(c.id) === Number(selectedCountryId));
      if (country) {
        const prefix = `+${country.phone_code} `;
        const phoneDigits = doctorPhone.substring(prefix.length).trim();

        // Si hay dígitos después del prefijo, validar
        if (phoneDigits.length > 0) {
          const minLength = country.phone_min_length;
          const maxLength = country.phone_max_length;

          if (phoneDigits.length < minLength || phoneDigits.length > maxLength) {
            setErrors({
              general: `El teléfono debe tener entre ${minLength} y ${maxLength} dígitos`
            });
            setIsLoading(false);
            return;
          }
          finalPhone = doctorPhone; // Solo asignar si tiene dígitos válidos
        }
        // Si no hay dígitos, finalPhone queda como "" (vacío)
      }
    }

    try {
      const params = {
        name: doctorName,
        country_id: selectedCountryId,
        specialties: selectedSpecialties,
        ...(doctorEmail && { email: doctorEmail }),
        ...(finalPhone && { phone: finalPhone }),
        ...(doctorLicense && { license_number: doctorLicense }),
        ...(doctorBio && { bio: doctorBio }),
      };

      const response = await updateDoctor(selectedDoctor.id, params);
      if (response.status === 200) {
        await loadDoctors();
        resetForm();
        setSelectedDoctor(null);
        closeEditModal();
      }
    } catch (error: any) {
      console.error("Error editando doctor:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al actualizar el doctor" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (doctor: DoctorData) => {
    try {
      await toggleDoctorStatus(doctor.id);
      await loadDoctors();
    } catch (error) {
      console.error("Error cambiando ciudad del doctor:", error);
    }
  };

  const handleDeleteDoctor = async () => {
    if (!selectedDoctor) return;
    setIsLoading(true);

    try {
      await deleteDoctor(selectedDoctor.id);
      await loadDoctors();
      setSelectedDoctor(null);
      closeDeleteModal();
    } catch (error) {
      console.error("Error eliminando doctor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setDoctorName("");
    setDoctorEmail("");
    setDoctorPhone("");
    setDoctorLicense("");
    setDoctorBio("");
    setSelectedCountryId(null);
    setSelectedSpecialties([]);
    setPhonePrefix("");
    setPhoneMinLength(0);
    setPhoneMaxLength(0);
    setErrors({});
  };

  const handleCloseAdd = () => {
    resetForm();
    setSelectedDoctor(null);
    resetSpecialtySearch();
    closeAddModal();
  };

  const openEdit = (doctor: DoctorData) => {
    setSelectedDoctor(doctor);
    setDoctorName(doctor.name);
    setDoctorEmail(doctor.email || "");
    setDoctorLicense(doctor.license_number || "");
    setDoctorBio(doctor.bio || "");
    setSelectedCountryId(doctor.country_id);
    setSelectedSpecialties(doctor.specialties.map(s => s.id));

    // Establecer el prefijo del teléfono basado en el país del doctor
    const country = countries.find(c => Number(c.id) === Number(doctor.country_id));
    if (country) {
      const prefix = `+${country.phone_code} `;
      setPhonePrefix(prefix);
      setPhoneMinLength(country.phone_min_length);
      setPhoneMaxLength(country.phone_max_length);
      setDoctorPhone(doctor.phone || prefix);
    } else {
      setPhonePrefix("");
      setPhoneMinLength(0);
      setPhoneMaxLength(0);
      setDoctorPhone(doctor.phone || "");
    }

    openEditModal();
  };

  const handleCloseEdit = () => {
    resetForm();
    setSelectedDoctor(null);
    resetSpecialtySearch();
    closeEditModal();
  };

  const openDelete = (doctor: DoctorData) => {
    setSelectedDoctor(doctor);
    openDeleteModal();
  };

  const handleCloseDelete = () => {
    setSelectedDoctor(null);
    closeDeleteModal();
  };

  const openDetail = (doctor: DoctorData) => {
    setSelectedDoctor(doctor);
    openDetailModal();
  };

  const handleCloseDetail = () => {
    setSelectedDoctor(null);
    closeDetailModal();
  };

  const toggleSpecialty = (specialtyId: number) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialtyId)
        ? prev.filter(id => id !== specialtyId)
        : [...prev, specialtyId]
    );
  };

  // Filtrar especialidades por búsqueda
  const filteredSpecialties = useMemo(() => {
    const activeSpecialties = specialties.filter(s => s.status);

    if (!specialtySearchQuery.trim()) return activeSpecialties;

    const query = specialtySearchQuery.toLowerCase();
    return activeSpecialties.filter(specialty =>
      specialty.name.toLowerCase().includes(query)
    );
  }, [specialties, specialtySearchQuery]);

  // Calcular paginación de especialidades
  const totalSpecialtyPages = Math.ceil(filteredSpecialties.length / specialtiesPerPage);
  const specialtyStartIndex = (specialtyCurrentPage - 1) * specialtiesPerPage;
  const specialtyEndIndex = specialtyStartIndex + specialtiesPerPage;
  const paginatedSpecialties = filteredSpecialties.slice(specialtyStartIndex, specialtyEndIndex);

  // Resetear página cuando cambia la búsqueda
  useEffect(() => {
    setSpecialtyCurrentPage(1);
  }, [specialtySearchQuery]);

  // Resetear búsqueda y paginación al cerrar modales
  const resetSpecialtySearch = () => {
    setSpecialtySearchQuery("");
    setSpecialtyCurrentPage(1);
  };

  const hasActiveFilters = countryFilter || specialtyFilter;

  // Función para exportar a Excel
  const handleExportToExcel = () => {
    // Preparar los datos para exportar
    const dataToExport = filteredDoctors.map(doctor => ({
      'ID': doctor.id,
      'Nombre': doctor.name,
      'Email': doctor.email || 'N/A',
      'Teléfono': doctor.phone || 'N/A',
      'Número de Licencia': doctor.license_number || 'N/A',
      'País': doctor.country.name,
      'Código de País': doctor.country.code,
      'Especialidades': doctor.specialties.map(s => s.name).join(', '),
      'Estado': doctor.status ? 'Activo' : 'Inactivo',
      'Fecha de Creación': formatDate(doctor.created_at)
    }));

    // Crear libro de trabajo
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Doctores');

    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 5 },   // ID
      { wch: 30 },  // Nombre
      { wch: 30 },  // Email
      { wch: 15 },  // Teléfono
      { wch: 15 },  // Licencia
      { wch: 25 },  // País
      { wch: 18 },  // Código de País
      { wch: 40 },  // Especialidades
      { wch: 12 },  // Estado
      { wch: 18 }   // Fecha de Creación
    ];
    worksheet['!cols'] = columnWidths;

    // Generar archivo Excel
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Doctores_${timestamp}.xlsx`);
  };

  return (
    <>
      <PageMeta
        title="Doctores | Alter Pharma"
        description="Gestión de doctores en el sistema"
      />
      <PageBreadcrumb pageTitle="Doctores" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Gestión de Doctores
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra los doctores y sus especialidades
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleExportToExcel} size="md" variant="outline" disabled={filteredDoctors.length === 0}>
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
              Agregar Doctor
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
              placeholder="Buscar por nombre, email, teléfono, licencia, país o especialidad..."
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
              Mostrando {filteredDoctors.length} de {doctors.length} doctores
            </p>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Label className="whitespace-nowrap">Filtrar por:</Label>
            <div className="flex-1 min-w-[200px]">
              <Select
                options={countryFilterOptions}
                placeholder="País"
                onChange={(value) => setCountryFilter(value)}
                value={countryFilter}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select
                options={specialtyFilterOptions}
                placeholder="Especialidad"
                onChange={(value) => setSpecialtyFilter(value)}
                value={specialtyFilter}
              />
            </div>
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredDoctors.length} de {doctors.length} doctores
                </span>
                <button
                  onClick={() => {
                    setCountryFilter("");
                    setSpecialtyFilter("");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Doctor</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">País</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Especialidades</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ciudad</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {paginatedDoctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{doctor.id}</TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{doctor.name}</span>
                        {doctor.email && <span className="block text-xs text-gray-500 dark:text-gray-400">{doctor.email}</span>}
                        {doctor.phone && <span className="block text-xs text-gray-500 dark:text-gray-400">{doctor.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-800 dark:text-white/90">{doctor.country.name}</span>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {doctor.country.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="flex flex-wrap gap-1">
                        {doctor.specialties.map(specialty => (
                          <span
                            key={specialty.id}
                            className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                          >
                            {specialty.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Switch
                        label={doctor.status ? "Activo" : "Inactivo"}
                        defaultChecked={doctor.status}
                        onChange={() => handleToggleStatus(doctor)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openDetail(doctor)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg dark:text-purple-400 dark:hover:bg-purple-900/20" title="Ver detalles">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </button>
                        <button onClick={() => openEdit(doctor)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20" title="Editar doctor">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button onClick={() => openDelete(doctor)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20" title="Eliminar doctor">
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

            {paginatedDoctors.length === 0 && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">
                  {searchQuery || hasActiveFilters ? "No se encontraron resultados" : "No hay doctores"}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery
                    ? `No se encontraron doctores que coincidan con "${searchQuery}".`
                    : hasActiveFilters
                      ? "No se encontraron doctores con los filtros seleccionados."
                      : "Comienza agregando un nuevo doctor."
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Paginación */}
        {filteredDoctors.length > 0 && (
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
                    <span className="font-medium">{Math.min(endIndex, filteredDoctors.length)}</span> de{' '}
                    <span className="font-medium">{filteredDoctors.length}</span> resultados
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
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
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

      {/* Modal: Agregar Doctor */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAdd} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Agregar Nuevo Doctor</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completa los datos para crear un nuevo doctor</p>
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
          <form onSubmit={handleAddDoctor} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4 max-h-[500px] overflow-y-auto">
              <div>
                <Label>Nombre completo *</Label>
                <Input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Ej: Dr. Carlos Rodríguez"
                />
              </div>
              <div>
                <Label>País *</Label>
                <Select
                  options={countryOptions}
                  placeholder="Selecciona un país"
                  onChange={handleCountryChange}
                  defaultValue=""
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={doctorEmail}
                  onChange={(e) => setDoctorEmail(e.target.value)}
                  placeholder="Ej: doctor@ejemplo.com"
                />
              </div>
              <div>
                <Label>Teléfono (opcional)</Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={doctorPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder={phonePrefix ? `${phonePrefix}0000000` : "Selecciona un país primero"}
                    disabled={!selectedCountryId}
                  />
                  {doctorPhone && selectedCountryId && (
                    <button
                      type="button"
                      onClick={() => setDoctorPhone("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                      title="Limpiar teléfono"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {phoneMinLength > 0 && phoneMaxLength > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Debe tener entre {phoneMinLength} y {phoneMaxLength} dígitos
                  </p>
                )}
              </div>
              <div>
                <Label>Número de licencia</Label>
                <Input
                  type="text"
                  value={doctorLicense}
                  onChange={(e) => handleLicenseChange(e.target.value)}
                  placeholder="Ej: DO12345"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Solo letras y números, máximo 100 caracteres
                </p>
              </div>
              <div>
                <Label>Especialidades * (Selecciona al menos una)</Label>

                {/* Buscador de especialidades */}
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={specialtySearchQuery}
                    onChange={(e) => setSpecialtySearchQuery(e.target.value)}
                    placeholder="Buscar especialidad..."
                    className="block w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-white/[0.05] rounded-lg bg-white dark:bg-white/[0.03] text-gray-800 dark:text-white/90 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  {specialtySearchQuery && (
                    <button
                      onClick={() => setSpecialtySearchQuery("")}
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Lista de especialidades */}
                <div className="space-y-2 mt-2 border-t border-b border-gray-200 dark:border-white/[0.05] py-2">
                  {paginatedSpecialties.map((specialty) => (
                    <label key={specialty.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSpecialties.includes(specialty.id)}
                        onChange={() => toggleSpecialty(specialty.id)}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">{specialty.name}</span>
                    </label>
                  ))}
                  {paginatedSpecialties.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                      No se encontraron especialidades
                    </p>
                  )}
                </div>

                {/* Paginación de especialidades */}
                {filteredSpecialties.length > specialtiesPerPage && (
                  <div className="flex items-center justify-between mt-2 px-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Mostrando {specialtyStartIndex + 1}-{Math.min(specialtyEndIndex, filteredSpecialties.length)} de {filteredSpecialties.length}
                    </p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setSpecialtyCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={specialtyCurrentPage === 1}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-white/[0.05] rounded bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <span className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400">
                        {specialtyCurrentPage} / {totalSpecialtyPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSpecialtyCurrentPage(prev => Math.min(prev + 1, totalSpecialtyPages))}
                        disabled={specialtyCurrentPage === totalSpecialtyPages}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-white/[0.05] rounded bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}

                {/* Contador de seleccionados */}
                {selectedSpecialties.length > 0 && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                    {selectedSpecialties.length} especialidad{selectedSpecialties.length !== 1 ? 'es' : ''} seleccionada{selectedSpecialties.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseAdd}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !doctorName || !selectedCountryId || selectedSpecialties.length === 0}>
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Editar Doctor */}
      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Editar Doctor</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Modifica los datos del doctor seleccionado</p>
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
          <form onSubmit={handleEditDoctor} className="flex flex-col">
            <div className="space-y-4 px-2 max-h-[500px] overflow-y-auto border-t border-b border-gray-200 dark:border-white/[0.05] pt-4 pb-6">
              <div>
                <Label>Nombre completo *</Label>
                <Input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Ej: Dr. Carlos Rodríguez"
                />
              </div>
              <div>
                <Label>País *</Label>
                <Select
                  options={countryOptions}
                  placeholder="Selecciona un país"
                  onChange={handleCountryChange}
                  value={selectedCountryId?.toString() || ""}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={doctorEmail}
                  onChange={(e) => setDoctorEmail(e.target.value)}
                  placeholder="Ej: doctor@ejemplo.com"
                />
              </div>
              <div>
                <Label>Teléfono (opcional)</Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={doctorPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder={phonePrefix ? `${phonePrefix}0000000` : "Selecciona un país primero"}
                    disabled={!selectedCountryId}
                  />
                  {doctorPhone && selectedCountryId && (
                    <button
                      type="button"
                      onClick={() => setDoctorPhone("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                      title="Limpiar teléfono"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {phoneMinLength > 0 && phoneMaxLength > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Debe tener entre {phoneMinLength} y {phoneMaxLength} dígitos
                  </p>
                )}
              </div>
              <div>
                <Label>Número de licencia</Label>
                <Input
                  type="text"
                  value={doctorLicense}
                  onChange={(e) => handleLicenseChange(e.target.value)}
                  placeholder="Ej: DO12345"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Solo letras y números, máximo 100 caracteres
                </p>
              </div>
              <div>
                <Label>Especialidades * (Selecciona al menos una)</Label>

                {/* Buscador de especialidades */}
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={specialtySearchQuery}
                    onChange={(e) => setSpecialtySearchQuery(e.target.value)}
                    placeholder="Buscar especialidad..."
                    className="block w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-white/[0.05] rounded-lg bg-white dark:bg-white/[0.03] text-gray-800 dark:text-white/90 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  {specialtySearchQuery && (
                    <button
                      onClick={() => setSpecialtySearchQuery("")}
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Lista de especialidades */}
                <div className="space-y-2 mt-2 border-t border-b border-gray-200 dark:border-white/[0.05] py-2">
                  {paginatedSpecialties.map((specialty) => (
                    <label key={specialty.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSpecialties.includes(specialty.id)}
                        onChange={() => toggleSpecialty(specialty.id)}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">{specialty.name}</span>
                    </label>
                  ))}
                  {paginatedSpecialties.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                      No se encontraron especialidades
                    </p>
                  )}
                </div>

                {/* Paginación de especialidades */}
                {filteredSpecialties.length > specialtiesPerPage && (
                  <div className="flex items-center justify-between mt-2 px-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Mostrando {specialtyStartIndex + 1}-{Math.min(specialtyEndIndex, filteredSpecialties.length)} de {filteredSpecialties.length}
                    </p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setSpecialtyCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={specialtyCurrentPage === 1}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-white/[0.05] rounded bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <span className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400">
                        {specialtyCurrentPage} / {totalSpecialtyPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSpecialtyCurrentPage(prev => Math.min(prev + 1, totalSpecialtyPages))}
                        disabled={specialtyCurrentPage === totalSpecialtyPages}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-white/[0.05] rounded bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}

                {/* Contador de seleccionados */}
                {selectedSpecialties.length > 0 && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                    {selectedSpecialties.length} especialidad{selectedSpecialties.length !== 1 ? 'es' : ''} seleccionada{selectedSpecialties.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseEdit}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !doctorName || !selectedCountryId || selectedSpecialties.length === 0}>
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Eliminar Doctor */}
      <Modal isOpen={isDeleteOpen} onClose={handleCloseDelete} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Eliminar Doctor</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que deseas eliminar al doctor <strong>{selectedDoctor?.name}</strong>?
            </p>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={handleCloseDelete}>Cancelar</Button>
            <Button size="sm" onClick={handleDeleteDoctor} disabled={isLoading} className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700">
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Ver Detalles del Doctor */}
      <Modal isOpen={isDetailOpen} onClose={handleCloseDetail} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {selectedDoctor?.name}
            </h4>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedDoctor?.country.name}
              </span>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {selectedDoctor?.country.code}
              </span>
              <span
                className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${selectedDoctor?.status
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}
              >
                {selectedDoctor?.status ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
          <div className="px-2 pb-4 space-y-4">
            <div>
              <Label>Contacto</Label>
              <div className="mt-2 space-y-1">
                {selectedDoctor?.email && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Email:</span> {selectedDoctor.email}
                  </p>
                )}
                {selectedDoctor?.phone && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Teléfono:</span> {selectedDoctor.phone}
                  </p>
                )}
                {selectedDoctor?.license_number && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Licencia:</span> {selectedDoctor.license_number}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>Especialidades</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedDoctor?.specialties.map(specialty => (
                  <span
                    key={specialty.id}
                    className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                  >
                    {specialty.name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label>Información adicional</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Creado:</span> {selectedDoctor && formatDate(selectedDoctor.created_at)}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Actualizado:</span> {selectedDoctor && formatDate(selectedDoctor.updated_at)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" onClick={handleCloseDetail}>Cerrar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Carga Masiva */}
      <BulkUploadDoctorModal
        isOpen={isBulkUploadOpen}
        onClose={closeBulkUploadModal}
        onSuccess={() => {
          loadDoctors();
        }}
      />
    </>
  );
}
