import { useState, useCallback } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Alert from "../../../components/ui/alert/Alert";
import { Modal } from "../../../components/ui/modal";
import { useModal } from "../../../hooks/useModal";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../../components/ui/table";
import {
  getRedemptionTransactions,
  reverseRedemptionTransaction,
} from "../../../services/protected/redemption-transactions.services";

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

const fmt = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" });

export default function CanjesRegistradosPage() {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [rows, setRows] = useState<RedemptionTransaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedRow, setSelectedRow] = useState<RedemptionTransaction | null>(null);
  const [isReverseLoading, setIsReverseLoading] = useState(false);

  const { isOpen: isReverseOpen, openModal: openReverseModal, closeModal: closeReverseModal } = useModal();

  const buildParams = useCallback(() => {
    const p: Record<string, unknown> = { per_page: 25 };
    if (search) p.search = search;
    if (from) p.from = from;
    if (to) p.to = to;
    return p;
  }, [search, from, to]);

  const loadData = useCallback(async (page = 1) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await getRedemptionTransactions({ ...buildParams(), page } as Parameters<typeof getRedemptionTransactions>[0]);
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
    } catch {
      setErrorMessage("Error al cargar los canjes.");
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadData(1);
  };

  const handleReverseClick = (row: RedemptionTransaction) => {
    setSelectedRow(row);
    setSuccessMessage("");
    setErrorMessage("");
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
    } catch {
      setErrorMessage("Error al reversar el canje. Intente de nuevo.");
      closeReverseModal();
    } finally {
      setIsReverseLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Canjes Registrados" description="Reversar canjes registrados por error" />
      <PageBreadcrumb pageTitle="Canjes Registrados" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div onKeyDown={(e) => e.key === "Enter" && handleSearch()}>
            <Label>Buscar (paciente / farmacia)</Label>
            <Input
              placeholder="Nombre, ID o farmacia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <Label>Fecha desde</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label>Fecha hasta</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} disabled={isLoading} className="w-full">
              {isLoading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </div>

        {successMessage && (
          <div className="mb-4">
            <Alert variant="success" title="Éxito" message={successMessage} />
          </div>
        )}
        {errorMessage && (
          <div className="mb-4">
            <Alert variant="error" title="Error" message={errorMessage} />
          </div>
        )}

        {!hasSearched && !isLoading && (
          <p className="py-8 text-center text-gray-400 dark:text-gray-500">
            Usa los filtros y presiona "Buscar" para ver los canjes.
          </p>
        )}

        {hasSearched && (
          <>
            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              {pagination ? `${pagination.total} resultado(s)` : ""}
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>ID</TableCell>
                    <TableCell isHeader>Paciente</TableCell>
                    <TableCell isHeader>Identificación</TableCell>
                    <TableCell isHeader>Producto</TableCell>
                    <TableCell isHeader>Presentación</TableCell>
                    <TableCell isHeader>Cantidad</TableCell>
                    <TableCell isHeader>Farmacia</TableCell>
                    <TableCell isHeader>Fecha</TableCell>
                    <TableCell isHeader>Acciones</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell>
                        <p className="py-4 text-center text-gray-400">No se encontraron resultados.</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold">#{row.id}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {row.patient?.name ?? "—"}
                        </div>
                        <div className="text-xs text-gray-400">{row.patient?.email ?? ""}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {row.patient?.identification_number ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{row.product ?? "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{row.dose ?? "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{row.quantity_redeemed}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{row.pharmacy ?? "—"}</div>
                        {row.sub_pharmacy && (
                          <div className="text-xs text-gray-400">{row.sub_pharmacy}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{fmt(row.redemption_date)}</span>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleReverseClick(row)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                        >
                          Reversar
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadData(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-500">
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
          </>
        )}
      </div>

      {/* Reverse Confirmation Modal */}
      <Modal isOpen={isReverseOpen} onClose={closeReverseModal} className="max-w-md">
        <div className="p-6">
          <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
            Reversar Canje #{selectedRow?.id}
          </h2>
          {selectedRow && (
            <div className="mb-4 rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">
              <p><span className="font-medium">Paciente:</span> {selectedRow.patient?.name ?? "—"}</p>
              <p><span className="font-medium">Producto:</span> {selectedRow.product} — {selectedRow.dose}</p>
              <p><span className="font-medium">Cantidad:</span> {selectedRow.quantity_redeemed}</p>
              <p><span className="font-medium">Farmacia:</span> {selectedRow.pharmacy ?? "—"}</p>
              <p><span className="font-medium">Fecha:</span> {fmt(selectedRow.redemption_date)}</p>
            </div>
          )}
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Esta acción restaurará los canjes del paciente a estado <strong>disponible</strong> y eliminará el registro del canje. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={closeReverseModal} disabled={isReverseLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmReverse}
              disabled={isReverseLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isReverseLoading ? "Reversando..." : "Sí, reversar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
