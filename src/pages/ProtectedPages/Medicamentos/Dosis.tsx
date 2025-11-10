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
import { getDoses, createDose, updateDose, toggleDoseStatus, deleteDose } from "../../../services/protected/doses.services";
import { getProducts } from "../../../services/protected/products.services";
import { DoseData } from "../../../types/services/protected/doses.types";
import { formatDate } from "../../../helper/formatData";

interface ProductOption {
  id: number;
  name: string;
}

export default function DosisPage() {
  const [doses, setDoses] = useState<DoseData[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDose, setSelectedDose] = useState<DoseData | null>(null);

  // Filtros
  const [productFilter, setProductFilter] = useState<string>("");

  // Form fields
  const [dose, setDose] = useState("");
  const [barcode, setBarcode] = useState<string>("");
  const [promotionBuy, setPromotionBuy] = useState<number>(1);
  const [promotionGet, setPromotionGet] = useState<number>(1);
  const [redemptionDays, setRedemptionDays] = useState<number>(30);
  const [maxRedemptionsPerMonth, setMaxRedemptionsPerMonth] = useState<number>(1);
  const [maxRedemptionsPerYear, setMaxRedemptionsPerYear] = useState<number>(1);

  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modals
  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDetailOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  // ID del producto seleccionado para crear dosis
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (productFilter) {
      loadDosesByProduct(parseInt(productFilter));
    } else {
      setDoses([]);
    }
  }, [productFilter]);

  const loadProducts = async () => {
    try {
      const response = await getProducts();
      if (response.status === 200 && Array.isArray(response.data)) {
        setProducts(response.data.map(p => ({
          id: p.id,
          name: p.name
        })));
      }
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  const loadDosesByProduct = async (productId: number) => {
    setIsLoading(true);
    try {
      const response = await getDoses(productId);
      if (response.status === 200 && Array.isArray(response.data)) {
        setDoses(response.data);
      }
    } catch (error) {
      console.error("Error cargando dosis:", error);
      setDoses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    setIsLoading(true);
    setErrors({});

    try {
      const params = {
        dose: dose,
        ...(barcode && { barcode: barcode }),
        promotion_buy: promotionBuy,
        promotion_get: promotionGet,
        redemption_days: redemptionDays,
        max_redemptions_per_month: maxRedemptionsPerMonth,
        max_redemptions_per_year: maxRedemptionsPerYear,
      };

      const response = await createDose(selectedProductId, params);
      if (response.status === 200 || response.status === 201) {
        await loadDosesByProduct(selectedProductId);
        resetForm();
        closeAddModal();
      }
    } catch (error: any) {
      console.error("Error creando dosis:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al crear la dosis" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDose || !selectedProductId) return;

    setIsLoading(true);
    setErrors({});

    try {
      const params = {
        dose: dose,
        ...(barcode && { barcode: barcode }),
        promotion_buy: promotionBuy,
        promotion_get: promotionGet,
        redemption_days: redemptionDays,
        max_redemptions_per_month: maxRedemptionsPerMonth,
        max_redemptions_per_year: maxRedemptionsPerYear,
      };

      const response = await updateDose(selectedProductId, selectedDose.id, params);
      if (response.status === 200) {
        await loadDosesByProduct(selectedProductId);
        resetForm();
        setSelectedDose(null);
        closeEditModal();
      }
    } catch (error: any) {
      console.error("Error editando dosis:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al actualizar la dosis" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (doseItem: DoseData) => {
    if (!selectedProductId) return;
    try {
      await toggleDoseStatus(selectedProductId, doseItem.id);
      await loadDosesByProduct(selectedProductId);
    } catch (error) {
      console.error("Error cambiando estado de dosis:", error);
    }
  };

  const handleDeleteDose = async () => {
    if (!selectedDose || !selectedProductId) return;

    setIsLoading(true);
    try {
      await deleteDose(selectedProductId, selectedDose.id);
      await loadDosesByProduct(selectedProductId);
      setSelectedDose(null);
      closeDeleteModal();
    } catch (error) {
      console.error("Error eliminando dosis:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setDose("");
    setBarcode("");
    setPromotionBuy(1);
    setPromotionGet(1);
    setRedemptionDays(30);
    setMaxRedemptionsPerMonth(1);
    setMaxRedemptionsPerYear(1);
    setErrors({});
  };

  const handleCloseAdd = () => {
    resetForm();
    closeAddModal();
  };

  const openEdit = (doseItem: DoseData) => {
    setSelectedDose(doseItem);
    setDose(doseItem.dose);
    setBarcode(doseItem.barcode || "");
    setPromotionBuy(doseItem.promotion_buy);
    setPromotionGet(doseItem.promotion_get);
    setRedemptionDays(doseItem.redemption_days);
    setMaxRedemptionsPerMonth(doseItem.max_redemptions_per_month);
    setMaxRedemptionsPerYear(doseItem.max_redemptions_per_year);
    openEditModal();
  };

  const handleCloseEdit = () => {
    resetForm();
    setSelectedDose(null);
    closeEditModal();
  };

  const openDetail = (doseItem: DoseData) => {
    setSelectedDose(doseItem);
    openDetailModal();
  };

  const handleCloseDetail = () => {
    setSelectedDose(null);
    closeDetailModal();
  };

  const openDelete = (doseItem: DoseData) => {
    setSelectedDose(doseItem);
    openDeleteModal();
  };

  const handleCloseDelete = () => {
    setSelectedDose(null);
    closeDeleteModal();
  };

  const handleOpenAddModal = () => {
    if (productFilter) {
      setSelectedProductId(parseInt(productFilter));
      openAddModal();
    }
  };

  // Opciones para select de productos
  const productFilterOptions = useMemo(() => {
    return products.map(product => ({
      value: product.id.toString(),
      label: product.name
    }));
  }, [products]);

  const hasProductSelected = !!productFilter;

  return (
    <>
      <PageMeta
        title="Dosis - Medicamentos | Alter Pharma"
        description="Gestión de dosis de productos"
      />
      <PageBreadcrumb pageTitle="Dosis" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Gestión de Dosis
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra las dosis de productos registrados en el sistema
            </p>
          </div>
          <Button onClick={handleOpenAddModal} size="md" disabled={!hasProductSelected}>
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
            Agregar Dosis
          </Button>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2">Producto *</Label>
              <Select
                options={productFilterOptions}
                placeholder="Selecciona un producto"
                onChange={(value) => {
                  setProductFilter(value);
                  setSelectedProductId(value ? parseInt(value) : null);
                }}
                value={productFilter}
              />
            </div>
            {hasProductSelected && (
              <div className="flex items-center gap-2 self-end pb-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {doses.length} dosis
                </span>
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
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Dosis</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Promoción</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Días redención</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Canjes por mes</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Canjes por año</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {doses.map((doseItem) => (
                  <TableRow key={doseItem.id}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{doseItem.id}</TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{doseItem.dose}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Compra {doseItem.promotion_buy} Lleva {doseItem.promotion_get}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {doseItem.redemption_days} días
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {doseItem.max_redemptions_per_month}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {doseItem.max_redemptions_per_year}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Switch
                        label={doseItem.status ? "Activo" : "Inactivo"}
                        defaultChecked={doseItem.status}
                        onChange={() => handleToggleStatus(doseItem)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openDetail(doseItem)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg dark:text-purple-400 dark:hover:bg-purple-900/20" title="Ver detalles">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </button>
                        <button onClick={() => openEdit(doseItem)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20" title="Editar dosis">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button onClick={() => openDelete(doseItem)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20" title="Eliminar dosis">
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

            {!hasProductSelected && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">Selecciona un producto</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Selecciona un producto para ver sus dosis.
                </p>
              </div>
            )}

            {hasProductSelected && doses.length === 0 && !isLoading && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">No hay dosis</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Este producto no tiene dosis registradas.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="px-5 py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                  <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Cargando...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Agregar Dosis */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAdd} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Agregar Nueva Dosis</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completa los datos para registrar una nueva dosis</p>
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
          <form onSubmit={handleAddDose} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4 max-h-[500px] overflow-y-auto border-b border-t pt-4 border-gray-200 dark:border-white/[0.05]">
              <div>
                <Label>Dosis *</Label>
                <Input
                  type="text"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder="Ej: 100mg x 15's"
                />
              </div>
              <div>
                <Label>Código de barras</Label>
                <Input
                  type="number"
                  value={barcode || ""}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Ej: 1234567890"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Opcional - Solo números
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Promoción: Compra *</Label>
                  <Input
                    type="number"
                    value={promotionBuy}
                    onChange={(e) => setPromotionBuy(parseInt(e.target.value))}
                    placeholder="Ej: 2"
                    min="1"
                  />
                </div>
                <div>
                  <Label>Promoción: Lleva *</Label>
                  <Input
                    type="number"
                    value={promotionGet}
                    onChange={(e) => setPromotionGet(parseInt(e.target.value))}
                    placeholder="Ej: 1"
                    min="1"
                  />
                </div>
              </div>
              <div>
                <Label>Días de redención *</Label>
                <Input
                  type="number"
                  value={redemptionDays}
                  onChange={(e) => setRedemptionDays(parseInt(e.target.value))}
                  placeholder="Ej: 30"
                  min="1"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Días disponibles para redimir la promoción
                </p>
              </div>
              <div>
                <Label>Canjes por mes *</Label>
                <Input
                  type="number"
                  value={maxRedemptionsPerMonth}
                  onChange={(e) => setMaxRedemptionsPerMonth(parseInt(e.target.value))}
                  placeholder="Ej: 1"
                  min="1"
                />
              </div>
              <div>
                <Label>Canjes por año *</Label>
                <Input
                  type="number"
                  value={maxRedemptionsPerYear}
                  onChange={(e) => setMaxRedemptionsPerYear(parseInt(e.target.value))}
                  placeholder="Ej: 12"
                  min="1"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseAdd}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !dose || !maxRedemptionsPerMonth || !maxRedemptionsPerYear}>
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Editar Dosis */}
      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Editar Dosis</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Modifica los datos de la dosis seleccionada</p>
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
          <form onSubmit={handleEditDose} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4 max-h-[500px] overflow-y-auto border-b border-t pt-4 border-gray-200 dark:border-white/[0.05]">
              <div>
                <Label>Dosis *</Label>
                <Input
                  type="text"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder="Ej: 100mg x 15's"
                />
              </div>
              <div>
                <Label>Código de barras</Label>
                <Input
                  type="number"
                  value={barcode || ""}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Ej: 1234567890"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Opcional - Solo números
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Promoción: Compra *</Label>
                  <Input
                    type="number"
                    value={promotionBuy}
                    onChange={(e) => setPromotionBuy(parseInt(e.target.value))}
                    placeholder="Ej: 2"
                    min="1"
                  />
                </div>
                <div>
                  <Label>Promoción: Lleva *</Label>
                  <Input
                    type="number"
                    value={promotionGet}
                    onChange={(e) => setPromotionGet(parseInt(e.target.value))}
                    placeholder="Ej: 1"
                    min="1"
                  />
                </div>
              </div>
              <div>
                <Label>Días de redención *</Label>
                <Input
                  type="number"
                  value={redemptionDays}
                  onChange={(e) => setRedemptionDays(parseInt(e.target.value))}
                  placeholder="Ej: 30"
                  min="1"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Días disponibles para redimir la promoción
                </p>
              </div>
              <div>
                <Label>Canjes por mes *</Label>
                <Input
                  type="number"
                  value={maxRedemptionsPerMonth}
                  onChange={(e) => setMaxRedemptionsPerMonth(parseInt(e.target.value))}
                  placeholder="Ej: 1"
                  min="1"
                />
              </div>
              <div>
                <Label>Canjes por año *</Label>
                <Input
                  type="number"
                  value={maxRedemptionsPerYear}
                  onChange={(e) => setMaxRedemptionsPerYear(parseInt(e.target.value))}
                  placeholder="Ej: 12"
                  min="1"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseEdit}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !dose || !maxRedemptionsPerMonth || !maxRedemptionsPerYear}>
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Ver Detalles de Dosis */}
      <Modal isOpen={isDetailOpen} onClose={handleCloseDetail} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {selectedDose?.dose}
            </h4>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  selectedDose?.status
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {selectedDose?.status ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
          <div className="px-2 pb-4 space-y-4">
            <div>
              <Label>Información de promoción</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Promoción Compra:</span> {selectedDose?.promotion_buy}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Promoción Lleva:</span> {selectedDose?.promotion_get}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Días de redención:</span> {selectedDose?.redemption_days} días
                </p>
              </div>
            </div>

            <div>
              <Label>Información de canjes</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Máximo de canjes por mes:</span> {selectedDose?.max_redemptions_per_month}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Máximo de canjes por año:</span> {selectedDose?.max_redemptions_per_year}
                </p>
              </div>
            </div>

            <div>
              <Label>Información adicional</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Creado:</span> {selectedDose && formatDate(selectedDose.created_at)}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Actualizado:</span> {selectedDose && formatDate(selectedDose.updated_at)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" onClick={handleCloseDetail}>Cerrar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmación de Eliminación */}
      <Modal isOpen={isDeleteOpen} onClose={handleCloseDelete} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full dark:bg-red-900/30">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="mb-2 text-2xl font-semibold text-center text-gray-800 dark:text-white/90">Eliminar Dosis</h4>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que deseas eliminar la dosis "{selectedDose?.dose}"? Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" type="button" onClick={handleCloseDelete} disabled={isLoading}>
              Cancelar
            </Button>
            <Button size="sm" type="button" onClick={handleDeleteDose} disabled={isLoading} className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700">
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
