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
import { getUsers, createUser, updateUser, toggleUserStatus, addPermissions, removePermissions } from "../../../services/protected/users.services";
import { getModules } from "../../../services/protected/modules.services";
import { UserData } from "../../../types/services/protected/users.types";
import { ModuleData } from "../../../types/services/protected/modules.types";
import { formatDate } from "../../../helper/formatData";

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // Form fields
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [selectedModules, setSelectedModules] = useState<number[]>([]);

  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modals
  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isPermissionsOpen, openModal: openPermissionsModal, closeModal: closePermissionsModal } = useModal();

  useEffect(() => {
    loadUsers();
    loadModules();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await getUsers();
      if (response.status === 200 && Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await createUser(userName, userEmail, selectedModules);
      if (response.status === 200 || response.status === 201) {
        await loadUsers();
        setUserName("");
        setUserEmail("");
        setSelectedModules([]);
        closeAddModal();
      }
    } catch (error: any) {
      console.error("Error creando usuario:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al crear el usuario" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await updateUser(selectedUser.id, userName, userEmail, selectedModules);
      if (response.status === 200) {
        await loadUsers();
        setUserName("");
        setUserEmail("");
        setSelectedModules([]);
        setSelectedUser(null);
        closeEditModal();
      }
    } catch (error: any) {
      console.error("Error editando usuario:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al actualizar el usuario" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserData) => {
    try {
      await toggleUserStatus(user.id);
      await loadUsers();
    } catch (error) {
      console.error("Error cambiando estado del usuario:", error);
    }
  };

  const handleManagePermissions = async () => {
    if (!selectedUser) return;
    setIsLoading(true);

    try {
      // Get current module IDs
      const currentModuleIds = selectedUser.user_modules.map(m => m.id);
      
      // Modules to add
      const modulesToAdd = selectedModules.filter(id => !currentModuleIds.includes(id));
      
      // Modules to remove
      const modulesToRemove = currentModuleIds.filter(id => !selectedModules.includes(id));

      if (modulesToAdd.length > 0) {
        await addPermissions(selectedUser.id, modulesToAdd);
      }

      if (modulesToRemove.length > 0) {
        await removePermissions(selectedUser.id, modulesToRemove);
      }

      await loadUsers();
      setSelectedModules([]);
      setSelectedUser(null);
      closePermissionsModal();
    } catch (error) {
      console.error("Error gestionando permisos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAdd = () => {
    setUserName("");
    setUserEmail("");
    setSelectedModules([]);
    setSelectedUser(null);
    setErrors({});
    closeAddModal();
  };

  const openEdit = (user: UserData) => {
    setSelectedUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setSelectedModules(user.user_modules.map(m => m.id));
    openEditModal();
  };

  const handleCloseEdit = () => {
    setUserName("");
    setUserEmail("");
    setSelectedModules([]);
    setSelectedUser(null);
    setErrors({});
    closeEditModal();
  };

  const openPermissions = (user: UserData) => {
    setSelectedUser(user);
    setSelectedModules(user.user_modules.map(m => m.id));
    openPermissionsModal();
  };

  const handleClosePermissions = () => {
    setSelectedModules([]);
    setSelectedUser(null);
    closePermissionsModal();
  };

  const toggleModule = (moduleId: number) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  return (
    <>
      <PageMeta
        title="Usuarios - Gestión de Accesos | Alter Pharma"
        description="Gestión de usuarios y sus permisos en el sistema"
      />
      <PageBreadcrumb pageTitle="Usuarios" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Gestión de Usuarios
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra los usuarios del sistema y sus módulos de acceso
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
            Agregar Usuario
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Usuario</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Creado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{user.id}</TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{user.name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Switch
                        label={user.status ? "Activo" : "Inactivo"}
                        defaultChecked={user.status}
                        onChange={() => handleToggleStatus(user)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(user.created_at)}</TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20" title="Editar usuario">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button onClick={() => openPermissions(user)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg dark:text-purple-400 dark:hover:bg-purple-900/20" title="Gestionar permisos">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {users.length === 0 && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">No hay usuarios</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Comienza agregando un nuevo usuario al sistema.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Agregar Usuario */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAdd} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Agregar Nuevo Usuario</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completa los datos para crear un nuevo usuario</p>
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
          <form onSubmit={handleAddUser} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4">
              <div>
                <Label>Nombre completo</Label>
                <Input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Ej: Juan Pérez" />
              </div>
              <div>
                <Label>Correo electrónico</Label>
                <Input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Ej: juan.perez@empresa.com" />
              </div>
              <div>
                <Label>Módulos de acceso</Label>
                <div className="space-y-2 mt-2 max-h-[300px] overflow-auto border-t border-b border-gray-200 dark:border-white/[0.05] py-2">
                  {modules.map((module) => (
                    <label key={module.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <input type="checkbox" checked={selectedModules.includes(module.id)} onChange={() => toggleModule(module.id)} className="w-4 h-4 text-blue-600 rounded" />
                      <div>
                        <span className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">{module.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseAdd}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Usuario'}</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Editar Usuario */}
      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Editar Usuario</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Modifica los datos del usuario seleccionado</p>
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
          <form onSubmit={handleEditUser} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4">
              <div>
                <Label>Nombre completo</Label>
                <Input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Ej: Juan Pérez" />
              </div>
              <div>
                <Label>Correo electrónico (Opcional)</Label>
                <Input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Ej: juan.perez@empresa.com" />
              </div>
              <div>
                <Label>Módulos de acceso</Label>
                <div className="space-y-2 mt-2 max-h-[300px] overflow-auto border-t border-b border-gray-200 dark:border-white/[0.05] py-2">
                  {modules.map((module) => (
                    <label key={module.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <input type="checkbox" checked={selectedModules.includes(module.id)} onChange={() => toggleModule(module.id)} className="w-4 h-4 text-blue-600 rounded" />
                      <div>
                        <span className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">{module.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseEdit}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Gestionar Permisos */}
      <Modal isOpen={isPermissionsOpen} onClose={handleClosePermissions} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Gestionar Permisos</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Administra los módulos de acceso de {selectedUser?.name}</p>
          </div>
          <div className="px-2 pb-4">
            <Label>Módulos de acceso</Label>
            <div className="space-y-2 mt-2 max-h-[300px] overflow-auto border-t border-b border-gray-200 dark:border-white/[0.05] py-2">
              {modules.map((module) => (
                <label key={module.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input type="checkbox" checked={selectedModules.includes(module.id)} onChange={() => toggleModule(module.id)} className="w-4 h-4 text-blue-600 rounded" />
                  <div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">{module.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={handleClosePermissions}>Cancelar</Button>
            <Button size="sm" onClick={handleManagePermissions} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Permisos'}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
