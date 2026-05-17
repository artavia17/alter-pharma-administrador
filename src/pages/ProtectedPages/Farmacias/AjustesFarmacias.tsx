import { useEffect, useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Alert from "../../../components/ui/alert/Alert";
import { getSystemSetting, updateSystemSetting } from "../../../services/protected/system-settings.services";

export default function AjustesFarmaciasPage() {
  const [invoiceMaxDays, setInvoiceMaxDays] = useState<number>(15);
  const [inputValue, setInputValue] = useState<number>(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    loadSetting();
  }, []);

  const loadSetting = async () => {
    try {
      setLoading(true);
      const response = await getSystemSetting("invoice_max_days");
      if (response.status === 200 && response.data) {
        setInvoiceMaxDays(Number(response.data.value));
        setInputValue(Number(response.data.value));
      }
    } catch {
      setAlert({ variant: "error", message: "Error al cargar la configuración." });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (inputValue < 1 || inputValue > 365) {
      setAlert({ variant: "error", message: "El valor debe estar entre 1 y 365 días." });
      return;
    }

    try {
      setSaving(true);
      setAlert(null);
      const response = await updateSystemSetting("invoice_max_days", inputValue);
      if (response.status === 200) {
        setInvoiceMaxDays(inputValue);
        setAlert({ variant: "success", message: "Configuración guardada exitosamente." });
      }
    } catch {
      setAlert({ variant: "error", message: "Error al guardar la configuración." });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = inputValue !== invoiceMaxDays;

  return (
    <>
      <PageMeta
        title="Ajustes de Farmacias | Alter Pharma"
        description="Gestión de ajustes de farmacias"
      />

      <PageBreadcrumb pageTitle="Ajustes" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Ajustes de Farmacias
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Configuración global del sistema de farmacias
            </p>
          </div>
        </div>

        {alert && (
          <Alert
            variant={alert.variant}
            title={alert.variant === "success" ? "Éxito" : "Error"}
            message={alert.message}
          />
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Registro de Compras
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Controla cuántos días hacia atrás puede tener una factura para ser registrada en el sistema.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="w-full sm:w-64">
              <Label htmlFor="invoice_max_days">
                Días máximos de antigüedad de factura
              </Label>
              <Input
                id="invoice_max_days"
                type="number"
                min="1"
                max="365"
                value={loading ? "" : inputValue}
                disabled={loading}
                placeholder={loading ? "Cargando..." : "Ej: 15"}
                onChange={(e) => setInputValue(Number(e.target.value))}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || loading || !hasChanges}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>

          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
            Valor actual guardado: <span className="font-medium text-gray-600 dark:text-gray-300">{loading ? "..." : `${invoiceMaxDays} días`}</span>.
            Las farmacias solo podrán registrar compras con facturas de hasta ese número de días de antigüedad.
          </p>
        </div>
      </div>
    </>
  );
}
