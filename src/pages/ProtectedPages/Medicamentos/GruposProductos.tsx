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
import {
  getProductGroups,
  createProductGroup,
  updateProductGroup,
  deleteProductGroup,
  toggleProductGroupStatus,
} from "../../../services/protected/product-groups.services";
import { ProductGroupData } from "../../../types/services/protected/product-groups.types";
import { formatDate } from "../../../helper/formatData";

export default function GruposProductosPage() {
  const [productGroups, setProductGroups] = useState<ProductGroupData[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ProductGroupData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modals
  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();

  useEffect(() => {
    loadProductGroups();
  }, []);

  const loadProductGroups = async () => {
    try {
      const response = await getProductGroups();
      if (response.status === 200 && Array.isArray(response.data)) {
        setProductGroups(response.data);
      }
    } catch (error) {
      console.error("Error cargando grupos de productos:", error);
    }
  };

  // Filtrar grupos
  const filteredGroups = useMemo(() => {
    let filtered = productGroups;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [productGroups, searchQuery]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGroups = filteredGroups.slice(startIndex, endIndex);

  // Resetear a la página 1 cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsActive(true);
    setErrors({});
  };

  const handleAddGroup = () => {
    resetForm();
    openAddModal();
  };

  const handleEditGroup = (group: ProductGroupData) => {
    setSelectedGroup(group);
    setName(group.name);
    setDescription(group.description);
    setIsActive(group.is_active);
    setErrors({});
    openEditModal();
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validación básica
    const validationErrors: Record<string, string> = {};
    if (!name.trim()) {
      validationErrors.name = "El nombre es requerido";
    }
    if (!description.trim()) {
      validationErrors.description = "La descripción es requerida";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const params = {
        name,
        description,
        is_active: isActive,
      };

      const response = selectedGroup
        ? await updateProductGroup(selectedGroup.id, params)
        : await createProductGroup(params);

      if (response.status === 200 || response.status === 201) {
        loadProductGroups();
        closeAddModal();
        closeEditModal();
        resetForm();
      }
    } catch (error: any) {
      console.error("Error guardando grupo:", error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: error.response?.data?.message || "Error al guardar el grupo" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (group: ProductGroupData) => {
    try {
      await toggleProductGroupStatus(group.id);
      loadProductGroups();
    } catch (error: any) {
      console.error("Error cambiando estado:", error);
      alert(error.response?.data?.message || "Error al cambiar el estado");
    }
  };

  const handleDeleteGroup = async (group: ProductGroupData) => {
    if (!confirm(`¿Estás seguro de eliminar el grupo "${group.name}"?`)) return;

    try {
      await deleteProductGroup(group.id);
      loadProductGroups();
    } catch (error: any) {
      console.error("Error eliminando grupo:", error);
      alert(error.response?.data?.message || "Error al eliminar el grupo. Puede que tenga productos asociados.");
    }
  };

  // Función para generar números de página
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

  return (
    <>
      <PageMeta
        title="Grupos de Productos | Alter Pharma"
        description="Gestión de grupos de productos"
      />
      <PageBreadcrumb pageTitle="Grupos de Productos" />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {/* Filtros y búsqueda */}
        <div className="flex flex-col gap-4 p-5 border-b border-gray-200 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between">
          {/* Buscador */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar grupos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 rounded-lg border border-gray-300 bg-transparent py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 fill-gray-500 dark:fill-gray-400"
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.04175 9.37508C3.04175 5.87617 5.87617 3.04175 9.37508 3.04175C12.874 3.04175 15.7084 5.87617 15.7084 9.37508C15.7084 12.874 12.874 15.7084 9.37508 15.7084C5.87617 15.7084 3.04175 12.874 3.04175 9.37508ZM9.37508 1.54175C5.04774 1.54175 1.54175 5.04774 1.54175 9.37508C1.54175 13.7024 5.04774 17.2084 9.37508 17.2084C11.2674 17.2084 13.003 16.5469 14.3638 15.4436L17.6364 18.7162C17.9293 19.0091 18.4042 19.0091 18.6971 18.7162C18.99 18.4233 18.99 17.9484 18.6971 17.6555L15.4436 14.3638C16.5469 13.003 17.2084 11.2674 17.2084 9.37508C17.2084 5.04774 13.7024 1.54175 9.37508 1.54175Z"
              />
            </svg>
          </div>

          <Button onClick={handleAddGroup}>
            Nuevo Grupo
          </Button>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Nombre
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Descripción
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Productos
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Fecha Creación
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Estado
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGroups.length > 0 ? (
                paginatedGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {group.name}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                        {group.description}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                        {group.products_count || 0}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                        {formatDate(group.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Switch
                        label={group.is_active ? "Activo" : "Inactivo"}
                        defaultChecked={group.is_active}
                        onChange={() => handleToggleStatus(group)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditGroup(group)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                          title="Editar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800 dark:hover:text-red-400"
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron grupos de productos
                  </td>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {filteredGroups.length > 0 && (
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
                    <span className="font-medium">{Math.min(endIndex, filteredGroups.length)}</span> de{' '}
                    <span className="font-medium">{filteredGroups.length}</span> resultados
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

      {/* Modal Agregar/Editar */}
      <Modal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => {
          closeAddModal();
          closeEditModal();
          resetForm();
        }}
        className="max-w-2xl m-4"
      >
        <div className="no-scrollbar relative w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {selectedGroup ? "Editar Grupo de Productos" : "Nuevo Grupo de Productos"}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedGroup
                ? "Modifica la información del grupo de productos"
                : "Completa los datos para crear un nuevo grupo"}
            </p>
          </div>

          {errors.general && (
            <div className="px-2 mb-4">
              <Alert variant="error" title="Error" message={errors.general} />
            </div>
          )}

          <form onSubmit={handleSaveGroup} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4 max-h-[500px] overflow-y-auto border-b border-t pt-4 border-gray-200 dark:border-white/[0.05]">
              <div>
                <Label>Nombre del Grupo *</Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Analgésicos, Antibióticos, etc."
                  error={!!errors.name}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label>Descripción *</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe las características del grupo de productos..."
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/[0.03] dark:text-white/90 resize-none ${
                    errors.description ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-white/[0.05]'
                  }`}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/[0.02] rounded-lg">
                <Switch
                  checked={isActive}
                  onChange={setIsActive}
                />
                <div>
                  <Label className="mb-0 font-medium">Estado Activo</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Los grupos activos estarán disponibles para asignar a productos
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 px-2 pt-4 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  closeAddModal();
                  closeEditModal();
                  resetForm();
                }}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  selectedGroup ? "Actualizar Grupo" : "Crear Grupo"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
