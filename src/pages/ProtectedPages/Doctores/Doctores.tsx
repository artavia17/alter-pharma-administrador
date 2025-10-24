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

export default function DoctoresPage() {
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorData | null>(null);

  // Filtros
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("");

  // Form fields
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [doctorLicense, setDoctorLicense] = useState("");
  const [doctorBio, setDoctorBio] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<number[]>([]);

  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modals
  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isDetailOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();

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
      filtered = filtered.filter(doctor => doctor.country_id === parseInt(countryFilter));
    }

    if (specialtyFilter) {
      filtered = filtered.filter(doctor =>
        doctor.specialties.some(s => s.id === parseInt(specialtyFilter))
      );
    }

    return filtered;
  }, [doctors, countryFilter, specialtyFilter]);

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

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountryId || selectedSpecialties.length === 0) return;

    setIsLoading(true);
    setErrors({});

    try {
      const params = {
        name: doctorName,
        country_id: selectedCountryId,
        specialties: selectedSpecialties,
        ...(doctorEmail && { email: doctorEmail }),
        ...(doctorPhone && { phone: doctorPhone }),
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

    try {
      const params = {
        name: doctorName,
        country_id: selectedCountryId,
        specialties: selectedSpecialties,
        ...(doctorEmail && { email: doctorEmail }),
        ...(doctorPhone && { phone: doctorPhone }),
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
      console.error("Error cambiando estado del doctor:", error);
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
    setErrors({});
  };

  const handleCloseAdd = () => {
    resetForm();
    setSelectedDoctor(null);
    closeAddModal();
  };

  const openEdit = (doctor: DoctorData) => {
    setSelectedDoctor(doctor);
    setDoctorName(doctor.name);
    setDoctorEmail(doctor.email || "");
    setDoctorPhone(doctor.phone || "");
    setDoctorLicense(doctor.license_number || "");
    setDoctorBio(doctor.bio || "");
    setSelectedCountryId(doctor.country_id);
    setSelectedSpecialties(doctor.specialties.map(s => s.id));
    openEditModal();
  };

  const handleCloseEdit = () => {
    resetForm();
    setSelectedDoctor(null);
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

  const hasActiveFilters = countryFilter || specialtyFilter;

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

        {/* Filtros */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Label className="whitespace-nowrap">Filtrar por:</Label>
            <div className="flex-1 min-w-[200px]">
              <Select
                options={countryFilterOptions}
                placeholder="País"
                onChange={(value) => setCountryFilter(value)}
                defaultValue=""
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select
                options={specialtyFilterOptions}
                placeholder="Especialidad"
                onChange={(value) => setSpecialtyFilter(value)}
                defaultValue=""
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
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {filteredDoctors.map((doctor) => (
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

            {filteredDoctors.length === 0 && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">No hay doctores</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {hasActiveFilters ? "No se encontraron doctores con los filtros seleccionados." : "Comienza agregando un nuevo doctor."}
                </p>
              </div>
            )}
          </div>
        </div>
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
                  onChange={(value) => setSelectedCountryId(parseInt(value))}
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
                <Label>Teléfono</Label>
                <Input
                  type="text"
                  value={doctorPhone}
                  onChange={(e) => setDoctorPhone(e.target.value)}
                  placeholder="Ej: +1 809-555-1234"
                />
              </div>
              <div>
                <Label>Número de licencia</Label>
                <Input
                  type="text"
                  value={doctorLicense}
                  onChange={(e) => setDoctorLicense(e.target.value)}
                  placeholder="Ej: DO-12345"
                />
              </div>
              <div>
                <Label>Biografía</Label>
                <textarea
                  value={doctorBio}
                  onChange={(e) => setDoctorBio(e.target.value)}
                  placeholder="Descripción breve del doctor..."
                  rows={3}
                  className="h-auto w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              <div>
                <Label>Especialidades * (Selecciona al menos una)</Label>
                <div className="space-y-2 mt-2 max-h-[200px] overflow-auto border-t border-b border-gray-200 dark:border-white/[0.05] py-2">
                  {specialties.filter(s => s.status).map((specialty) => (
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
                </div>
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
            <div className="space-y-4 px-2 pb-4 max-h-[500px] overflow-y-auto border-t border-b border-gray-200 dark:border-white/[0.05] pt-4 pb-6">
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
                  onChange={(value) => setSelectedCountryId(parseInt(value))}
                  defaultValue={selectedCountryId?.toString() || ""}
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
                <Label>Teléfono</Label>
                <Input
                  type="text"
                  value={doctorPhone}
                  onChange={(e) => setDoctorPhone(e.target.value)}
                  placeholder="Ej: +1 809-555-1234"
                />
              </div>
              <div>
                <Label>Número de licencia</Label>
                <Input
                  type="text"
                  value={doctorLicense}
                  onChange={(e) => setDoctorLicense(e.target.value)}
                  placeholder="Ej: DO-12345"
                />
              </div>
              <div>
                <Label>Biografía</Label>
                <textarea
                  value={doctorBio}
                  onChange={(e) => setDoctorBio(e.target.value)}
                  placeholder="Descripción breve del doctor..."
                  rows={3}
                  className="h-auto w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              <div>
                <Label>Especialidades * (Selecciona al menos una)</Label>
                <div className="space-y-2 mt-2 max-h-[200px] overflow-auto border-t border-b border-gray-200 dark:border-white/[0.05] py-2">
                  {specialties.filter(s => s.status).map((specialty) => (
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
                </div>
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
                className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  selectedDoctor?.status
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

            {selectedDoctor?.bio && (
              <div>
                <Label>Biografía</Label>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 italic">
                  {selectedDoctor.bio}
                </p>
              </div>
            )}

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
    </>
  );
}
