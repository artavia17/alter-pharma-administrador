import { useEffect, useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Alert from "../../../components/ui/alert/Alert";
import { useModal } from "../../../hooks/useModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { getModules, createModule, updateModule, deleteModule } from "../../../services/protected/modules.services";
import { ModuleData } from "../../../types/services/protected/modules.types";
import { formatDate } from "../../../helper/formatData";

export default function ModulosPage() {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);

  // Form fields
  const [moduleName, setModuleName] = useState("");

  // Modals
  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const response = await getModules();
      if (response.status === 200 && Array.isArray(response.data)) {
        setModules(response.data);
      }
    } catch (error) {
      console.error("Error cargando módulos:", error);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await createModule(moduleName);
      if (response.status === 200 || response.status === 201) {
        await loadModules();
        setModuleName("");
        closeAddModal();
      }
    } catch (error) {
      console.error("Error creando módulo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;

    setIsLoading(true);

    try {
      const response = await updateModule(selectedModule.id, moduleName);
      if (response.status === 200) {
        await loadModules();
        setModuleName("");
        setSelectedModule(null);
        closeEditModal();
      }
    } catch (error) {
      console.error("Error editando módulo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!selectedModule) return;

    setIsLoading(true);

    try {
      const response = await deleteModule(selectedModule.id);
      if (response.status === 200) {
        await loadModules();
        setSelectedModule(null);
        closeDeleteModal();
      }
    } catch (error) {
      console.error("Error eliminando módulo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (module: ModuleData) => {
    setSelectedModule(module);
    setModuleName(module.name);
    openEditModal();
  };

  const openDelete = (module: ModuleData) => {
    setSelectedModule(module);
    openDeleteModal();
  };

  return (
    <>
      <PageMeta
        title="Módulos - Gestión de Accesos | Alter Pharma"
        description="Gestión de módulos y permisos del sistema"
      />
      <PageBreadcrumb pageTitle="Módulos" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Gestión de Módulos
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra los módulos del sistema y sus permisos
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
            Agregar Módulo
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nombre</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Creado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {modules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{module.id}</TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90 capitalize">{module.name}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(module.created_at)}</TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(module)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20" title="Editar módulo">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button onClick={() => openDelete(module)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20" title="Eliminar módulo">
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
          </div>
        </div>
      </div>

      <Modal isOpen={isAddOpen} onClose={closeAddModal} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Agregar Nuevo Módulo</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completa los datos para crear un nuevo módulo</p>
          </div>
          <div className="mb-6">
            <Alert variant="warning" title="Importante" message="Agregar un nuevo módulo requiere configuración interna adicional para asignar permisos a las páginas correspondientes. Contacta al equipo de soporte técnico para completar la configuración." showLink={false} />
          </div>
          <form onSubmit={handleAddModule} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4">
              <div>
                <Label>Nombre del módulo</Label>
                <Input type="text" value={moduleName} onChange={(e) => setModuleName(e.target.value)} placeholder="Ej: users, products, settings" />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={closeAddModal}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Módulo'}</Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={closeEditModal} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Editar Módulo</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Modifica los datos del módulo seleccionado</p>
          </div>
          <div className="mb-6">
            <Alert variant="warning" title="¡Advertencia Importante!" message="Si editas el nombre del módulo y no se actualiza a nivel interno en el código, todos los permisos asociados dejarán de funcionar correctamente en el sistema. Asegúrate de coordinar con el equipo de desarrollo antes de modificar este módulo." showLink={false} />
          </div>
          <form onSubmit={handleEditModule} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4">
              <div>
                <Label>Nombre del módulo</Label>
                <Input type="text" value={moduleName} onChange={(e) => setModuleName(e.target.value)} placeholder="Ej: users, products, settings" />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={closeEditModal}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={closeDeleteModal} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Eliminar Módulo</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Esta acción no se puede deshacer</p>
          </div>
          <div className="mb-6">
            <Alert variant="error" title="¡Peligro - Acción Crítica!" message={`Estás a punto de eliminar el módulo "${selectedModule?.name}". Esta acción eliminará permanentemente todos los permisos asociados. Si este módulo no se elimina también a nivel interno en el código, el sistema puede presentar errores críticos de funcionamiento.`} showLink={false} />
          </div>
          <div className="px-2 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">¿Estás seguro de que deseas continuar?</p>
          </div>
          <div className="flex items-center gap-3 px-2 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeDeleteModal}>Cancelar</Button>
            <Button size="sm" onClick={handleDeleteModule} disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white">{isLoading ? 'Eliminando...' : 'Eliminar Módulo'}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
