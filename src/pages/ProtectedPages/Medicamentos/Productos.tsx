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
import { getProducts, createProduct, updateProduct, toggleProductStatus, deleteProduct } from "../../../services/protected/products.services";
import { getCountries } from "../../../services/protected/countries.services";
import { ProductData } from "../../../types/services/protected/products.types";
import { CountryData } from "../../../types/services/protected/countries.types";
import { formatDate } from "../../../helper/formatData";

export default function ProductosPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);

  // Form fields
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<number[]>([]);

  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modals
  const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDetailOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  useEffect(() => {
    loadProducts();
    loadCountries();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await getProducts();
      if (response.status === 200 && Array.isArray(response.data)) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error("Error cargando productos:", error);
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setErrors({});

    try {
      const params = {
        name: productName,
        description: productDescription || undefined,
        country_ids: selectedCountries,
      };

      const response = await createProduct(params);
      if (response.status === 200 || response.status === 201) {
        await loadProducts();
        resetForm();
        closeAddModal();
      }
    } catch (error: any) {
      console.error("Error creando producto:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al crear el producto" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsLoading(true);
    setErrors({});

    try {
      const params = {
        name: productName,
        description: productDescription || undefined,
        country_ids: selectedCountries,
      };

      const response = await updateProduct(selectedProduct.id, params);
      if (response.status === 200) {
        await loadProducts();
        resetForm();
        setSelectedProduct(null);
        closeEditModal();
      }
    } catch (error: any) {
      console.error("Error editando producto:", error);
      if (error.response?.status === 422 && error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al actualizar el producto" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (product: ProductData) => {
    try {
      await toggleProductStatus(product.id);
      await loadProducts();
    } catch (error) {
      console.error("Error cambiando estado de producto:", error);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    setIsLoading(true);

    try {
      await deleteProduct(selectedProduct.id);
      await loadProducts();
      setSelectedProduct(null);
      closeDeleteModal();
    } catch (error) {
      console.error("Error eliminando producto:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setProductName("");
    setProductDescription("");
    setSelectedCountries([]);
    setErrors({});
  };

  const handleCloseAdd = () => {
    resetForm();
    setSelectedProduct(null);
    closeAddModal();
  };

  const openEdit = (product: ProductData) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setProductDescription(product.description || "");
    setSelectedCountries(product.country_ids);
    openEditModal();
  };

  const handleCloseEdit = () => {
    resetForm();
    setSelectedProduct(null);
    closeEditModal();
  };

  const openDetail = (product: ProductData) => {
    setSelectedProduct(product);
    openDetailModal();
  };

  const handleCloseDetail = () => {
    setSelectedProduct(null);
    closeDetailModal();
  };

  const openDelete = (product: ProductData) => {
    setSelectedProduct(product);
    openDeleteModal();
  };

  const handleCloseDelete = () => {
    setSelectedProduct(null);
    closeDeleteModal();
  };

  const handleCountryToggle = (countryId: number) => {
    setSelectedCountries(prev => {
      if (prev.includes(countryId)) {
        return prev.filter(id => id !== countryId);
      } else {
        return [...prev, countryId];
      }
    });
  };

  const getCountryName = (countryId: number): string => {
    const country = countries.find(c => c.id === countryId);
    return country?.name || "";
  };

  const getCountryCode = (countryId: number): string => {
    const country = countries.find(c => c.id === countryId);
    return country?.code || "";
  };

  const truncateDescription = (text: string, maxLength: number = 50): string => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <>
      <PageMeta
        title="Productos | Alter Pharma"
        description="Gestión de productos en el sistema"
      />
      <PageBreadcrumb pageTitle="Productos" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Gestión de Productos
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra los productos registrados en el sistema
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
            Agregar Producto
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nombre</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Descripción</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Países</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Dosis</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{product.id}</TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{product.name}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {product.description ? truncateDescription(product.description) : "Sin descripción"}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="flex flex-wrap gap-1">
                        {product.country_ids.map((countryId) => (
                          <span
                            key={countryId}
                            className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          >
                            {getCountryCode(countryId)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        {product.doses?.length || 0}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Switch
                        label={product.status ? "Activo" : "Inactivo"}
                        defaultChecked={product.status}
                        onChange={() => handleToggleStatus(product)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openDetail(product)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg dark:text-purple-400 dark:hover:bg-purple-900/20" title="Ver detalles">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </button>
                        <button onClick={() => openEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20" title="Editar producto">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button onClick={() => openDelete(product)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20" title="Eliminar producto">
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

            {products.length === 0 && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">No hay productos</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Comienza agregando un nuevo producto.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Agregar Producto */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAdd} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Agregar Nuevo Producto</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completa los datos para registrar un nuevo producto</p>
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
          <form onSubmit={handleAddProduct} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4 max-h-[500px] overflow-y-auto border-b border-t pt-4 border-gray-200 dark:border-white/[0.05]">
              <div>
                <Label>Nombre del producto *</Label>
                <Input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ej: Paracetamol"
                />
              </div>
              <div>
                <Label>Descripción (opcional)</Label>
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Descripción del producto..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/[0.03] dark:border-white/[0.05] dark:text-white/90 resize-none"
                />
              </div>
              <div>
                <Label>Países * (selecciona al menos uno)</Label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {countries
                    .filter(country => country.status)
                    .map((country) => (
                      <label
                        key={country.id}
                        className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 dark:border-white/[0.05] dark:hover:bg-white/[0.03]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCountries.includes(country.id)}
                          onChange={() => handleCountryToggle(country.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-800 dark:text-white/90">{country.name}</span>
                        <span className="ml-auto inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {country.code}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseAdd}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !productName || selectedCountries.length === 0}>
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Editar Producto */}
      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Editar Producto</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Modifica los datos del producto seleccionado</p>
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
          <form onSubmit={handleEditProduct} className="flex flex-col">
            <div className="space-y-4 px-2 pb-4 max-h-[500px] overflow-y-auto border-b border-t pt-4 border-gray-200 dark:border-white/[0.05]">
              <div>
                <Label>Nombre del producto *</Label>
                <Input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ej: Paracetamol"
                />
              </div>
              <div>
                <Label>Descripción (opcional)</Label>
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Descripción del producto..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/[0.03] dark:border-white/[0.05] dark:text-white/90 resize-none"
                />
              </div>
              <div>
                <Label>Países * (selecciona al menos uno)</Label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {countries
                    .filter(country => country.status)
                    .map((country) => (
                      <label
                        key={country.id}
                        className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 dark:border-white/[0.05] dark:hover:bg-white/[0.03]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCountries.includes(country.id)}
                          onChange={() => handleCountryToggle(country.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-800 dark:text-white/90">{country.name}</span>
                        <span className="ml-auto inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {country.code}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseEdit}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isLoading || !productName || selectedCountries.length === 0}>
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Ver Detalles de Producto */}
      <Modal isOpen={isDetailOpen} onClose={handleCloseDetail} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {selectedProduct?.name}
            </h4>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  selectedProduct?.status
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {selectedProduct?.status ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
          <div className="px-2 pb-4 space-y-4 max-h-[500px] overflow-y-auto">
            <div>
              <Label>Descripción</Label>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {selectedProduct?.description || "Sin descripción"}
              </p>
            </div>

            <div>
              <Label>Países asignados</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedProduct?.country_ids.map((countryId) => (
                  <span
                    key={countryId}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    {getCountryName(countryId)}
                    <span className="text-xs opacity-75">{getCountryCode(countryId)}</span>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label>Dosis ({selectedProduct?.doses?.length || 0})</Label>
              {selectedProduct?.doses && selectedProduct.doses.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {selectedProduct.doses.map((dose) => (
                    <div
                      key={dose.id}
                      className="p-3 border border-gray-200 rounded-lg dark:border-white/[0.05]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 dark:text-white/90">{dose.dose}</p>
                          <div className="mt-1 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <p>Canjes por mes: <span className="font-medium">{dose.max_redemptions_per_month}</span></p>
                            <p>Canjes por año: <span className="font-medium">{dose.max_redemptions_per_year}</span></p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            dose.status
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {dose.status ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  No hay dosis registradas para este producto
                </p>
              )}
            </div>

            <div>
              <Label>Información adicional</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Creado:</span> {selectedProduct && formatDate(selectedProduct.created_at)}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Actualizado:</span> {selectedProduct && formatDate(selectedProduct.updated_at)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" onClick={handleCloseDetail}>Cerrar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar Eliminación */}
      <Modal isOpen={isDeleteOpen} onClose={handleCloseDelete} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Confirmar Eliminación</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que deseas eliminar el producto "{selectedProduct?.name}"?
            </p>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" type="button" onClick={handleCloseDelete} disabled={isLoading}>
              Cancelar
            </Button>
            <Button size="sm" type="button" onClick={handleDeleteProduct} disabled={isLoading} className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700">
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
