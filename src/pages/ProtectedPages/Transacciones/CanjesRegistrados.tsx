import { useState, useCallback } from "react";
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
import {
  getRedemptionTransactions,
  reverseRedemptionTransaction,
} from "../../../services/protected/redemption-transactions.services";
import { formatDate } from "../../../helper/formatData";

interface RedemptionTransaction {
  id: number;
  redemption_date: string;
  quantity_redeemed: number;
  quantity_received: number | null;
  notes: string | null;
  patient: {
    id: number;
    name: string;
    identification_number: string;
    email: string;
  } | null;
  pharmacy: string | null;
  sub_pharmacy: string | null;
  product: string | null;
  dose: string | null;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function CanjesRegistradosPage() {
  const [rows, setRows] = useState<RedemptionTransaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [filterSearch, setFilterSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [selectedRow, setSelectedRow] = useState<RedemptionTransaction | null>(null);
  const [isReverseLoading, setIsReverseLoading] = useState(false);

  const { isOpen: isReverseOpen, openModal: openReverseModal, closeModal: closeReverseModal } = useModal();

  const loadData = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { per_page: 25, page };
      if (filterSearch) params.search = filterSearch;
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;

      const res = await getRedemptionTransactions(params as Parameters<typeof getRedemptionTransactions>[0]);
      if (res.status === 200 && res.data) {
        const paginated = res.data;
        setRows(paginated.data ?? []);
        setPagination({
          current_page: paginated.current_page,
          last_page: paginated.last_page,
          per_page: paginated.per_page,
          total: paginated.total,
        });
        setCurrentPage(page);
        setHasSearched(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Ocurrió un error al cargar los canjes.");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterSearch, filterFrom, filterTo]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData(1);
  };

  const resetFilters = () => {
    setFilterSearch("");
    setFilterFrom("");
    setFilterTo("");
  };

  const handleReverseClick = (row: RedemptionTransaction) => {
    setSelectedRow(row);
    setSuccessMessage("");
    setError("");
    openReverseModal();
  };

  const handleConfirmReverse = async () => {
    if (!selectedRow) return;
    setIsReverseLoading(true);
    try {
      const res = await reverseRedemptionTransaction(selectedRow.id);
      if (res.status === 200) {
        setSuccessMessage(`Canje #${selectedRow.id} reversado exitosamente. Los canjes del paciente vuelven a estar disponibles.`);
        closeReverseModal();
        loadData(currentPage);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al reversar el canje. Intente de nuevo.");
      closeReverseModal();
    } finally {
      setIsReverseLoading(false);
    }
  };

  const hasActiveFilters = filterSearch || filterFrom || filterTo;

  return (
    <>
      <PageMeta title="Canjes Registrados | Alter Pharma" description="Reversar canjes registrados por error" />
      <div className="flex flex-col gap-6">
        <PageBreadcrumb pageTitle="Canjes Registrados" />

        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Canjes Registrados</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Consulta y reversa canjes que fueron registrados por error
          </p>
        </div>

        {/* Filtros */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          {error && (
            <div className="mb-4">
              <Alert variant="error" title="Error" message={error} />
            </div>
          )}
          {successMessage && (
            <div className="mb-4">
              <Alert variant="success" title="Éxito" message={successMessage} />
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
                  placeholder="Nombre, cédula o farmacia"
                />
              </div>
              <div>
                <Label>Fecha desde</Label>
                <Input
                  type="date"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                />
              </div>
              <div>
                <Label>Fecha hasta</Label>
                <Input
                  type="date"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
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
              {hasSearched && pagination && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {pagination.total} resultado{pagination.total !== 1 ? "s" : ""}
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
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Paciente</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Producto</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Presentación</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Cantidad</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Farmacia</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha Canje</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      #{row.id}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{row.patient?.name ?? "—"}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">{row.patient?.identification_number ?? ""}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                      {row.product ?? "—"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {row.dose ?? "—"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {row.quantity_redeemed}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="block text-sm text-gray-800 dark:text-white/90">{row.pharmacy ?? "—"}</span>
                      {row.sub_pharmacy && (
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{row.sub_pharmacy}</span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {row.redemption_date ? formatDate(row.redemption_date) : "N/A"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleReverseClick(row)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                        title="Reversar canje"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                        </svg>
                        Reversar
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!hasSearched && !isLoading && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">Busca canjes registrados</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Usa los filtros para encontrar el canje que deseas reversar.
                </p>
              </div>
            )}

            {hasSearched && rows.length === 0 && !isLoading && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">No se encontraron canjes</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {hasActiveFilters ? "No hay resultados con los filtros aplicados." : "No hay canjes registrados."}
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

          {/* Paginación */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-center gap-3 border-t border-gray-100 px-5 py-4 dark:border-white/[0.05]">
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadData(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Página {pagination.current_page} de {pagination.last_page}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadData(currentPage + 1)}
                disabled={currentPage >= pagination.last_page || isLoading}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación de reverso */}
      <Modal isOpen={isReverseOpen} onClose={closeReverseModal} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Reversar Canje
            </h4>
            {selectedRow && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ID: <strong>#{selectedRow.id}</strong>
              </p>
            )}
          </div>

          {selectedRow && (
            <div className="px-2 pb-4 space-y-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                <div>
                  <Label>Paciente</Label>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{selectedRow.patient?.name ?? "—"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedRow.patient?.identification_number ?? ""}</p>
                </div>
                <div>
                  <Label>Producto</Label>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{selectedRow.product ?? "—"} — {selectedRow.dose ?? "—"}</p>
                </div>
                <div>
                  <Label>Cantidad canjeada</Label>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{selectedRow.quantity_redeemed}</p>
                </div>
                <div>
                  <Label>Farmacia</Label>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{selectedRow.pharmacy ?? "—"}</p>
                </div>
                <div>
                  <Label>Fecha de canje</Label>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{formatDate(selectedRow.redemption_date)}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Esta acción restaurará los canjes del paciente a estado <strong>disponible</strong> y eliminará el registro. <strong>Esta acción no se puede deshacer.</strong>
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeReverseModal} disabled={isReverseLoading}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmReverse}
              disabled={isReverseLoading}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              {isReverseLoading ? "Reversando..." : "Sí, reversar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
