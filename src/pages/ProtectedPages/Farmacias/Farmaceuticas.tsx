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
import { getPharmacies, createPharmacy, updatePharmacy, togglePharmacyStatus } from "../../../services/protected/pharmacies.services";
import { getCountries } from "../../../services/protected/countries.services";
import { getStates } from "../../../services/protected/states.services";
import { getMunicipalities } from "../../../services/protected/municipalities.services";
import { PharmacyData } from "../../../types/services/protected/pharmacies.types";
import { CountryData } from "../../../types/services/protected/countries.types";
import { StateData } from "../../../types/services/protected/countries.types";
import { MunicipalityData } from "../../../types/services/protected/municipalities.types";
import { formatDate } from "../../../helper/formatData";

export default function FarmaceuticasPage() {
  const [pharmacies, setPharmacies] = useState<PharmacyData[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [municipalities, setMunicipalities] = useState<MunicipalityData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyData | null>(null);

  // Filtros
  const [countryFilter, setCountryFilter] = useState<string>("");

  // Search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form fields
  const [legalName, setLegalName] = useState("");
  const [commercialName, setCommercialName] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [administratorName, setAdministratorName] = useState("");
  const [isChain, setIsChain] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<number | null>(null);
  const [phonePrefix, setPhonePrefix] = useState("");
  const [phoneMinLength, setPhoneMinLength] = useState<number>(0);
  const [phoneMaxLength, setPhoneMaxLength] = useState<number>(0);

  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modals
  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDetailOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();

  useEffect(() => {
    loadPharmacies();
    loadCountries();
    loadStates();
  }, []);

  const loadPharmacies = async () => {
    try {
      const response = await getPharmacies();
      if (response.status === 200 && Array.isArray(response.data)) {
        setPharmacies(response.data);
      }
    } catch (error) {
      console.error("Error cargando farmacéuticas:", error);
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

  const loadStates = async () => {
    try {
      const response = await getStates();
      if (response.status === 200 && Array.isArray(response.data)) {
        setStates(response.data);
      }
    } catch (error) {
      console.error("Error cargando estados:", error);
    }
  };

  // Filtrar farmacéuticas
  const filteredPharmacies = useMemo(() => {
    let filtered = pharmacies;

    // Filtrar por país
    if (countryFilter) {
      filtered = filtered.filter(pharmacy => Number(pharmacy.country_id) === Number(countryFilter));
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pharmacy =>
        pharmacy.legal_name.toLowerCase().includes(query) ||
        pharmacy.commercial_name.toLowerCase().includes(query) ||
        pharmacy.identification_number?.toLowerCase().includes(query) ||
        pharmacy.street_address?.toLowerCase().includes(query) ||
        pharmacy.phone?.toLowerCase().includes(query) ||
        pharmacy.email?.toLowerCase().includes(query) ||
        pharmacy.administrator_name?.toLowerCase().includes(query) ||
        pharmacy.country.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [pharmacies, countryFilter, searchQuery]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredPharmacies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPharmacies = filteredPharmacies.slice(startIndex, endIndex);

  // Resetear a la página 1 cuando cambia la búsqueda o filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, countryFilter]);

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

  // Opciones para select de formulario
  const countryOptions = useMemo(() => {
    return countries
      .filter(country => country.status)
      .map(country => ({
        value: country.id.toString(),
        label: country.name
      }));
  }, [countries]);

  // Opciones para select de estados (filtradas por país seleccionado)
  const stateOptions = useMemo(() => {
    if (!selectedCountryId) return [];
    return states
      .filter(state => Number(state.country_id) === Number(selectedCountryId) && state.status)
      .map(state => ({
        value: state.id.toString(),
        label: state.name
      }));
  }, [states, selectedCountryId]);

  // Opciones para select de municipios (filtradas por estado seleccionado)
  const municipalityOptions = useMemo(() => {
    if (!selectedStateId) return [];
    return municipalities
      .filter(municipality => Number(municipality.state_id) === Number(selectedStateId) && municipality.status)
      .map(municipality => ({
        value: municipality.id.toString(),
        label: municipality.name
      }));
  }, [municipalities, selectedStateId]);

  // Actualizar prefijo de teléfono cuando cambia el país
  const handleCountryChange = (countryId: string) => {
    const id = parseInt(countryId);
    setSelectedCountryId(id);
    setSelectedStateId(null); // Resetear estado cuando cambia el país
    setSelectedMunicipalityId(null); // Resetear municipio cuando cambia el país
    setMunicipalities([]); // Limpiar municipios

    const country = countries.find(c => Number(c.id) === Number(id));
    if (country) {
      const prefix = `+${country.phone_code} `;
      setPhonePrefix(prefix);
      setPhoneMinLength(country.phone_min_length);
      setPhoneMaxLength(country.phone_max_length);
      // Establecer el prefijo cuando se selecciona el país
      setPhone(prefix);
    }
  };

  // Cargar municipios cuando cambia el estado
  const handleStateChange = async (stateId: string) => {
    const id = parseInt(stateId);
    setSelectedStateId(id);
    setSelectedMunicipalityId(null); // Resetear municipio cuando cambia el estado

    // Cargar municipios del estado seleccionado
    try {
      const response = await getMunicipalities(id);
      if (response.status === 200 && Array.isArray(response.data)) {
        setMunicipalities(response.data);
      }
    } catch (error) {
      console.error("Error cargando municipios:", error);
      setMunicipalities([]);
    }
  };

  const handlePhoneChange = (value: string) => {
    // Asegurar que el teléfono siempre comience con el prefijo del país
    if (phonePrefix && !value.startsWith(phonePrefix)) {
      return; // No permitir eliminar el prefijo
    }

    // Solo permitir números después del prefijo
    const afterPrefix = value.substring(phonePrefix.length);
    const onlyNumbers = afterPrefix.replace(/\D/g, '');

    // Limitar según la longitud máxima
    if (onlyNumbers.length <= phoneMaxLength) {
      setPhone(phonePrefix + onlyNumbers);
    }
  };

  const handleIdentificationChange = (value: string) => {
    // Solo permitir letras y números (sin espacios ni caracteres especiales) y limitar a 100 caracteres
    const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanValue.length <= 100) {
      setIdentificationNumber(cleanValue);
    }
  };

  const handleStreetAddressChange = (value: string) => {
    // Limitar a 35 caracteres
    if (value.length <= 35) {
      setStreetAddress(value);
    }
  };

  const handleAddPharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountryId || !selectedStateId || !selectedMunicipalityId) return;

    setIsLoading(true);
    setErrors({});

    // Validar longitud del teléfono (sin contar el prefijo)
    const phoneDigits = phone.substring(phonePrefix.length);
    if (phoneDigits.length < phoneMinLength || phoneDigits.length > phoneMaxLength) {
      setErrors({
        general: `El teléfono debe tener entre ${phoneMinLength} y ${phoneMaxLength} dígitos`
      });
      setIsLoading(false);
      return;
    }

    try {
      const params = {
        country_id: selectedCountryId,
        state_id: selectedStateId,
        municipality_id: selectedMunicipalityId,
        legal_name: legalName,
        commercial_name: commercialName,
        identification_number: identificationNumber,
        street_address: streetAddress,
        phone: phone,
        email: email,
        administrator_name: administratorName,
        is_chain: isChain,
      };

      const response = await createPharmacy(params);
      if (response.status === 200 || response.status === 201) {
        await loadPharmacies();
        resetForm();
        closeAddModal();
      }
    } catch (error: any) {
      console.error("Error creando farmacéutica:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al crear la farmacéutica" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPharmacy || !selectedCountryId || !selectedStateId || !selectedMunicipalityId) return;

    setIsLoading(true);
    setErrors({});

    // Validar longitud del teléfono (sin contar el prefijo)
    const phoneDigits = phone.substring(phonePrefix.length);
    if (phoneDigits.length < phoneMinLength || phoneDigits.length > phoneMaxLength) {
      setErrors({
        general: `El teléfono debe tener entre ${phoneMinLength} y ${phoneMaxLength} dígitos`
      });
      setIsLoading(false);
      return;
    }

    try {
      const params = {
        country_id: selectedCountryId,
        state_id: selectedStateId,
        municipality_id: selectedMunicipalityId,
        legal_name: legalName,
        commercial_name: commercialName,
        identification_number: identificationNumber,
        street_address: streetAddress,
        phone: phone,
        email: email,
        administrator_name: administratorName,
        is_chain: isChain,
      };

      const response = await updatePharmacy(selectedPharmacy.id, params);
      if (response.status === 200) {
        await loadPharmacies();
        resetForm();
        setSelectedPharmacy(null);
        closeEditModal();
      }
    } catch (error: any) {
      console.error("Error editando farmacéutica:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al actualizar la farmacéutica" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (pharmacy: PharmacyData) => {
    try {
      await togglePharmacyStatus(pharmacy.id);
      await loadPharmacies();
    } catch (error) {
      console.error("Error cambiando estado de farmacéutica:", error);
    }
  };

  const resetForm = () => {
    setLegalName("");
    setCommercialName("");
    setIdentificationNumber("");
    setStreetAddress("");
    setPhone("");
    setEmail("");
    setAdministratorName("");
    setIsChain(false);
    setSelectedCountryId(null);
    setSelectedStateId(null);
    setSelectedMunicipalityId(null);
    setMunicipalities([]);
    setPhonePrefix("");
    setPhoneMinLength(0);
    setPhoneMaxLength(0);
    setErrors({});
  };

  const handleCloseAdd = () => {
    resetForm();
    setSelectedPharmacy(null);
    closeAddModal();
  };

  // @ts-ignore - Function reserved for future edit functionality
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openEdit = async (pharmacy: PharmacyData) => {
    setSelectedPharmacy(pharmacy);
    setLegalName(pharmacy.legal_name);
    setCommercialName(pharmacy.commercial_name);
    setIdentificationNumber(pharmacy.identification_number);
    setStreetAddress(pharmacy.street_address);
    setPhone(pharmacy.phone);
    setEmail(pharmacy.email);
    setAdministratorName(pharmacy.administrator_name);
    setIsChain(pharmacy.is_chain);
    setSelectedCountryId(pharmacy.country_id);
    setSelectedStateId(pharmacy.state_id);
    setSelectedMunicipalityId(pharmacy.municipality_id);

    // Establecer prefijo y longitudes actuales desde el país
    const prefix = `+${pharmacy.country.phone_code} `;
    setPhonePrefix(prefix);
    setPhoneMinLength(pharmacy.country.phone_min_length);
    setPhoneMaxLength(pharmacy.country.phone_max_length);

    // Cargar municipios del estado
    try {
      const response = await getMunicipalities(pharmacy.state_id);
      if (response.status === 200 && Array.isArray(response.data)) {
        setMunicipalities(response.data);
      }
    } catch (error) {
      console.error("Error cargando municipios:", error);
      setMunicipalities([]);
    }

    openEditModal();
  };

  const handleCloseEdit = () => {
    resetForm();
    setSelectedPharmacy(null);
    closeEditModal();
  };

  const openDetail = (pharmacy: PharmacyData) => {
    setSelectedPharmacy(pharmacy);
    openDetailModal();
  };

  const handleCloseDetail = () => {
    setSelectedPharmacy(null);
    closeDetailModal();
  };

  const hasActiveFilters = !!countryFilter;

  return (
    <>
      <PageMeta
        title="Cadenas | Alter Pharma"
        description="Gestión de cadenas en el sistema"
      />
      <PageBreadcrumb pageTitle="Cadenas" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Gestión de Cadenas
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra las farmacéuticas registradas en el sistema
            </p>
          </div>
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
            Agregar Cadena
          </Button>
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
              placeholder="Buscar por nombre, identificación, dirección, teléfono, email..."
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
              Mostrando {filteredPharmacies.length} de {pharmacies.length} farmacéuticas
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
                onChange={(value) => setCountryFilter(value)}
                value={countryFilter}
              />
            </div>
            {hasActiveFilters && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {filteredPharmacies.length} de {pharmacies.length} farmacéuticas
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
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Cadena</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">País</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Identificación</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tipo</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {paginatedPharmacies.map((pharmacy) => (
                  <TableRow key={pharmacy.id}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{pharmacy.id}</TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{pharmacy.commercial_name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{pharmacy.legal_name}</span>
                        {pharmacy.email && <span className="block text-xs text-gray-500 dark:text-gray-400">{pharmacy.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-800 dark:text-white/90">{pharmacy.country.name}</span>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {pharmacy.country.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {pharmacy.identification_number}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        pharmacy.is_chain
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                      }`}>
                        {pharmacy.is_chain ? "Cadena" : "Independiente"}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Switch
                        label={pharmacy.status ? "Activo" : "Inactivo"}
                        defaultChecked={pharmacy.status}
                        onChange={() => handleToggleStatus(pharmacy)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openDetail(pharmacy)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg dark:text-purple-400 dark:hover:bg-purple-900/20" title="Ver detalles">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </button>
                        {/* Esta opcion se remueve porque no se agrego */}
                        {/* <button onClick={() => openEdit(pharmacy)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20" title="Editar farmacéutica">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button> */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {paginatedPharmacies.length === 0 && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">
                  {searchQuery || hasActiveFilters ? "No se encontraron resultados" : "No hay farmacéuticas"}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery
                    ? `No se encontraron farmacéuticas que coincidan con "${searchQuery}".`
                    : hasActiveFilters
                      ? "No se encontraron farmacéuticas para el país seleccionado."
                      : "Comienza agregando una nueva farmacéutica."
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Paginación */}
        {filteredPharmacies.length > 0 && (
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
                    <span className="font-medium">{Math.min(endIndex, filteredPharmacies.length)}</span> de{' '}
                    <span className="font-medium">{filteredPharmacies.length}</span> resultados
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

      {/* Modal: Agregar Cadena */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAdd} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Agregar Nueva Cadena</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completa los datos para registrar una nueva farmacéutica</p>
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
          <form onSubmit={handleAddPharmacy} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4 max-h-[500px] overflow-y-auto border-b border-t pt-4 border-gray-200 dark:border-white/[0.05]">
              <div>
                <Label>¿Es una cadena de farmacias?</Label>
                <div className="mt-2">
                  <label className="flex cursor-pointer select-none items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-400">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isChain}
                        onChange={(e) => setIsChain(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`block h-6 w-11 rounded-full transition duration-150 ease-linear ${isChain ? 'bg-brand-500' : 'bg-gray-200 dark:bg-white/10'}`}></div>
                      <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-theme-sm duration-150 ease-linear transform ${isChain ? 'translate-x-full' : 'translate-x-0'}`}></div>
                    </div>
                    <span>{isChain ? 'Es una cadena' : 'No es una cadena'}</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Activa esta opción si la farmacia forma parte de una cadena
                  </p>
                </div>
              </div>
              <div>
                <Label>País *</Label>
                <Select
                  options={countryOptions}
                  placeholder="Selecciona un país"
                  onChange={handleCountryChange}
                  defaultValue=""
                />
                {phonePrefix && phoneMinLength > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    El teléfono debe tener entre {phoneMinLength} y {phoneMaxLength} dígitos (sin contar el código de país)
                  </p>
                )}
              </div>
              <div>
                <Label>Estado/Provincia *</Label>
                <Select
                  options={stateOptions}
                  placeholder="Selecciona un estado"
                  onChange={handleStateChange}
                  defaultValue=""
                  disabled={!selectedCountryId}
                />
              </div>
              <div>
                <Label>Municipio *</Label>
                <Select
                  options={municipalityOptions}
                  placeholder="Selecciona un municipio"
                  onChange={(value) => setSelectedMunicipalityId(parseInt(value))}
                  defaultValue=""
                  disabled={!selectedStateId}
                />
              </div>
              <div>
                <Label>Razón social *</Label>
                <Input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Ej: Farmacia S.A."
                />
              </div>
              <div>
                <Label>Nombre comercial *</Label>
                <Input
                  type="text"
                  value={commercialName}
                  onChange={(e) => setCommercialName(e.target.value)}
                  placeholder="Ej: Alther Pharma"
                />
              </div>
              <div>
                <Label>Número de identificación *</Label>
                <Input
                  type="text"
                  value={identificationNumber}
                  onChange={(e) => handleIdentificationChange(e.target.value)}
                  placeholder="Ej: ABC123XYZ789"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Solo letras y números, máximo 100 caracteres
                </p>
              </div>
              <div>
                <Label>Dirección exacta *</Label>
                <Input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => handleStreetAddressChange(e.target.value)}
                  placeholder="Ej: Calle 5, Avenida Central"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Máximo 35 caracteres
                </p>
              </div>
              <div>
                <Label>Teléfono *</Label>
                <Input
                  type="text"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder={phonePrefix ? `${phonePrefix}${"X".repeat(phoneMinLength)}` : "Selecciona un país primero"}
                  disabled={!selectedCountryId}
                />
                {phonePrefix && phoneMinLength > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    El prefijo {phonePrefix.trim()} no se puede eliminar. Solo números permitidos.
                  </p>
                )}
              </div>
              <div>
                <Label>Correo electrónico *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: contacto@farmacia.com"
                />
              </div>
              <div>
                <Label>Nombre del administrador *</Label>
                <Input
                  type="text"
                  value={administratorName}
                  onChange={(e) => setAdministratorName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseAdd}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !legalName || !commercialName || !identificationNumber || !streetAddress || !phone || !email || !administratorName || !selectedCountryId || !selectedStateId || !selectedMunicipalityId}>
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Editar Cadena */}
      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Editar Cadena</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Modifica los datos de la farmacéutica seleccionada</p>
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
          <form onSubmit={handleEditPharmacy} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4 max-h-[500px] overflow-y-auto border-b border-t pt-4 border-gray-200 dark:border-white/[0.05]">
              <div>
                <Label>¿Es una cadena de farmacias?</Label>
                <div className="mt-2">
                  <label className="flex cursor-pointer select-none items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-400">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isChain}
                        onChange={(e) => setIsChain(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`block h-6 w-11 rounded-full transition duration-150 ease-linear ${isChain ? 'bg-brand-500' : 'bg-gray-200 dark:bg-white/10'}`}></div>
                      <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-theme-sm duration-150 ease-linear transform ${isChain ? 'translate-x-full' : 'translate-x-0'}`}></div>
                    </div>
                    <span>{isChain ? 'Es una cadena' : 'No es una cadena'}</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Activa esta opción si la farmacia forma parte de una cadena
                  </p>
                </div>
              </div>
              <div>
                <Label>País *</Label>
                <Select
                  options={countryOptions}
                  placeholder="Selecciona un país"
                  onChange={handleCountryChange}
                  defaultValue={selectedCountryId?.toString() || ""}
                />
                {phonePrefix && phoneMinLength > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    El teléfono debe tener entre {phoneMinLength} y {phoneMaxLength} dígitos (sin contar el código de país)
                  </p>
                )}
              </div>
              <div>
                <Label>Estado/Provincia *</Label>
                <Select
                  options={stateOptions}
                  placeholder="Selecciona un estado"
                  onChange={handleStateChange}
                  value={selectedStateId?.toString() || ""}
                  disabled={!selectedCountryId}
                />
              </div>
              <div>
                <Label>Municipio *</Label>
                <Select
                  options={municipalityOptions}
                  placeholder="Selecciona un municipio"
                  onChange={(value) => setSelectedMunicipalityId(parseInt(value))}
                  value={selectedMunicipalityId?.toString() || ""}
                  disabled={!selectedStateId}
                />
              </div>
              <div>
                <Label>Razón social *</Label>
                <Input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Ej: Farmacia S.A."
                />
              </div>
              <div>
                <Label>Nombre comercial *</Label>
                <Input
                  type="text"
                  value={commercialName}
                  onChange={(e) => setCommercialName(e.target.value)}
                  placeholder="Ej: Codigtivo"
                />
              </div>
              <div>
                <Label>Número de identificación *</Label>
                <Input
                  type="text"
                  value={identificationNumber}
                  onChange={(e) => handleIdentificationChange(e.target.value)}
                  placeholder="Ej: ABC123XYZ789"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Solo letras y números, máximo 100 caracteres
                </p>
              </div>
              <div>
                <Label>Dirección exacta *</Label>
                <Input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => handleStreetAddressChange(e.target.value)}
                  placeholder="Ej: Calle 5, Avenida Central"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Máximo 35 caracteres
                </p>
              </div>
              <div>
                <Label>Teléfono *</Label>
                <Input
                  type="text"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder={phonePrefix ? `${phonePrefix}${"X".repeat(phoneMinLength)}` : "Selecciona un país primero"}
                  disabled={!selectedCountryId}
                />
                {phonePrefix && phoneMinLength > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    El prefijo {phonePrefix.trim()} no se puede eliminar. Solo números permitidos.
                  </p>
                )}
              </div>
              <div>
                <Label>Correo electrónico *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: contacto@farmacia.com"
                />
              </div>
              <div>
                <Label>Nombre del administrador *</Label>
                <Input
                  type="text"
                  value={administratorName}
                  onChange={(e) => setAdministratorName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseEdit}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !legalName || !commercialName || !identificationNumber || !streetAddress || !phone || !email || !administratorName || !selectedCountryId || !selectedStateId || !selectedMunicipalityId}>
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Ver Detalles de Cadena */}
      <Modal isOpen={isDetailOpen} onClose={handleCloseDetail} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {selectedPharmacy?.commercial_name}
            </h4>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedPharmacy?.country.name}
              </span>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {selectedPharmacy?.country.code}
              </span>
              <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                selectedPharmacy?.is_chain
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
              }`}>
                {selectedPharmacy?.is_chain ? "Cadena" : "Independiente"}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  selectedPharmacy?.status
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {selectedPharmacy?.status ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
          <div className="px-2 pb-4 space-y-4">
            <div>
              <Label>Información legal</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Razón social:</span> {selectedPharmacy?.legal_name}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Número de identificación:</span> {selectedPharmacy?.identification_number}
                </p>
              </div>
            </div>

            <div>
              <Label>Contacto</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Email:</span> {selectedPharmacy?.email}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Teléfono:</span> {selectedPharmacy?.phone}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Dirección:</span> {selectedPharmacy?.physical_address}
                </p>
              </div>
            </div>

            <div>
              <Label>Administrador</Label>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {selectedPharmacy?.administrator_name}
              </p>
            </div>

            <div>
              <Label>Información adicional</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Creado:</span> {selectedPharmacy && formatDate(selectedPharmacy.created_at)}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Actualizado:</span> {selectedPharmacy && formatDate(selectedPharmacy.updated_at)}
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
