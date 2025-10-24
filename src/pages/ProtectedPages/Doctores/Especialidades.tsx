import { useEffect, useState } from "react";
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
import { getSpecialties, createSpecialty, updateSpecialty, toggleSpecialtyStatus, deleteSpecialty, getSpecialty } from "../../../services/protected/specialties.services";
import { SpecialtyData, SpecialtyDetailData } from "../../../types/services/protected/specialties.types";
import { formatDate } from "../../../helper/formatData";

export default function EspecialidadesPage() {
  const [specialties, setSpecialties] = useState<SpecialtyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyData | null>(null);
  const [specialtyDetail, setSpecialtyDetail] = useState<SpecialtyDetailData | null>(null);

  // Form fields
  const [specialtyName, setSpecialtyName] = useState("");

  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modals
  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isDetailOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();

  useEffect(() => {
    loadSpecialties();
  }, []);

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

  const loadSpecialtyDetail = async (id: number) => {
    try {
      const response = await getSpecialty(id);
      if (response.status === 200 && response.data) {
        setSpecialtyDetail(response.data as SpecialtyDetailData);
      }
    } catch (error) {
      console.error("Error cargando detalle de especialidad:", error);
    }
  };

  const handleAddSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await createSpecialty(specialtyName);
      if (response.status === 200 || response.status === 201) {
        await loadSpecialties();
        setSpecialtyName("");
        closeAddModal();
      }
    } catch (error: any) {
      console.error("Error creando especialidad:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al crear la especialidad" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpecialty) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await updateSpecialty(selectedSpecialty.id, specialtyName);
      if (response.status === 200) {
        await loadSpecialties();
        setSpecialtyName("");
        setSelectedSpecialty(null);
        closeEditModal();
      }
    } catch (error: any) {
      console.error("Error editando especialidad:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al actualizar la especialidad" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (specialty: SpecialtyData) => {
    try {
      await toggleSpecialtyStatus(specialty.id);
      await loadSpecialties();
    } catch (error) {
      console.error("Error cambiando estado de especialidad:", error);
    }
  };

  const handleDeleteSpecialty = async () => {
    if (!selectedSpecialty) return;
    setIsLoading(true);

    try {
      await deleteSpecialty(selectedSpecialty.id);
      await loadSpecialties();
      setSelectedSpecialty(null);
      closeDeleteModal();
    } catch (error) {
      console.error("Error eliminando especialidad:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAdd = () => {
    setSpecialtyName("");
    setSelectedSpecialty(null);
    setErrors({});
    closeAddModal();
  };

  const openEdit = (specialty: SpecialtyData) => {
    setSelectedSpecialty(specialty);
    setSpecialtyName(specialty.name);
    openEditModal();
  };

  const handleCloseEdit = () => {
    setSpecialtyName("");
    setSelectedSpecialty(null);
    setErrors({});
    closeEditModal();
  };

  const openDelete = (specialty: SpecialtyData) => {
    setSelectedSpecialty(specialty);
    openDeleteModal();
  };

  const handleCloseDelete = () => {
    setSelectedSpecialty(null);
    closeDeleteModal();
  };

  const openDetail = async (specialty: SpecialtyData) => {
    setSelectedSpecialty(specialty);
    await loadSpecialtyDetail(specialty.id);
    openDetailModal();
  };

  const handleCloseDetail = () => {
    setSelectedSpecialty(null);
    setSpecialtyDetail(null);
    closeDetailModal();
  };

  return (
    <>
      <PageMeta
        title="Especialidades - Doctores | Alter Pharma"
        description="Gestión de especialidades médicas en el sistema"
      />
      <PageBreadcrumb pageTitle="Especialidades" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Gestión de Especialidades
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra las especialidades médicas disponibles
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
            Agregar Especialidad
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Especialidad</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Doctores</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Creado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {specialties.map((specialty) => (
                  <TableRow key={specialty.id}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{specialty.id}</TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{specialty.name}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        {specialty.doctors_count} doctor{specialty.doctors_count !== 1 ? 'es' : ''}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Switch
                        label={specialty.status ? "Activo" : "Inactivo"}
                        defaultChecked={specialty.status}
                        onChange={() => handleToggleStatus(specialty)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(specialty.created_at)}</TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openDetail(specialty)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg dark:text-purple-400 dark:hover:bg-purple-900/20" title="Ver doctores">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </button>
                        <button onClick={() => openEdit(specialty)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20" title="Editar especialidad">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button onClick={() => openDelete(specialty)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20" title="Eliminar especialidad">
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

            {specialties.length === 0 && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">No hay especialidades</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Comienza agregando una nueva especialidad médica.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Agregar Especialidad */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAdd} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Agregar Nueva Especialidad</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completa los datos para crear una nueva especialidad médica</p>
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
          <form onSubmit={handleAddSpecialty} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4">
              <div>
                <Label>Nombre de la especialidad</Label>
                <Input
                  type="text"
                  value={specialtyName}
                  onChange={(e) => setSpecialtyName(e.target.value)}
                  placeholder="Ej: Cardiología"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseAdd}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !specialtyName}>{isLoading ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Editar Especialidad */}
      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Editar Especialidad</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Modifica los datos de la especialidad seleccionada</p>
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
          <form onSubmit={handleEditSpecialty} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4">
              <div>
                <Label>Nombre de la especialidad</Label>
                <Input
                  type="text"
                  value={specialtyName}
                  onChange={(e) => setSpecialtyName(e.target.value)}
                  placeholder="Ej: Cardiología"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseEdit}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !specialtyName}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Eliminar Especialidad */}
      <Modal isOpen={isDeleteOpen} onClose={handleCloseDelete} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Eliminar Especialidad</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que deseas eliminar la especialidad <strong>{selectedSpecialty?.name}</strong>?
            </p>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={handleCloseDelete}>Cancelar</Button>
            <Button size="sm" onClick={handleDeleteSpecialty} disabled={isLoading} className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700">
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Ver Doctores de la Especialidad */}
      <Modal isOpen={isDetailOpen} onClose={handleCloseDetail} className="max-w-[800px] m-4">
        <div className="no-scrollbar relative w-full max-w-[800px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Doctores en {selectedSpecialty?.name}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {specialtyDetail?.doctors?.length || 0} doctor{specialtyDetail?.doctors?.length !== 1 ? 'es' : ''} registrado{specialtyDetail?.doctors?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="px-2 pb-4">
            {specialtyDetail?.doctors && specialtyDetail.doctors.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {specialtyDetail.doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-800 dark:text-white/90">{doctor.name}</h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{doctor.email}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{doctor.phone}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          Licencia: {doctor.license_number}
                        </p>
                        {doctor.bio && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                            {doctor.bio}
                          </p>
                        )}
                      </div>
                      <span
                        className={`ml-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          doctor.status
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {doctor.status ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">
                  No hay doctores asignados
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Esta especialidad aún no tiene doctores registrados.
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" onClick={handleCloseDetail}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
