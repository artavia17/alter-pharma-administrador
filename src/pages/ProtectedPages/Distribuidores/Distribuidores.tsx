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
import { getDistributors, createDistributor, updateDistributor, toggleDistributorStatus, deleteDistributor } from "../../../services/protected/distributors.services";
import { getCountries } from "../../../services/protected/countries.services";
import { getStates } from "../../../services/protected/states.services";
import { getMunicipalities } from "../../../services/protected/municipalities.services";
import { DistributorData } from "../../../types/services/protected/distributors.types";
import { CountryData } from "../../../types/services/protected/countries.types";
import { StateData } from "../../../types/services/protected/states.types";
import { MunicipalityData } from "../../../types/services/protected/municipalities.types";
import { formatDate } from "../../../helper/formatData";

export default function DistribuidoresPage() {
  const [distributors, setDistributors] = useState<DistributorData[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [municipalities, setMunicipalities] = useState<MunicipalityData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<DistributorData | null>(null);

  // Filtros
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("");

  // Form fields
  const [businessName, setBusinessName] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<number | null>(null);

  // Phone and identification validation states
  const [phonePrefix, setPhonePrefix] = useState("");
  const [phoneMinLength, setPhoneMinLength] = useState<number>(0);
  const [phoneMaxLength, setPhoneMaxLength] = useState<number>(0);
  const [identificationMinLength, setIdentificationMinLength] = useState<number>(0);
  const [identificationMaxLength, setIdentificationMaxLength] = useState<number>(0);

  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modals
  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isDetailOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();

  useEffect(() => {
    loadDistributors();
    loadCountries();
    loadAllStates(); // Cargar todos los estados al inicio para los filtros
  }, []);

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

  const loadAllStates = async () => {
    try {
      const response = await getStates();
      if (response.status === 200 && Array.isArray(response.data)) {
        setStates(response.data); // Cargar todos los estados sin filtrar
      }
    } catch (error) {
      console.error("Error cargando estados:", error);
    }
  };

  const loadStates = async (countryId: number) => {
    try {
      const response = await getStates();
      if (response.status === 200 && Array.isArray(response.data)) {
        // Filtrar estados por país
        const filteredStates = response.data.filter(state => state.country_id === countryId);
        setStates(filteredStates);
      }
    } catch (error) {
      console.error("Error cargando estados:", error);
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
    }
  };

  // Filtrar distribuidores
  const filteredDistributors = useMemo(() => {
    let filtered = distributors;

    if (countryFilter) {
      filtered = filtered.filter(distributor => distributor.country_id === parseInt(countryFilter));
    }

    if (stateFilter) {
      filtered = filtered.filter(distributor => distributor.state_id === parseInt(stateFilter));
    }

    return filtered;
  }, [distributors, countryFilter, stateFilter]);

  // Opciones para selects de filtros
  const countryFilterOptions = useMemo(() => {
    return countries
      .filter(country => country.status)
      .map(country => ({
        value: country.id.toString(),
        label: country.name
      }));
  }, [countries]);

  const stateFilterOptions = useMemo(() => {
    // Si hay un país seleccionado, filtrar estados por ese país
    const filteredStates = countryFilter
      ? states.filter(state => state.status && state.country_id === parseInt(countryFilter))
      : states.filter(state => state.status);

    return filteredStates.map(state => ({
      value: state.id.toString(),
      label: state.name
    }));
  }, [states, countryFilter]);

  // Opciones para selects de formulario
  const countryOptions = useMemo(() => {
    return countries
      .filter(country => country.status)
      .map(country => ({
        value: country.id.toString(),
        label: country.name
      }));
  }, [countries]);

  const stateOptions = useMemo(() => {
    return states
      .filter(state => state.status)
      .map(state => ({
        value: state.id.toString(),
        label: state.name
      }));
  }, [states]);

  const municipalityOptions = useMemo(() => {
    return municipalities
      .filter(municipality => municipality.status)
      .map(municipality => ({
        value: municipality.id.toString(),
        label: municipality.name
      }));
  }, [municipalities]);

  const handleCountryChange = (countryId: string) => {
    const id = parseInt(countryId);
    setSelectedCountryId(id);
    setSelectedStateId(null);
    setSelectedMunicipalityId(null);
    setStates([]);
    setMunicipalities([]);

    // Cargar estados del país seleccionado
    if (id) {
      loadStates(id);
    }

    // Encontrar el país seleccionado y establecer el prefijo y validaciones
    const country = countries.find(c => c.id === id);
    if (country) {
      const prefix = `+${country.phone_code} `;
      setPhonePrefix(prefix);
      setPhoneMinLength(country.phone_min_length);
      setPhoneMaxLength(country.phone_max_length);
      setIdentificationMinLength(country.identification_min_length);
      setIdentificationMaxLength(country.identification_max_length);
      setPhone(prefix); // Inicializar teléfono con el prefijo
      setIdentificationNumber(""); // Limpiar identificación al cambiar país
    } else {
      setPhonePrefix("");
      setPhoneMinLength(0);
      setPhoneMaxLength(0);
      setIdentificationMinLength(0);
      setIdentificationMaxLength(0);
      setPhone("");
      setIdentificationNumber("");
    }
  };

  const handleStateChange = (stateId: string) => {
    const id = parseInt(stateId);
    setSelectedStateId(id);
    setSelectedMunicipalityId(null);
    setMunicipalities([]);

    // Cargar municipios del estado seleccionado
    if (id) {
      loadMunicipalities(id);
    }
  };

  const handlePhoneChange = (value: string) => {
    // Si el usuario intenta borrar el prefijo, no lo permitimos
    if (!value.startsWith(phonePrefix)) {
      return;
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
    // Solo permitir letras y números (sin espacios ni caracteres especiales) y limitar según el país
    const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanValue.length <= identificationMaxLength) {
      setIdentificationNumber(cleanValue);
    }
  };

  const handleAddDistributor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountryId || !selectedStateId || !selectedMunicipalityId) return;

    setIsLoading(true);
    setErrors({});

    // Validar longitud del teléfono (sin contar el prefijo)
    if (phone) {
      const phoneDigits = phone.substring(phonePrefix.length);
      if (phoneDigits.length < phoneMinLength || phoneDigits.length > phoneMaxLength) {
        setErrors({
          general: `El teléfono debe tener entre ${phoneMinLength} y ${phoneMaxLength} dígitos`
        });
        setIsLoading(false);
        return;
      }
    }

    // Validar longitud del número de identificación
    if (identificationNumber.length < identificationMinLength || identificationNumber.length > identificationMaxLength) {
      setErrors({
        general: `El número de identificación debe tener entre ${identificationMinLength} y ${identificationMaxLength} caracteres`
      });
      setIsLoading(false);
      return;
    }

    try {
      const params = {
        country_id: selectedCountryId,
        state_id: selectedStateId,
        municipality_id: selectedMunicipalityId,
        business_name: businessName,
        identification_number: identificationNumber,
        street_address: streetAddress,
        phone: phone,
        email: email,
        contact_person_name: contactPersonName,
      };

      const response = await createDistributor(params);
      if (response.status === 200 || response.status === 201) {
        await loadDistributors();
        resetForm();
        closeAddModal();
      }
    } catch (error: any) {
      console.error("Error creando distribuidor:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al crear el distribuidor" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDistributor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistributor || !selectedCountryId || !selectedStateId || !selectedMunicipalityId) return;

    setIsLoading(true);
    setErrors({});

    // Validar longitud del teléfono (sin contar el prefijo)
    if (phone) {
      const phoneDigits = phone.substring(phonePrefix.length);
      if (phoneDigits.length < phoneMinLength || phoneDigits.length > phoneMaxLength) {
        setErrors({
          general: `El teléfono debe tener entre ${phoneMinLength} y ${phoneMaxLength} dígitos`
        });
        setIsLoading(false);
        return;
      }
    }

    // Validar longitud del número de identificación
    if (identificationNumber.length < identificationMinLength || identificationNumber.length > identificationMaxLength) {
      setErrors({
        general: `El número de identificación debe tener entre ${identificationMinLength} y ${identificationMaxLength} caracteres`
      });
      setIsLoading(false);
      return;
    }

    try {
      const params = {
        country_id: selectedCountryId,
        state_id: selectedStateId,
        municipality_id: selectedMunicipalityId,
        business_name: businessName,
        identification_number: identificationNumber,
        street_address: streetAddress,
        phone: phone,
        email: email,
        contact_person_name: contactPersonName,
      };

      const response = await updateDistributor(selectedDistributor.id, params);
      if (response.status === 200) {
        await loadDistributors();
        resetForm();
        setSelectedDistributor(null);
        closeEditModal();
      }
    } catch (error: any) {
      console.error("Error editando distribuidor:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al actualizar el distribuidor" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (distributor: DistributorData) => {
    try {
      await toggleDistributorStatus(distributor.id);
      await loadDistributors();
    } catch (error) {
      console.error("Error cambiando estado del distribuidor:", error);
    }
  };

  const handleDeleteDistributor = async () => {
    if (!selectedDistributor) return;
    setIsLoading(true);

    try {
      await deleteDistributor(selectedDistributor.id);
      await loadDistributors();
      setSelectedDistributor(null);
      closeDeleteModal();
    } catch (error) {
      console.error("Error eliminando distribuidor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setBusinessName("");
    setIdentificationNumber("");
    setStreetAddress("");
    setPhone("");
    setEmail("");
    setContactPersonName("");
    setSelectedCountryId(null);
    setSelectedStateId(null);
    setSelectedMunicipalityId(null);
    setStates([]);
    setMunicipalities([]);
    setPhonePrefix("");
    setPhoneMinLength(0);
    setPhoneMaxLength(0);
    setIdentificationMinLength(0);
    setIdentificationMaxLength(0);
    setErrors({});
  };

  const handleCloseAdd = () => {
    resetForm();
    setSelectedDistributor(null);
    closeAddModal();
  };

  const openEdit = async (distributor: DistributorData) => {
    setSelectedDistributor(distributor);
    setBusinessName(distributor.business_name);
    setIdentificationNumber(distributor.identification_number);
    setStreetAddress(distributor.street_address);
    setEmail(distributor.email);
    setContactPersonName(distributor.contact_person_name);
    setSelectedCountryId(distributor.country_id);
    setSelectedStateId(distributor.state_id);
    setSelectedMunicipalityId(distributor.municipality_id);

    // Cargar estados y municipios
    await loadStates(distributor.country_id);
    await loadMunicipalities(distributor.state_id);

    // Establecer el prefijo del teléfono basado en el país del distribuidor
    const country = countries.find(c => c.id === distributor.country_id);
    if (country) {
      const prefix = `+${country.phone_code} `;
      setPhonePrefix(prefix);
      setPhoneMinLength(country.phone_min_length);
      setPhoneMaxLength(country.phone_max_length);
      setIdentificationMinLength(country.identification_min_length);
      setIdentificationMaxLength(country.identification_max_length);
      setPhone(distributor.phone || prefix);
    } else {
      setPhonePrefix("");
      setPhoneMinLength(0);
      setPhoneMaxLength(0);
      setIdentificationMinLength(0);
      setIdentificationMaxLength(0);
      setPhone(distributor.phone || "");
    }

    openEditModal();
  };

  const handleCloseEdit = () => {
    resetForm();
    setSelectedDistributor(null);
    closeEditModal();
  };

  const openDelete = (distributor: DistributorData) => {
    setSelectedDistributor(distributor);
    openDeleteModal();
  };

  const handleCloseDelete = () => {
    setSelectedDistributor(null);
    closeDeleteModal();
  };

  const openDetail = (distributor: DistributorData) => {
    setSelectedDistributor(distributor);
    openDetailModal();
  };

  const handleCloseDetail = () => {
    setSelectedDistributor(null);
    closeDetailModal();
  };

  const hasActiveFilters = countryFilter || stateFilter;

  return (
    <>
      <PageMeta
        title="Distribuidores | Alter Pharma"
        description="Gestión de distribuidores en el sistema"
      />
      <PageBreadcrumb pageTitle="Distribuidores" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Gestión de Distribuidores
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra los distribuidores del sistema
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
            Agregar Distribuidor
          </Button>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Label className="whitespace-nowrap">Filtrar por:</Label>
            <div className="flex-1 min-w-[200px]">
              <Select
                options={countryFilterOptions}
                placeholder="País"
                onChange={(value) => {
                  setCountryFilter(value);
                  setStateFilter(""); // Limpiar el filtro de estado cuando cambia el país
                }}
                defaultValue=""
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select
                options={stateFilterOptions}
                placeholder="Estado"
                onChange={(value) => setStateFilter(value)}
                defaultValue=""
              />
            </div>
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredDistributors.length} de {distributors.length} distribuidores
                </span>
                <button
                  onClick={() => {
                    setCountryFilter("");
                    setStateFilter("");
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
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Distribuidor</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ubicación</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Contacto</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {filteredDistributors.map((distributor) => (
                  <TableRow key={distributor.id}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{distributor.id}</TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{distributor.business_name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">RNC: {distributor.identification_number}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div>
                        <span className="block text-sm text-gray-800 dark:text-white/90">{distributor.country.name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{distributor.state.name}, {distributor.municipality.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div>
                        <span className="block text-sm text-gray-800 dark:text-white/90">{distributor.contact_person_name}</span>
                        {distributor.email && <span className="block text-xs text-gray-500 dark:text-gray-400">{distributor.email}</span>}
                        {distributor.phone && <span className="block text-xs text-gray-500 dark:text-gray-400">{distributor.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Switch
                        label={distributor.status ? "Activo" : "Inactivo"}
                        defaultChecked={distributor.status}
                        onChange={() => handleToggleStatus(distributor)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openDetail(distributor)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg dark:text-purple-400 dark:hover:bg-purple-900/20" title="Ver detalles">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </button>
                        <button onClick={() => openEdit(distributor)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20" title="Editar distribuidor">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button onClick={() => openDelete(distributor)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20" title="Eliminar distribuidor">
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

            {filteredDistributors.length === 0 && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">No hay distribuidores</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {hasActiveFilters ? "No se encontraron distribuidores con los filtros seleccionados." : "Comienza agregando un nuevo distribuidor."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Agregar Distribuidor */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAdd} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Agregar Nuevo Distribuidor</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completa los datos para crear un nuevo distribuidor</p>
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
          <form onSubmit={handleAddDistributor} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4 max-h-[500px] overflow-y-auto">
              <div>
                <Label>Nombre comercial *</Label>
                <Input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej: Distribuidora Médica S.A."
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
                <Label>Estado *</Label>
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
                <Label>Número de identificación *</Label>
                <Input
                  type="text"
                  value={identificationNumber}
                  onChange={(e) => handleIdentificationChange(e.target.value)}
                  placeholder="Ej: 12345678901"
                  disabled={!selectedCountryId}
                />
                {identificationMinLength > 0 && identificationMaxLength > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Solo letras y números, entre {identificationMinLength} y {identificationMaxLength} caracteres
                  </p>
                )}
              </div>
              <div>
                <Label>Dirección *</Label>
                <Input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Ej: Av. Principal #123"
                />
              </div>
              <div>
                <Label>Teléfono *</Label>
                <Input
                  type="text"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder={phonePrefix ? `${phonePrefix}0000000` : "Selecciona un país primero"}
                  disabled={!selectedCountryId}
                />
                {phoneMinLength > 0 && phoneMaxLength > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Debe tener entre {phoneMinLength} y {phoneMaxLength} dígitos
                  </p>
                )}
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: contacto@distribuidor.com"
                />
              </div>
              <div>
                <Label>Persona de contacto *</Label>
                <Input
                  type="text"
                  value={contactPersonName}
                  onChange={(e) => setContactPersonName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseAdd}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !businessName || !selectedCountryId || !selectedStateId || !selectedMunicipalityId || !identificationNumber || !streetAddress || !phone || !email || !contactPersonName}>
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Editar Distribuidor */}
      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Editar Distribuidor</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Modifica los datos del distribuidor seleccionado</p>
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
          <form onSubmit={handleEditDistributor} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4 max-h-[500px] overflow-y-auto border-t border-b border-gray-200 dark:border-white/[0.05] pt-4 pb-6">
              <div>
                <Label>Nombre comercial *</Label>
                <Input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej: Distribuidora Médica S.A."
                />
              </div>
              <div>
                <Label>País *</Label>
                <Select
                  options={countryOptions}
                  placeholder="Selecciona un país"
                  onChange={handleCountryChange}
                  defaultValue={selectedCountryId?.toString() || ""}
                />
              </div>
              <div>
                <Label>Estado *</Label>
                <Select
                  options={stateOptions}
                  placeholder="Selecciona un estado"
                  onChange={handleStateChange}
                  defaultValue={selectedStateId?.toString() || ""}
                  disabled={!selectedCountryId}
                />
              </div>
              <div>
                <Label>Municipio *</Label>
                <Select
                  options={municipalityOptions}
                  placeholder="Selecciona un municipio"
                  onChange={(value) => setSelectedMunicipalityId(parseInt(value))}
                  defaultValue={selectedMunicipalityId?.toString() || ""}
                  disabled={!selectedStateId}
                />
              </div>
              <div>
                <Label>Número de identificación *</Label>
                <Input
                  type="text"
                  value={identificationNumber}
                  onChange={(e) => handleIdentificationChange(e.target.value)}
                  placeholder="Ej: 12345678901"
                  disabled={!selectedCountryId}
                />
                {identificationMinLength > 0 && identificationMaxLength > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Solo letras y números, entre {identificationMinLength} y {identificationMaxLength} caracteres
                  </p>
                )}
              </div>
              <div>
                <Label>Dirección *</Label>
                <Input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Ej: Av. Principal #123"
                />
              </div>
              <div>
                <Label>Teléfono *</Label>
                <Input
                  type="text"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder={phonePrefix ? `${phonePrefix}0000000` : "Selecciona un país primero"}
                  disabled={!selectedCountryId}
                />
                {phoneMinLength > 0 && phoneMaxLength > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Debe tener entre {phoneMinLength} y {phoneMaxLength} dígitos
                  </p>
                )}
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: contacto@distribuidor.com"
                />
              </div>
              <div>
                <Label>Persona de contacto *</Label>
                <Input
                  type="text"
                  value={contactPersonName}
                  onChange={(e) => setContactPersonName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseEdit}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !businessName || !selectedCountryId || !selectedStateId || !selectedMunicipalityId || !identificationNumber || !streetAddress || !phone || !email || !contactPersonName}>
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Eliminar Distribuidor */}
      <Modal isOpen={isDeleteOpen} onClose={handleCloseDelete} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Eliminar Distribuidor</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que deseas eliminar el distribuidor <strong>{selectedDistributor?.business_name}</strong>?
            </p>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={handleCloseDelete}>Cancelar</Button>
            <Button size="sm" onClick={handleDeleteDistributor} disabled={isLoading} className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700">
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Ver Detalles del Distribuidor */}
      <Modal isOpen={isDetailOpen} onClose={handleCloseDetail} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {selectedDistributor?.business_name}
            </h4>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                RNC: {selectedDistributor?.identification_number}
              </span>
              <span
                className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  selectedDistributor?.status
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {selectedDistributor?.status ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
          <div className="px-2 pb-4 space-y-4">
            <div>
              <Label>Ubicación</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">País:</span> {selectedDistributor?.country.name}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Estado:</span> {selectedDistributor?.state.name}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Municipio:</span> {selectedDistributor?.municipality.name}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Dirección:</span> {selectedDistributor?.street_address}
                </p>
              </div>
            </div>

            <div>
              <Label>Contacto</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Persona:</span> {selectedDistributor?.contact_person_name}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Email:</span> {selectedDistributor?.email}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Teléfono:</span> {selectedDistributor?.phone}
                </p>
              </div>
            </div>

            <div>
              <Label>Información adicional</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Creado:</span> {selectedDistributor && formatDate(selectedDistributor.created_at)}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Actualizado:</span> {selectedDistributor && formatDate(selectedDistributor.updated_at)}
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
