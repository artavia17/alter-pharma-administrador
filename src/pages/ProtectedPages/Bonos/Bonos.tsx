import { useEffect, useState, useMemo } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import useTitle from "../../../hooks/useTitle";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Alert from "../../../components/ui/alert/Alert";
import { formatDate } from "../../../helper/formatData";
import {
  getAllBonuses,
  getBonus,
  getBonusStatistics,
  createBonus,
  cancelBonus,
} from "../../../services/protected/bonuses.services";
import { searchPatients } from "../../../services/protected/patients.services";
import { getProducts } from "../../../services/protected/products.services";
import { getDoses } from "../../../services/protected/doses.services";
import { BonusData, BonusStatistics } from "../../../types/services/protected/bonuses.types";
import { PatientData } from "../../../types/services/protected/patients.types";
import { ProductData } from "../../../types/services/protected/products.types";
import { DoseData } from "../../../types/services/protected/doses.types";

export default function Bonos() {
  useTitle("Bonos");

  // Modals
  const {
    isOpen: isAddModalOpen,
    openModal: openAddModal,
    closeModal: closeAddModal,
  } = useModal();
  const {
    isOpen: isDetailModalOpen,
    openModal: openDetailModal,
    closeModal: closeDetailModal,
  } = useModal();

  // State
  const [bonuses, setBonuses] = useState<BonusData[]>([]);
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [doses, setDoses] = useState<DoseData[]>([]);
  const [statistics, setStatistics] = useState<BonusStatistics | null>(null);
  const [selectedBonus, setSelectedBonus] = useState<BonusData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Form fields
  const [patientId, setPatientId] = useState<number>(0);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [searchPatientName, setSearchPatientName] = useState<string>("");
  const [searchPatientEmail, setSearchPatientEmail] = useState<string>("");
  const [searchPatientPhone, setSearchPatientPhone] = useState<string>("");
  const [searchPatientIdentification, setSearchPatientIdentification] = useState<string>("");
  const [showPatientResults, setShowPatientResults] = useState<boolean>(false);
  const [searchingPatients, setSearchingPatients] = useState<boolean>(false);
  const [productId, setProductId] = useState<number>(0);
  const [productDoseId, setProductDoseId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [expirationDays, setExpirationDays] = useState<number>(60);
  const [notes, setNotes] = useState<string>("");
  const [sendEmail, setSendEmail] = useState<boolean>(true);
  const [isAssigningBonus, setIsAssigningBonus] = useState<boolean>(false);

  // Alerts
  const [alert, setAlert] = useState<{
    show: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }>({ show: false, type: "success", title: "", message: "" });

  const [modalAlert, setModalAlert] = useState<{
    show: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }>({ show: false, type: "success", title: "", message: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadBonuses(), loadProducts(), loadStatistics()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBonuses = async () => {
    try {
      const response = await getAllBonuses();
      if (response.status === 200 && Array.isArray(response.data)) {
        setBonuses(response.data);
      }
    } catch (error) {
      console.error("Error loading bonuses:", error);
    }
  };

  const handlePatientSearch = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Validar que haya al menos un filtro
    if (!searchPatientName && !searchPatientEmail && !searchPatientPhone && !searchPatientIdentification) {
      setModalAlert({
        show: true,
        type: "error",
        title: "Error",
        message: "Debe proporcionar al menos un filtro de búsqueda",
      });
      return;
    }

    setSearchingPatients(true);
    setPatients([]);
    setModalAlert({ show: false, type: "success", title: "", message: "" });
    try {
      const params: any = {};
      if (searchPatientName) params.name = searchPatientName;
      if (searchPatientEmail) params.email = searchPatientEmail;
      if (searchPatientPhone) params.phone = searchPatientPhone;
      if (searchPatientIdentification) params.identification_number = searchPatientIdentification;

      const response = await searchPatients(params);

      if (response.status === 200 && Array.isArray(response.data)) {
        setPatients(response.data);
        setShowPatientResults(true);
        if (response.data.length === 0) {
          setModalAlert({
            show: true,
            type: "warning",
            title: "Sin resultados",
            message: "No se encontraron pacientes con los criterios de búsqueda",
          });
        }
      }
    } catch (error: any) {
      console.error("Error searching patients:", error);
      setPatients([]);
      setShowPatientResults(false);
      setModalAlert({
        show: true,
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Ocurrió un error al buscar pacientes",
      });
    } finally {
      setSearchingPatients(false);
    }
  };

  const handleSelectPatient = (patient: PatientData) => {
    setSelectedPatient(patient);
    setPatientId(patient.id);
    setShowPatientResults(false);
    setSearchPatientName("");
    setSearchPatientEmail("");
    setSearchPatientPhone("");
    setSearchPatientIdentification("");
  };

  const handleResetPatientSearch = () => {
    setSearchPatientName("");
    setSearchPatientEmail("");
    setSearchPatientPhone("");
    setSearchPatientIdentification("");
    setPatients([]);
    setShowPatientResults(false);
    setSelectedPatient(null);
    setPatientId(0);
  };

  const loadProducts = async () => {
    try {
      const response = await getProducts();
      if (response.status === 200 && Array.isArray(response.data)) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await getBonusStatistics();
      if (response.status === 200) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const loadDosesByProduct = async (productId: number) => {
    try {
      const response = await getDoses(productId);
      if (response.status === 200 && Array.isArray(response.data)) {
        setDoses(response.data);
      }
    } catch (error) {
      console.error("Error loading doses:", error);
      setDoses([]);
    }
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProductId = parseInt(e.target.value);
    setProductId(newProductId);
    setProductDoseId(0);
    if (newProductId > 0) {
      loadDosesByProduct(newProductId);
    } else {
      setDoses([]);
    }
  };

  const resetForm = () => {
    handleResetPatientSearch();
    setProductId(0);
    setProductDoseId(0);
    setQuantity(1);
    setExpirationDays(60);
    setNotes("");
    setSendEmail(true);
    setDoses([]);
    setModalAlert({ show: false, type: "success", title: "", message: "" });
  };

  const handleAddBonus = async (e: React.FormEvent) => {
    e.preventDefault();

    if (patientId === 0 || productDoseId === 0) {
      setModalAlert({
        show: true,
        type: "error",
        title: "Error",
        message: "Debe seleccionar un paciente y una presentación de producto",
      });
      return;
    }

    setIsAssigningBonus(true);
    setModalAlert({ show: false, type: "success", title: "", message: "" });
    try {
      const response = await createBonus(patientId, {
        product_dose_id: productDoseId,
        quantity,
        expiration_days: expirationDays,
        notes,
        send_email: sendEmail,
      });

      if (response.status === 201) {
        setAlert({
          show: true,
          type: "success",
          title: "Éxito",
          message: response.message,
        });
        resetForm();
        closeAddModal();
        loadBonuses();
        loadStatistics();
      }
    } catch (error: any) {
      console.error("Error creating bonus:", error);
      setModalAlert({
        show: true,
        type: "error",
        title: "Error",
        message:
          error?.response?.data?.message || "No se pudo asignar el bono",
      });
    } finally {
      setIsAssigningBonus(false);
    }
  };

  const openDetail = async (bonus: BonusData) => {
    try {
      const response = await getBonus(bonus.id);
      if (response.status === 200) {
        setSelectedBonus(response.data);
        openDetailModal();
      }
    } catch (error) {
      console.error("Error loading bonus detail:", error);
    }
  };

  const handleCancelBonus = async (bonusId: number) => {
    if (!confirm("¿Está seguro que desea cancelar este bono?")) return;

    try {
      const response = await cancelBonus(bonusId);
      if (response.status === 200) {
        setAlert({
          show: true,
          type: "success",
          title: "Éxito",
          message: "Bono cancelado exitosamente",
        });
        loadBonuses();
        loadStatistics();
        closeDetailModal();
      }
    } catch (error: any) {
      console.error("Error canceling bonus:", error);
      setAlert({
        show: true,
        type: "error",
        title: "Error",
        message:
          error?.response?.data?.message || "No se pudo cancelar el bono",
      });
    }
  };

  const filteredBonuses = useMemo(() => {
    return bonuses.filter((bonus) => {
      const matchesSearch =
        bonus.patient?.first_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        bonus.patient?.last_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        bonus.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bonus.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "" || bonus.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bonuses, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <span className="inline-flex rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">
            Disponible
          </span>
        );
      case "redeemed":
        return (
          <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
            Canjeado
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex rounded-full bg-error-50 px-2.5 py-0.5 text-xs font-medium text-error-700 dark:bg-error-500/10 dark:text-error-400">
            Expirado
          </span>
        );
      default:
        return (
          <span className="inline-flex rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-500/10 dark:text-gray-400">
            {status}
          </span>
        );
    }
  };

  return (
    <>
      <PageMeta title="Bonos" description="Gestión de bonos para pacientes" />
      <PageBreadcrumb pageTitle="Bonos" />

      {alert.show && (
        <div className="mb-6">
          <Alert
            variant={alert.type}
            title={alert.title}
            message={alert.message}
          />
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {statistics.total}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Disponibles
            </p>
            <p className="mt-1 text-2xl font-semibold text-success-600 dark:text-success-400">
              {statistics.available}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Canjeados
            </p>
            <p className="mt-1 text-2xl font-semibold text-brand-600 dark:text-brand-400">
              {statistics.redeemed}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Expirados</p>
            <p className="mt-1 text-2xl font-semibold text-error-600 dark:text-error-400">
              {statistics.expired}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pacientes</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {statistics.total_patients}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Lista de Bonos
          </h3>
          <Button size="sm" onClick={openAddModal}>
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Asignar Bono
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Input
              type="text"
              placeholder="Buscar por paciente, producto o notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="available">Disponible</option>
              <option value="redeemed">Canjeado</option>
              <option value="expired">Expirado</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Paciente
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Producto
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Presentación
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Estado
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Fecha de compra
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Vencimiento
                </th>
                <th className="pb-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : filteredBonuses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No se encontraron bonos
                  </td>
                </tr>
              ) : (
                filteredBonuses.map((bonus) => (
                  <tr
                    key={bonus.id}
                    className="border-b border-gray-200 dark:border-gray-800"
                  >
                    <td className="py-4 text-sm text-gray-800 dark:text-white/90">
                      {bonus.patient
                        ? `${bonus.patient.first_name} ${bonus.patient.last_name}`
                        : "N/A"}
                    </td>
                    <td className="py-4 text-sm text-gray-800 dark:text-white/90">
                      {bonus.product?.name || "N/A"}
                    </td>
                    <td className="py-4 text-sm text-gray-800 dark:text-white/90">
                      {bonus.product_dose?.dose || "N/A"}
                    </td>
                    <td className="py-4">{getStatusBadge(bonus.status)}</td>
                    <td className="py-4 text-sm text-gray-800 dark:text-white/90">
                      {formatDate(bonus.purchase_date)}
                    </td>
                    <td className="py-4 text-sm text-gray-800 dark:text-white/90">
                      {formatDate(bonus.expiration_date)}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => openDetail(bonus)}
                        className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={closeAddModal} className="max-w-[700px] m-4">
        <div className="relative w-full max-w-[700px] rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Asignar Bono
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Completa la información para asignar un bono a un paciente
            </p>
          </div>
          {modalAlert.show && (
            <div className="mb-4 px-2">
              <Alert
                variant={modalAlert.type}
                title={modalAlert.title}
                message={modalAlert.message}
              />
            </div>
          )}
          <form className="flex flex-col" onSubmit={handleAddBonus}>
            <div className="custom-scrollbar max-h-[450px] overflow-y-auto border-y border-gray-200 px-2 pb-4 pt-4">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                {/* Patient Search Section */}
                <div className="col-span-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <h5 className="mb-3 text-sm font-medium text-gray-800 dark:text-white/90">
                      Buscar Paciente <span className="text-red-500">*</span>
                    </h5>

                    {selectedPatient ? (
                      <div className="rounded-lg border border-success-200 bg-success-50 p-3 dark:border-success-800 dark:bg-success-900/20">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white/90">
                              {selectedPatient.first_name} {selectedPatient.last_name} {selectedPatient.second_last_name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedPatient.identification_number}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedPatient.email}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleResetPatientSearch}
                            className="text-sm text-error-600 hover:text-error-700 dark:text-error-400"
                          >
                            Cambiar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                              handlePatientSearch();
                            }
                          }}
                        >
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                              <Label>Nombre</Label>
                              <Input
                                type="text"
                                value={searchPatientName}
                                onChange={(e) => setSearchPatientName(e.target.value)}
                                placeholder="Ej: Carlos"
                              />
                            </div>
                            <div>
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={searchPatientEmail}
                                onChange={(e) => setSearchPatientEmail(e.target.value)}
                                placeholder="Ej: paciente@example.com"
                              />
                            </div>
                            <div>
                              <Label>Teléfono</Label>
                              <Input
                                type="text"
                                value={searchPatientPhone}
                                onChange={(e) => setSearchPatientPhone(e.target.value)}
                                placeholder="Ej: +1-555-0000"
                              />
                            </div>
                            <div>
                              <Label>Número de Identificación</Label>
                              <Input
                                type="text"
                                value={searchPatientIdentification}
                                onChange={(e) => setSearchPatientIdentification(e.target.value)}
                                placeholder="Ej: 001-123456-7"
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handlePatientSearch()}
                              disabled={searchingPatients}
                            >
                              {searchingPatients ? "Buscando..." : "Buscar Paciente"}
                            </Button>
                            {(searchPatientName || searchPatientEmail || searchPatientPhone || searchPatientIdentification) && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleResetPatientSearch}
                              >
                                Limpiar
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Patient Results */}
                        {showPatientResults && patients.length > 0 && (
                          <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
                            <div className="p-2">
                              <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                Resultados ({patients.length})
                              </p>
                              {patients.map((patient) => (
                                <button
                                  key={patient.id}
                                  type="button"
                                  className="w-full rounded-lg p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                  onClick={() => handleSelectPatient(patient)}
                                >
                                  <div className="font-medium text-gray-800 dark:text-white/90">
                                    {patient.first_name} {patient.last_name} {patient.second_last_name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {patient.identification_number} - {patient.email}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <Label>
                    Producto <span className="text-red-500">*</span>
                  </Label>
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    value={productId}
                    onChange={handleProductChange}
                    required
                  >
                    <option value={0}>Seleccione un producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <Label>
                    Presentación <span className="text-red-500">*</span>
                  </Label>
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    value={productDoseId}
                    onChange={(e) => setProductDoseId(parseInt(e.target.value))}
                    required
                    disabled={doses.length === 0}
                  >
                    <option value={0}>Seleccione una presentación</option>
                    {doses.map((dose) => (
                      <option key={dose.id} value={dose.id}>
                        {dose.dose}
                      </option>
                    ))}
                  </select>
                  {doses.length === 0 && productId > 0 && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Este producto no tiene presentación disponibles
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Cantidad <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    min="1"
                  />
                </div>

                <div>
                  <Label>
                    Días de vigencia <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                    min="1"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Notas</Label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Bono por fidelidad"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="size-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Enviar notificación por correo electrónico
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => {
                  resetForm();
                  closeAddModal();
                }}
              >
                Cancelar
              </Button>
              <Button size="sm" type="submit" disabled={isAssigningBonus}>
                {isAssigningBonus ? "Procesando..." : "Asignar Bono"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        className="max-w-[600px] m-4"
      >
        <div className="relative w-full max-w-[600px] rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-6 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Detalle del Bono
            </h4>
          </div>
          {selectedBonus && (
            <div className="space-y-4 px-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Paciente
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {selectedBonus.patient
                    ? `${selectedBonus.patient.first_name} ${selectedBonus.patient.last_name}`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Identificación
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {selectedBonus.patient?.identification_number || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Producto
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {selectedBonus.product?.name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Presentación</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {selectedBonus.product_dose?.dose || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Estado</p>
                <div className="mt-1">{getStatusBadge(selectedBonus.status)}</div>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fecha de compra
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatDate(selectedBonus.purchase_date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Días de vigencia
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {selectedBonus.redemption_days} días
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fecha de vencimiento
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatDate(selectedBonus.expiration_date)}
                </p>
              </div>
              {selectedBonus.notes && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Notas</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {selectedBonus.notes}
                  </p>
                </div>
              )}
              {selectedBonus.status === "available" && (
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                    onClick={() => handleCancelBonus(selectedBonus.id)}
                  >
                    Cancelar Bono
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
