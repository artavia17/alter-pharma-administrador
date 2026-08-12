import { useState, useCallback } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Alert from "../../../components/ui/alert/Alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { getBlockedRedemptions, unblockRedemption } from "../../../services/protected/blocked-redemptions.services";

interface BlockedRedemption {
  id: number;
  patient: {
    id: number;
    name: string;
    identification_number: string;
    email: string;
    phone: string;
  };
  product: string;
  dose: string;
  pharmacy: string;
  invoice_number: string;
  purchase_date: string;
  blocked_reason: string;
  blocked_type: "automatic" | "manual";
  blocked_at: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" });

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString("es-ES", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function CanjesBloqueadosPage() {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [rows, setRows] = useState<BlockedRedemption[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [unlockingId, setUnlockingId] = useState<number | null>(null);

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
      const res = await getBlockedRedemptions({ ...buildParams(), page } as Parameters<typeof getBlockedRedemptions>[0]);
      if (res.status === 200 && res.data) {
        setRows(res.data.data ?? []);
        setPagination({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          per_page: res.data.per_page,
          total: res.data.total,
          from: res.data.from,
          to: res.data.to,
        });
        setCurrentPage(res.data.current_page);
        setHasSearched(true);
      }
    } catch {
      setErrorMessage("Ocurrió un error al obtener los canjes bloqueados");
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData(1);
  };

  const handleUnblock = async (id: number) => {
    setUnlockingId(id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await unblockRedemption(id);
      if (res.status === 200) {
        setSuccessMessage("Canje desbloqueado exitosamente.");
        setRows(prev => prev.filter(r => r.id !== id));
        if (pagination) setPagination(p => p ? { ...p, total: p.total - 1 } : p);
      }
    } catch {
      setErrorMessage("Error al desbloquear el canje. Intente de nuevo.");
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <>
      <PageMeta title="Canjes Bloqueados | Alter Pharma" description="Gestión de canjes bloqueados por sospecha de fraude" />
      <div className="flex flex-col gap-6">
        <PageBreadcrumb pageTitle="Canjes Bloqueados" />

        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Canjes Bloqueados</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Canjes bloqueados automáticamente por detección de patrones sospechosos. Valide con el paciente y desbloquee si las compras son legítimas.
          </p>
        </div>

        {/* Filtros */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          {errorMessage && (
            <div className="mb-4"><Alert variant="error" title="Error" message={errorMessage} /></div>
          )}
          {successMessage && (
            <div className="mb-4"><Alert variant="success" title="Éxito" message={successMessage} /></div>
          )}
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Buscar paciente</Label>
                <Input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre o cédula..." />
              </div>
              <div>
                <Label>Desde</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <Label>Hasta</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Buscando..." : "Buscar"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setSearch(""); setFrom(""); setTo(""); }}>
                Limpiar
              </Button>
              {pagination && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-orange-600 dark:text-orange-400">{pagination.total}</span> canje{pagination.total !== 1 ? "s" : ""} bloqueado{pagination.total !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Tabla */}
        {hasSearched && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Paciente</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Producto</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Farmacia</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">N° Factura</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha Compra</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tipo Bloqueo</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Motivo</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Bloqueado</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acción</TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{row.patient.name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{row.patient.identification_number}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block text-sm text-gray-800 dark:text-white/90">{row.product}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{row.dose}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{row.pharmacy || '—'}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="text-xs font-mono text-gray-700 dark:text-gray-300">{row.invoice_number || '—'}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-500 dark:text-gray-400">
                        {row.purchase_date ? formatDate(row.purchase_date) : '—'}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        {row.blocked_type === 'automatic' ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Automático
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            Manual
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="text-xs text-gray-500 dark:text-gray-400 max-w-xs block">{row.blocked_reason}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-xs text-gray-500 dark:text-gray-400">
                        {row.blocked_at ? formatDateTime(row.blocked_at) : '—'}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnblock(row.id)}
                          disabled={unlockingId === row.id}
                        >
                          {unlockingId === row.id ? "Desbloqueando..." : "Desbloquear"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {rows.length === 0 && !isLoading && (
                <div className="px-5 py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">Sin canjes bloqueados</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No se encontraron canjes bloqueados con los filtros aplicados.</p>
                </div>
              )}

              {isLoading && (
                <div className="px-5 py-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status">
                    <span className="sr-only">Cargando...</span>
                  </div>
                </div>
              )}
            </div>

            {pagination && pagination.total > 0 && (
              <div className="border-t border-gray-200 dark:border-white/[0.05] px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Página {pagination.current_page} de {pagination.last_page} — {pagination.total} registros
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setCurrentPage(p => p - 1); loadData(currentPage - 1); }} disabled={currentPage === 1 || isLoading}>
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{currentPage} / {pagination.last_page}</span>
                    <Button size="sm" variant="outline" onClick={() => { setCurrentPage(p => p + 1); loadData(currentPage + 1); }} disabled={currentPage === pagination.last_page || isLoading}>
                      Siguiente
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
