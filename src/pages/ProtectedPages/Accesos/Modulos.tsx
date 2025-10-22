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
import { getModules, createModule } from "../../../services/protected/modules.services";
import { ModuleData } from "../../../types/services/protected/modules.types";
import { formatDate } from "../../../helper/formatData";

export default function ModulosPage() {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [moduleName, setModuleName] = useState("");

  // Modals
  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();

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
    </>
  );
}
