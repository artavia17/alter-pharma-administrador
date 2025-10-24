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
import { PharmacyData } from "../../../types/services/protected/pharmacies.types";
import { CountryData } from "../../../types/services/protected/countries.types";
import { formatDate } from "../../../helper/formatData";

// Mapeo de códigos de país a prefijos telefónicos
const PHONE_PREFIXES: Record<string, string> = {
  'DO': '+1 809-',
  'HN': '+504 ',
  'CR': '+506 ',
  'PA': '+507 ',
};

export default function FarmaceuticasPage() {
  const [pharmacies, setPharmacies] = useState<PharmacyData[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyData | null>(null);

  // Filtros
  const [countryFilter, setCountryFilter] = useState<string>("");

  // Form fields
  const [legalName, setLegalName] = useState("");
  const [commercialName, setCommercialName] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [administratorName, setAdministratorName] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [phonePrefix, setPhonePrefix] = useState("");

  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modals
  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDetailOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();

  useEffect(() => {
    loadPharmacies();
    loadCountries();
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

  // Filtrar farmacéuticas
  const filteredPharmacies = useMemo(() => {
    if (!countryFilter) {
      return pharmacies;
    }
    return pharmacies.filter(pharmacy => pharmacy.country_id === parseInt(countryFilter));
  }, [pharmacies, countryFilter]);

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

  // Actualizar prefijo de teléfono cuando cambia el país
  const handleCountryChange = (countryId: string) => {
    const id = parseInt(countryId);
    setSelectedCountryId(id);

    const country = countries.find(c => c.id === id);
    if (country) {
      const prefix = PHONE_PREFIXES[country.code] || '+';
      setPhonePrefix(prefix);
      // Si el teléfono está vacío o solo tiene el prefijo anterior, actualizar al nuevo prefijo
      if (!phone || phone.match(/^\+\d{1,3}\s?-?\s?$/)) {
        setPhone(prefix);
      }
    }
  };

  const handlePhoneChange = (value: string) => {
    // Asegurar que el teléfono siempre comience con el prefijo del país
    if (phonePrefix && !value.startsWith(phonePrefix)) {
      setPhone(phonePrefix);
    } else {
      setPhone(value);
    }
  };

  const handleIdentificationChange = (value: string) => {
    // Eliminar espacios del número de identificación
    setIdentificationNumber(value.replace(/\s/g, ''));
  };

  const handleAddPharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountryId) return;

    setIsLoading(true);
    setErrors({});

    try {
      const params = {
        country_id: selectedCountryId,
        legal_name: legalName,
        commercial_name: commercialName,
        identification_number: identificationNumber,
        physical_address: physicalAddress,
        phone: phone,
        email: email,
        administrator_name: administratorName,
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
    if (!selectedPharmacy || !selectedCountryId) return;

    setIsLoading(true);
    setErrors({});

    try {
      const params = {
        country_id: selectedCountryId,
        legal_name: legalName,
        commercial_name: commercialName,
        identification_number: identificationNumber,
        physical_address: physicalAddress,
        phone: phone,
        email: email,
        administrator_name: administratorName,
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
    setPhysicalAddress("");
    setPhone("");
    setEmail("");
    setAdministratorName("");
    setSelectedCountryId(null);
    setPhonePrefix("");
    setErrors({});
  };

  const handleCloseAdd = () => {
    resetForm();
    setSelectedPharmacy(null);
    closeAddModal();
  };

  const openEdit = (pharmacy: PharmacyData) => {
    setSelectedPharmacy(pharmacy);
    setLegalName(pharmacy.legal_name);
    setCommercialName(pharmacy.commercial_name);
    setIdentificationNumber(pharmacy.identification_number);
    setPhysicalAddress(pharmacy.physical_address);
    setPhone(pharmacy.phone);
    setEmail(pharmacy.email);
    setAdministratorName(pharmacy.administrator_name);
    setSelectedCountryId(pharmacy.country_id);

    // Establecer prefijo actual
    const prefix = PHONE_PREFIXES[pharmacy.country.code] || '+';
    setPhonePrefix(prefix);

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
        title="Farmacéuticas | Alter Pharma"
        description="Gestión de farmacéuticas en el sistema"
      />
      <PageBreadcrumb pageTitle="Farmacéuticas" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Gestión de Farmacéuticas
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
            Agregar Farmacéutica
          </Button>
        </div>

        {/* Filtro por país */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
          <div className="flex items-center gap-4">
            <Label className="whitespace-nowrap">Filtrar por país:</Label>
            <div className="w-full max-w-xs">
              <Select
                options={countryFilterOptions}
                placeholder="Todos los países"
                onChange={(value) => setCountryFilter(value)}
                defaultValue=""
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
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Farmacéutica</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">País</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Identificación</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tipo</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {filteredPharmacies.map((pharmacy) => (
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
                        <button onClick={() => openEdit(pharmacy)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20" title="Editar farmacéutica">
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

            {filteredPharmacies.length === 0 && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">No hay farmacéuticas</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {hasActiveFilters ? "No se encontraron farmacéuticas para el país seleccionado." : "Comienza agregando una nueva farmacéutica."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Agregar Farmacéutica */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAdd} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Agregar Nueva Farmacéutica</h4>
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
                <Label>País *</Label>
                <Select
                  options={countryOptions}
                  placeholder="Selecciona un país"
                  onChange={handleCountryChange}
                  defaultValue=""
                />
                {phonePrefix && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Formato de teléfono: {phonePrefix}XXXXXXXX
                  </p>
                )}
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
                <Label>Número de identificación * (sin espacios)</Label>
                <Input
                  type="text"
                  value={identificationNumber}
                  onChange={(e) => handleIdentificationChange(e.target.value)}
                  placeholder="Ej: 3022202222"
                />
              </div>
              <div>
                <Label>Dirección física *</Label>
                <Input
                  type="text"
                  value={physicalAddress}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                  placeholder="Ej: Cartago, Costa Rica"
                />
              </div>
              <div>
                <Label>Teléfono *</Label>
                <Input
                  type="text"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder={phonePrefix ? `${phonePrefix}XXXXXXXX` : "Selecciona un país primero"}
                  disabled={!selectedCountryId}
                />
              </div>
              <div>
                <Label>Email *</Label>
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
              <Button size="sm" type="submit" disabled={isLoading || !legalName || !commercialName || !identificationNumber || !physicalAddress || !phone || !email || !administratorName || !selectedCountryId}>
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Editar Farmacéutica */}
      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Editar Farmacéutica</h4>
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
                <Label>País *</Label>
                <Select
                  options={countryOptions}
                  placeholder="Selecciona un país"
                  onChange={handleCountryChange}
                  defaultValue={selectedCountryId?.toString() || ""}
                />
                {phonePrefix && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Formato de teléfono: {phonePrefix}XXXXXXXX
                  </p>
                )}
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
                <Label>Número de identificación * (sin espacios)</Label>
                <Input
                  type="text"
                  value={identificationNumber}
                  onChange={(e) => handleIdentificationChange(e.target.value)}
                  placeholder="Ej: 3022202222"
                />
              </div>
              <div>
                <Label>Dirección física *</Label>
                <Input
                  type="text"
                  value={physicalAddress}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                  placeholder="Ej: Cartago, Costa Rica"
                />
              </div>
              <div>
                <Label>Teléfono *</Label>
                <Input
                  type="text"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder={phonePrefix ? `${phonePrefix}XXXXXXXX` : "Selecciona un país primero"}
                  disabled={!selectedCountryId}
                />
              </div>
              <div>
                <Label>Email *</Label>
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
              <Button size="sm" type="submit" disabled={isLoading || !legalName || !commercialName || !identificationNumber || !physicalAddress || !phone || !email || !administratorName || !selectedCountryId}>
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Ver Detalles de Farmacéutica */}
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
