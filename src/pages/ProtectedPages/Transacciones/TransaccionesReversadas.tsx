import { useState, useEffect, useMemo, useCallback } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Select from "../../../components/form/Select";
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
  getReversedTransactions,
  getReversedTransactionDetail,
  ReversedTransactionData,
} from "../../../services/protected/transactions.services";
import { getPharmacies } from "../../../services/protected/pharmacies.services";
import { PharmacyData } from "../../../types/services/protected/pharmacies.types";
import { formatDate } from "../../../helper/formatData";

export default function TransaccionesReversadasPage() {
  const [reversedTransactions, setReversedTransactions] = useState<ReversedTransactionData[]>([]);
  const [pharmacies, setPharmacies] = useState<PharmacyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedReversed, setSelectedReversed] = useState<ReversedTransactionData | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Filtros
  const [filterSearch, setFilterSearch] = useState("");
  const [filterPharmacyId, setFilterPharmacyId] = useState("");
  const [filterReversedFrom, setFilterReversedFrom] = useState("");
  const [filterReversedTo, setFilterReversedTo] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const { isOpen: isDetailOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();

  const loadPharmacies = async () => {
    try {
      const response = await getPharmacies();
      if (response.status === 200 && Array.isArray(response.data)) {
        setPharmacies(response.data);
      }
    } catch {
      // silencioso
    }
  };

  const loadReversed = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params: any = {};
      if (filterSearch) params.search = filterSearch;
      if (filterPharmacyId) params.pharmacy_id = parseInt(filterPharmacyId);
      if (filterReversedFrom) params.reversed_from = filterReversedFrom;
      if (filterReversedTo) params.reversed_to = filterReversedTo;
      if (filterDateFrom) params.transaction_date_from = filterDateFrom;
      if (filterDateTo) params.transaction_date_to = filterDateTo;

      const response = await getReversedTransactions(params);
      if (response.status === 200 && Array.isArray(response.data)) {
        setReversedTransactions(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Ocurrió un error al cargar las transacciones reversadas");
      setReversedTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterSearch, filterPharmacyId, filterReversedFrom, filterReversedTo, filterDateFrom, filterDateTo]);

  useEffect(() => {
    loadPharmacies();
    loadReversed();
  }, [loadReversed]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadReversed();
  };

  const resetFilters = () => {
    setFilterSearch("");
    setFilterPharmacyId("");
    setFilterReversedFrom("");
    setFilterReversedTo("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const openDetail = async (reversed: ReversedTransactionData) => {
    setIsDetailLoading(true);
    setSelectedReversed(reversed);
    openDetailModal();
    try {
      const response = await getReversedTransactionDetail(reversed.id);
      if (response.status === 200 && response.data) {
        setSelectedReversed(response.data);
      }
    } catch {
      // Usar los datos del listado si falla el detalle
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedReversed(null);
    closeDetailModal();
  };

  const pharmacyOptions = useMemo(() => [
    { value: "", label: "Todas las farmacias" },
    ...pharmacies
      .filter(p => p.status)
      .map(p => ({ value: p.id.toString(), label: p.commercial_name })),
  ], [pharmacies]);

  const hasActiveFilters = filterSearch || filterPharmacyId || filterReversedFrom || filterReversedTo || filterDateFrom || filterDateTo;

  const redemptionStatusLabel = (status: string) => {
    const map: Record<string, { label: string; classes: string }> = {
      available: { label: "Disponible", classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
      redeemed: { label: "Canjeado", classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
      expired: { label: "Expirado", classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    };
    return map[status] ?? { label: status, classes: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" };
  };

  return (
    <>
      <PageMeta title="Transacciones Reversadas | Alter Pharma" description="Historial de transacciones reversadas" />
      <div className="flex flex-col gap-6">
        <PageBreadcrumb pageTitle="Transacciones Reversadas" />

        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Transacciones Reversadas</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Historial de todas las transacciones que han sido reversadas
          </p>
        </div>

        {/* Filtros */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          {error && (
            <div className="mb-4">
              <Alert variant="error" title="Error" message={error} />
            </div>
          )}
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Buscar</Label>
                <Input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Factura, nombre o cédula"
                />
              </div>
              <div>
                <Label>Farmacia</Label>
                <Select
                  options={pharmacyOptions}
                  value={filterPharmacyId}
                  onChange={(value) => setFilterPharmacyId(value)}
                />
              </div>
              <div>
                <Label>Reversada desde</Label>
                <Input
                  type="date"
                  value={filterReversedFrom}
                  onChange={(e) => setFilterReversedFrom(e.target.value)}
                />
              </div>
              <div>
                <Label>Reversada hasta</Label>
                <Input
                  type="date"
                  value={filterReversedTo}
                  onChange={(e) => setFilterReversedTo(e.target.value)}
                />
              </div>
              <div>
                <Label>Fecha transacción desde</Label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label>Fecha transacción hasta</Label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Buscando..." : "Buscar"}
              </Button>
              <Button type="button" variant="outline" onClick={resetFilters}>
                Limpiar filtros
              </Button>
              {hasActiveFilters && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {reversedTransactions.length} resultado{reversedTransactions.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID Original</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Paciente</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Farmacia</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">No. Factura</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha Transacción</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Reversada por</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha Reversión</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {reversedTransactions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      #{item.original_transaction_id}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{item.patient.name}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">{item.patient.identification_number}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                      {item.pharmacy.commercial_name}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {item.invoice_number || "N/A"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {item.transaction_date ? formatDate(item.transaction_date) : "N/A"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="block text-sm text-gray-800 dark:text-white/90">{item.reversed_by.name}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">{item.reversed_by.email}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {item.reversed_at ? formatDate(item.reversed_at) : "N/A"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <button
                        onClick={() => openDetail(item)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg dark:text-purple-400 dark:hover:bg-purple-900/20"
                        title="Ver detalles"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {reversedTransactions.length === 0 && !isLoading && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">No hay transacciones reversadas</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {hasActiveFilters ? "No se encontraron resultados con los filtros aplicados." : "Aún no se ha reversado ninguna transacción."}
                </p>
              </div>
            )}

            {isLoading && (
              <div className="px-5 py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status">
                  <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Cargando...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Detalle de Transacción Reversada */}
      <Modal isOpen={isDetailOpen} onClose={handleCloseDetail} className="max-w-[650px] m-4">
        <div className="no-scrollbar relative w-full max-w-[650px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Transacción Reversada
            </h4>
            {selectedReversed && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ID original: <strong>#{selectedReversed.original_transaction_id}</strong>
                {selectedReversed.invoice_number ? ` · Factura: ${selectedReversed.invoice_number}` : ""}
              </p>
            )}
          </div>

          {isDetailLoading ? (
            <div className="py-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status" />
            </div>
          ) : selectedReversed && (
            <div className="px-2 pb-4 space-y-5">
              {/* Paciente */}
              <div>
                <Label>Paciente</Label>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Nombre:</span> {selectedReversed.patient.name}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Identificación:</span> {selectedReversed.patient.identification_number}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Email:</span> {selectedReversed.patient.email}</p>
                  {selectedReversed.patient.phone && (
                    <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Teléfono:</span> {selectedReversed.patient.phone}</p>
                  )}
                </div>
              </div>

              {/* Farmacia */}
              <div>
                <Label>Farmacia</Label>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Nombre comercial:</span> {selectedReversed.pharmacy.commercial_name}</p>
                  {selectedReversed.pharmacy.legal_name && (
                    <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Razón social:</span> {selectedReversed.pharmacy.legal_name}</p>
                  )}
                </div>
              </div>

              {/* Productos */}
              {selectedReversed.products && selectedReversed.products.length > 0 && (
                <div>
                  <Label>Productos</Label>
                  <div className="mt-2 space-y-2">
                    {selectedReversed.products.map((p) => (
                      <div key={p.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">{p.product_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{p.dose} · Cantidad: {p.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Canjes */}
              {selectedReversed.redemptions && selectedReversed.redemptions.length > 0 && (
                <div>
                  <Label>Canjes asociados ({selectedReversed.redemptions_count})</Label>
                  <div className="mt-2 space-y-2">
                    {selectedReversed.redemptions.map((r) => {
                      const { label, classes } = redemptionStatusLabel(r.status);
                      return (
                        <div key={r.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{r.product_name} · {r.dose}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Compra: {formatDate(r.purchase_date)} · Vence: {formatDate(r.expiration_date)}
                            </p>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${classes}`}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reversión */}
              <div>
                <Label>Información de la reversión</Label>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Reversada por:</span> {selectedReversed.reversed_by.name}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Fecha de reversión:</span> {formatDate(selectedReversed.reversed_at)}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Fecha de transacción original:</span> {formatDate(selectedReversed.transaction_date)}</p>
                  {selectedReversed.reason && (
                    <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Motivo:</span> {selectedReversed.reason}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" onClick={handleCloseDetail}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
