import { useState, useCallback, useEffect } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Select from "../../../components/form/Select";
import Alert from "../../../components/ui/alert/Alert";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../../components/ui/table";
import {
  getEvidenceRequests,
  createEvidenceRequest,
  sendReminder,
  resolveEvidenceRequest,
} from "../../../services/protected/evidence-requests.services";
import { getPharmacies, togglePharmacyStatus } from "../../../services/protected/pharmacies.services";

interface InvoiceLine {
  invoice_number: string;
  patient_name: string;
  pharmacy_name: string;
}

interface EvidenceRequest {
  id: number;
  pharmacy: { id: number; commercial_name: string; email: string };
  requested_by: string;
  reason: string;
  invoices: InvoiceLine[];
  status: "pending" | "evidence_submitted" | "resolved" | "expired";
  deadline_at: string;
  is_overdue: boolean;
  reminder_sent_at: string | null;
  evidence_submitted_at: string | null;
  evidence_message: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

interface Pharmacy { id: number; commercial_name: string; status: boolean; }

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "evidence_submitted", label: "Evidencia Enviada" },
  { value: "resolved", label: "Resuelto" },
  { value: "expired", label: "Vencido" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:            { label: "Pendiente",         color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  evidence_submitted: { label: "Evidencia Enviada", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  resolved:           { label: "Resuelto",           color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  expired:            { label: "Vencido",            color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const fmt = (d: string) => new Date(d).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" });
const fmtDT = (d: string) => new Date(d).toLocaleString("es-ES", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function SolicitudesEvidenciaPage() {
  const [rows, setRows] = useState<EvidenceRequest[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [pagination, setPagination] = useState<{ current_page: number; last_page: number; total: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPharmacyId, setNewPharmacyId] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newInvoices, setNewInvoices] = useState<InvoiceLine[]>([{ invoice_number: "", patient_name: "", pharmacy_name: "" }]);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<EvidenceRequest | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [inactivatingId, setInactivatingId] = useState<number | null>(null);

  useEffect(() => {
    getPharmacies().then(r => { if (r.status === 200 && Array.isArray(r.data)) setPharmacies(r.data); });
  }, []);

  const loadData = useCallback(async (page = 1) => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await getEvidenceRequests({ status: statusFilter || undefined, search: search || undefined, per_page: 25, page });
      if (res.status === 200 && res.data) {
        setRows(res.data.data ?? []);
        setPagination({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
        setCurrentPage(res.data.current_page);
      }
    } catch { setErrorMessage("Error al cargar las solicitudes"); }
    finally { setIsLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { loadData(1); }, [loadData]);

  const handleInvoiceChange = (index: number, field: keyof InvoiceLine, value: string) => {
    setNewInvoices(prev => prev.map((inv, i) => i === index ? { ...inv, [field]: value } : inv));
  };
  const addInvoiceLine = () => setNewInvoices(prev => [...prev, { invoice_number: "", patient_name: "", pharmacy_name: "" }]);
  const removeInvoiceLine = (index: number) => setNewInvoices(prev => prev.filter((_, i) => i !== index));

  const handleCreate = async () => {
    if (!newPharmacyId || !newReason.trim()) return;
    setCreating(true);
    try {
      const validInvoices = newInvoices.filter(inv => inv.invoice_number.trim());
      const res = await createEvidenceRequest({
        pharmacy_id: Number(newPharmacyId),
        reason: newReason,
        invoices: validInvoices.length > 0 ? validInvoices : undefined,
      });
      if (res.status === 201) {
        setSuccessMessage("Solicitud enviada. Se envió un correo a la farmacia con el plazo de 5 días hábiles.");
        setShowCreateModal(false);
        setNewPharmacyId(""); setNewReason("");
        setNewInvoices([{ invoice_number: "", patient_name: "", pharmacy_name: "" }]);
        loadData(1);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setErrorMessage(err.response?.data?.message || "Error al crear la solicitud");
    } finally { setCreating(false); }
  };

  const handleReminder = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await sendReminder(id);
      if (res.status === 200) { setSuccessMessage("Recordatorio enviado exitosamente."); loadData(currentPage); }
    } catch { setErrorMessage("Error al enviar el recordatorio"); }
    finally { setActionLoading(false); }
  };

  const handleResolve = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await resolveEvidenceRequest(id, resolutionNotes);
      if (res.status === 200) {
        setSuccessMessage("Solicitud marcada como resuelta.");
        setSelected(null); setResolutionNotes("");
        loadData(currentPage);
      }
    } catch { setErrorMessage("Error al resolver la solicitud"); }
    finally { setActionLoading(false); }
  };

  const handleToggleStatus = async (pharmacyId: number) => {
    setInactivatingId(pharmacyId);
    try {
      const res = await togglePharmacyStatus(pharmacyId);
      if (res.status === 200) {
        const isNowActive = (res.data as { status?: boolean })?.status;
        setSuccessMessage(`Farmacia ${isNowActive ? "activada" : "inactivada"} exitosamente.`);
        setSelected(null);
        loadData(currentPage);
      }
    } catch { setErrorMessage("Error al cambiar el estado de la farmacia"); }
    finally { setInactivatingId(null); }
  };

  const pharmacyOptions = pharmacies.map(p => ({ value: String(p.id), label: p.commercial_name }));

  return (
    <>
      <PageMeta title="Solicitudes de Evidencia | Alter Pharma" description="Gestión de solicitudes de documentación a farmacias con patrones sospechosos" />
      <div className="flex flex-col gap-6">
        <PageBreadcrumb pageTitle="Solicitudes de Evidencia" />

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Solicitudes de Evidencia</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gestione solicitudes de documentación a farmacias con patrones sospechosos. Plazo: 5 días hábiles.
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>+ Nueva Solicitud</Button>
        </div>

        {errorMessage && <div className="mb-2"><Alert variant="error" title="Error" message={errorMessage} /></div>}
        {successMessage && <div className="mb-2"><Alert variant="success" title="Éxito" message={successMessage} /></div>}

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Buscar farmacia</Label><Input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre..." /></div>
            <div><Label>Estado</Label><Select options={STATUS_OPTIONS} value={statusFilter} onChange={v => setStatusFilter(v)} placeholder="Todos" /></div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Farmacia</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Motivo</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Solicitado por</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha límite</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Estado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {rows.map(row => {
                  const s = STATUS_LABELS[row.status];
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{row.pharmacy.commercial_name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{row.pharmacy.email}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="text-xs text-gray-600 dark:text-gray-400 max-w-xs block truncate">{row.reason}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-sm text-gray-600 dark:text-gray-400">{row.requested_by}</TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className={`text-sm ${row.is_overdue && row.status === 'pending' ? 'text-red-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                          {fmt(row.deadline_at)}
                          {row.is_overdue && row.status === 'pending' && <span className="block text-xs">⚠️ Vencida</span>}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.color}`}>{s.label}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => { setSelected(row); setResolutionNotes(""); }}>Ver</Button>
                          {row.status === 'pending' && (
                            <Button size="sm" variant="outline" onClick={() => handleReminder(row.id)} disabled={actionLoading}>
                              {row.reminder_sent_at ? "Re-enviar aviso" : "Recordatorio"}
                            </Button>
                          )}
                          {(row.status === 'evidence_submitted' || row.status === 'expired') && (
                            <Button size="sm" onClick={() => handleResolve(row.id)} disabled={actionLoading}>Resolver</Button>
                          )}
                          {row.status !== 'resolved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(row.pharmacy.id)}
                              disabled={inactivatingId === row.pharmacy.id}
                            >
                              {inactivatingId === row.pharmacy.id ? "..." : "Inactivar"}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {rows.length === 0 && !isLoading && (
              <div className="px-5 py-12 text-center">
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">Sin solicitudes</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No hay solicitudes con los filtros aplicados.</p>
              </div>
            )}
            {isLoading && (
              <div className="px-5 py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status" />
              </div>
            )}
          </div>

          {pagination && pagination.total > 0 && (
            <div className="border-t border-gray-200 dark:border-white/[0.05] px-5 py-4 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Página {pagination.current_page} de {pagination.last_page} — {pagination.total} registros</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => loadData(currentPage - 1)} disabled={currentPage === 1 || isLoading}>Anterior</Button>
                <Button size="sm" variant="outline" onClick={() => loadData(currentPage + 1)} disabled={currentPage === pagination.last_page || isLoading}>Siguiente</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Nueva Solicitud de Evidencia</h3>
            <div className="flex flex-col gap-4">
              <div>
                <Label>Farmacia</Label>
                <Select options={pharmacyOptions} value={newPharmacyId} onChange={v => setNewPharmacyId(v)} placeholder="Seleccionar farmacia..." />
              </div>
              <div>
                <Label>Motivo de la solicitud</Label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  rows={3}
                  value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                  placeholder="Describa el motivo (canjes sospechosos, facturas duplicadas, etc.)..."
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Facturas a solicitar</Label>
                  <button
                    type="button"
                    onClick={addInvoiceLine}
                    className="text-xs text-brand-500 hover:text-brand-600 font-medium"
                  >
                    + Agregar factura
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 dark:text-gray-400 px-1">
                    <span className="col-span-3">N° Factura *</span>
                    <span className="col-span-4">Nombre del paciente</span>
                    <span className="col-span-4">Farmacia / Sucursal</span>
                  </div>
                  {newInvoices.map((inv, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-3">
                        <Input
                          type="text"
                          value={inv.invoice_number}
                          onChange={e => handleInvoiceChange(i, "invoice_number", e.target.value)}
                          placeholder="Ej: 123456"
                        />
                      </div>
                      <div className="col-span-4">
                        <Input
                          type="text"
                          value={inv.patient_name}
                          onChange={e => handleInvoiceChange(i, "patient_name", e.target.value)}
                          placeholder="Nombre paciente"
                        />
                      </div>
                      <div className="col-span-4">
                        <Input
                          type="text"
                          value={inv.pharmacy_name}
                          onChange={e => handleInvoiceChange(i, "pharmacy_name", e.target.value)}
                          placeholder="Farmacia o sucursal"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {newInvoices.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeInvoiceLine(i)}
                            className="text-red-400 hover:text-red-600 text-lg leading-none"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Se enviará un correo automático a la farmacia con las facturas listadas y el plazo de <strong>5 días hábiles</strong>.
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={creating || !newPharmacyId || !newReason.trim()}>
                {creating ? "Enviando..." : "Enviar Solicitud"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Detalle de Solicitud #{selected.id}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
            </div>
            <div className="flex flex-col gap-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-500">Farmacia:</span><p className="font-medium">{selected.pharmacy.commercial_name}</p></div>
                <div><span className="text-gray-500">Email:</span><p className="font-medium">{selected.pharmacy.email}</p></div>
                <div><span className="text-gray-500">Solicitado por:</span><p className="font-medium">{selected.requested_by}</p></div>
                <div><span className="text-gray-500">Fecha solicitud:</span><p className="font-medium">{fmtDT(selected.created_at)}</p></div>
                <div><span className="text-gray-500">Fecha límite:</span><p className={`font-medium ${selected.is_overdue && selected.status === 'pending' ? 'text-red-600' : ''}`}>{fmt(selected.deadline_at)}</p></div>
                <div><span className="text-gray-500">Recordatorio:</span><p className="font-medium">{selected.reminder_sent_at ? fmtDT(selected.reminder_sent_at) : 'No enviado'}</p></div>
              </div>
              <div>
                <span className="text-gray-500">Motivo:</span>
                <p className="mt-1 text-gray-800 dark:text-white/80 bg-gray-50 dark:bg-gray-800 rounded p-3">{selected.reason}</p>
              </div>
              {selected.invoices?.length > 0 && (
                <div>
                  <span className="text-gray-500">Facturas solicitadas:</span>
                  <div className="mt-1 bg-gray-50 dark:bg-gray-800 rounded p-3 space-y-1">
                    {selected.invoices.map((inv, i) => (
                      <p key={i} className="text-gray-800 dark:text-white/80">
                        <strong>Factura {inv.invoice_number}</strong>
                        {inv.patient_name ? ` – ${inv.patient_name}` : ""}
                        {inv.pharmacy_name ? ` – ${inv.pharmacy_name}` : ""}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {selected.evidence_message && (
                <div>
                  <span className="text-gray-500">Evidencia enviada por farmacia ({selected.evidence_submitted_at ? fmtDT(selected.evidence_submitted_at) : ''}):</span>
                  <p className="mt-1 text-gray-800 dark:text-white/80 bg-green-50 dark:bg-green-900/20 rounded p-3 whitespace-pre-line">{selected.evidence_message}</p>
                </div>
              )}
              {selected.resolved_at && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded p-3">
                  <p><strong>Resuelto por:</strong> {selected.resolved_by} el {fmtDT(selected.resolved_at)}</p>
                  {selected.resolution_notes && <p className="mt-1"><strong>Notas:</strong> {selected.resolution_notes}</p>}
                </div>
              )}
              {selected.status !== 'resolved' && (
                <div>
                  <Label>Notas de resolución (opcional)</Label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-800 dark:text-white/90"
                    rows={3}
                    value={resolutionNotes}
                    onChange={e => setResolutionNotes(e.target.value)}
                    placeholder="Observaciones sobre la resolución..."
                  />
                </div>
              )}
            </div>
            {selected.status !== 'resolved' && (
              <div className="flex justify-between gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => handleToggleStatus(selected.pharmacy.id)}
                  disabled={inactivatingId === selected.pharmacy.id || actionLoading}
                >
                  {inactivatingId === selected.pharmacy.id ? "Procesando..." : "Inactivar farmacia"}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelected(null)}>Cerrar</Button>
                  <Button onClick={() => handleResolve(selected.id)} disabled={actionLoading}>
                    {actionLoading ? "Guardando..." : "Marcar como Resuelto"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
