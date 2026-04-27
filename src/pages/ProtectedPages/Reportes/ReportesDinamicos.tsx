import { useState, useEffect, useMemo } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
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
import {
  getDynamicReportSchema,
  runDynamicReport,
  exportDynamicReport,
} from "../../../services/protected/dynamic-reports.services";
import {
  SchemaData,
  ReportField,
  ReportFilter,
  ReportOrderBy,
  FilterOperator,
} from "../../../types/services/protected/dynamic-reports.types";

const AGGREGATES = [
  { value: "", label: "Sin agregación" },
  { value: "COUNT", label: "COUNT" },
  { value: "COUNT_DISTINCT", label: "COUNT_DISTINCT" },
  { value: "SUM", label: "SUM" },
  { value: "AVG", label: "AVG" },
  { value: "MIN", label: "MIN" },
  { value: "MAX", label: "MAX" },
];

const OPERATORS: { value: FilterOperator; label: string; noValue?: boolean; arrayValue?: boolean }[] = [
  { value: "=", label: "= Igual" },
  { value: "!=", label: "!= Diferente" },
  { value: ">", label: "> Mayor que" },
  { value: "<", label: "< Menor que" },
  { value: ">=", label: ">= Mayor o igual" },
  { value: "<=", label: "<= Menor o igual" },
  { value: "like", label: "Contiene texto" },
  { value: "not like", label: "No contiene texto" },
  { value: "in", label: "En lista (separar con coma)", arrayValue: true },
  { value: "not in", label: "Fuera de lista (separar con coma)", arrayValue: true },
  { value: "between", label: "Entre dos valores (separar con coma)", arrayValue: true },
  { value: "is null", label: "Sin valor", noValue: true },
  { value: "is not null", label: "Con valor", noValue: true },
];

export default function ReportesDinamicosPage() {
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [schemaError, setSchemaError] = useState("");

  // Builder state
  const [baseEntity, setBaseEntity] = useState("");
  const [fields, setFields] = useState<ReportField[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [orderBy, setOrderBy] = useState<ReportOrderBy[]>([]);
  const [perPage, setPerPage] = useState(50);

  // Results
  const [results, setResults] = useState<Record<string, any>[]>([]);
  const [resultMeta, setResultMeta] = useState<{ total: number; per_page: number; page: number; last_page: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [runError, setRunError] = useState("");
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    loadSchema();
  }, []);

  const loadSchema = async () => {
    setSchemaLoading(true);
    setSchemaError("");
    try {
      const res = await getDynamicReportSchema();
      if (res.status === 200) setSchema(res.data);
    } catch {
      setSchemaError("No se pudo cargar el esquema de reportes.");
    } finally {
      setSchemaLoading(false);
    }
  };

  // Available entities for field/filter selection = base entity + joinable
  const availableEntities = useMemo(() => {
    if (!schema || !baseEntity) return [];
    const joinable = schema[baseEntity]?.joinable_to ?? [];
    return [baseEntity, ...joinable].filter((e) => schema[e]);
  }, [schema, baseEntity]);

  const entityOptions = useMemo(() => {
    if (!schema) return [];
    return Object.entries(schema).map(([key, val]) => ({ value: key, label: val.label }));
  }, [schema]);

  const entitySelectOptions = useMemo(() => {
    return availableEntities.map((e) => ({ value: e, label: schema![e].label }));
  }, [availableEntities, schema]);

  const fieldsForEntity = (entity: string) => {
    if (!schema || !schema[entity]) return [];
    return Object.entries(schema[entity].columns).map(([key, col]) => ({
      value: key,
      label: `${col.label} (${col.type})`,
    }));
  };

  // ── Fields management ──────────────────────────────
  const addField = () => {
    if (!baseEntity) return;
    setFields((prev) => [...prev, { entity: baseEntity, field: "", aggregate: "", alias: "" }]);
  };

  const updateField = (index: number, patch: Partial<ReportField>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Filters management ─────────────────────────────
  const addFilter = () => {
    if (!baseEntity) return;
    setFilters((prev) => [...prev, { entity: baseEntity, field: "", operator: "=", value: "" }]);
  };

  const updateFilter = (index: number, patch: Partial<ReportFilter>) => {
    setFilters((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const removeFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Order By management ────────────────────────────
  const addOrderBy = () => {
    if (!baseEntity) return;
    setOrderBy((prev) => [...prev, { entity: baseEntity, field: "", direction: "asc" }]);
  };

  const updateOrderBy = (index: number, patch: Partial<ReportOrderBy>) => {
    setOrderBy((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  };

  const removeOrderBy = (index: number) => {
    setOrderBy((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBaseEntityChange = (value: string) => {
    setBaseEntity(value);
    setFields([]);
    setFilters([]);
    setOrderBy([]);
    setResults([]);
    setResultMeta(null);
    setHasRun(false);
    setRunError("");
  };

  const buildPayload = (page = 1) => {
    const cleanedFields = fields
      .filter((f) => f.entity && f.field)
      .map((f) => ({
        entity: f.entity,
        field: f.field,
        ...(f.aggregate ? { aggregate: f.aggregate } : {}),
        ...(f.alias ? { alias: f.alias } : {}),
      }));

    const cleanedFilters = filters
      .filter((f) => f.entity && f.field && f.operator)
      .map((f) => {
        const opMeta = OPERATORS.find((o) => o.value === f.operator);
        const base: any = { entity: f.entity, field: f.field, operator: f.operator };
        if (!opMeta?.noValue) {
          if (opMeta?.arrayValue) {
            base.value = String(f.value ?? "")
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean);
          } else {
            base.value = f.value;
          }
        }
        return base;
      });

    const cleanedOrderBy = orderBy
      .filter((o) => o.entity && o.field)
      .map((o) => ({
        entity: o.entity,
        field: o.field,
        direction: o.direction,
        ...(o.aggregate ? { aggregate: o.aggregate } : {}),
      }));

    return {
      base_entity: baseEntity,
      fields: cleanedFields,
      ...(cleanedFilters.length ? { filters: cleanedFilters } : {}),
      ...(cleanedOrderBy.length ? { order_by: cleanedOrderBy } : {}),
      per_page: perPage,
      page,
    };
  };

  const handleRun = async (page = 1) => {
    if (!baseEntity || fields.filter((f) => f.entity && f.field).length === 0) {
      setRunError("Selecciona una entidad base y al menos un campo.");
      return;
    }
    setIsRunning(true);
    setRunError("");
    try {
      const res = await runDynamicReport(buildPayload(page));
      if (res.status === 200) {
        setResults(res.data.data);
        setResultMeta(res.data.meta);
        setCurrentPage(page);
        setHasRun(true);
      }
    } catch (err: any) {
      setRunError(err.response?.data?.message || "Error al ejecutar el reporte.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleExport = async () => {
    if (!baseEntity || fields.filter((f) => f.entity && f.field).length === 0) {
      setRunError("Selecciona una entidad base y al menos un campo.");
      return;
    }
    setIsExporting(true);
    setRunError("");
    try {
      const { base_entity, fields: f, filters: fi, order_by } = buildPayload();
      const res = await exportDynamicReport({ base_entity, fields: f, filters: fi, order_by });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const now = new Date();
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
      a.download = `reporte_${ts}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setRunError(err.response?.data?.message || "Error al exportar el reporte.");
    } finally {
      setIsExporting(false);
    }
  };

  const resultColumns = results.length > 0 ? Object.keys(results[0]) : [];
  const canRun = !!baseEntity && fields.filter((f) => f.entity && f.field).length > 0;

  if (schemaLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    );
  }

  if (schemaError) {
    return (
      <div className="p-6">
        <Alert variant="error" title="Error" message={schemaError} />
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Reportes Dinámicos | Alter Pharma" description="Constructor de reportes dinámicos" />
      <div className="flex flex-col gap-6">
        <PageBreadcrumb pageTitle="Reportes Dinámicos" />

        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Reportes Dinámicos</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Construye reportes personalizados seleccionando entidades, campos, filtros y ordenamiento.
          </p>
        </div>

        {/* ── Builder ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6">

          {/* Entidad base */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">1. Entidad base</h3>
            <div className="max-w-sm">
              <Label>Selecciona la entidad principal del reporte</Label>
              <Select
                options={entityOptions}
                value={baseEntity}
                onChange={handleBaseEntityChange}
                placeholder="Selecciona una entidad..."
              />
            </div>
          </div>

          {/* Campos */}
          {baseEntity && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">2. Campos a mostrar</h3>
                <Button size="sm" onClick={addField}>+ Agregar campo</Button>
              </div>

              {fields.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500">Agrega al menos un campo para el reporte.</p>
              )}

              <div className="space-y-3">
                {fields.map((f, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02]">
                    <div>
                      <Label>Entidad</Label>
                      <Select
                        options={entitySelectOptions}
                        value={f.entity}
                        onChange={(v) => updateField(i, { entity: v, field: "" })}
                      />
                    </div>
                    <div>
                      <Label>Campo</Label>
                      <Select
                        options={fieldsForEntity(f.entity)}
                        value={f.field}
                        onChange={(v) => updateField(i, { field: v })}
                        placeholder="Selecciona campo..."
                        disabled={!f.entity}
                      />
                    </div>
                    <div>
                      <Label>Agregación <span className="text-gray-400 font-normal">(opcional)</span></Label>
                      <Select
                        options={AGGREGATES}
                        value={f.aggregate ?? ""}
                        onChange={(v) => updateField(i, { aggregate: v })}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label>Alias <span className="text-gray-400 font-normal">(opcional)</span></Label>
                        <Input
                          type="text"
                          value={f.alias ?? ""}
                          onChange={(e) => updateField(i, { alias: e.target.value })}
                          placeholder="Nombre columna"
                        />
                      </div>
                      <button
                        onClick={() => removeField(i)}
                        className="mb-0.5 p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtros */}
          {baseEntity && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                  3. Filtros <span className="text-gray-400 text-sm font-normal">(opcional)</span>
                </h3>
                <Button size="sm" variant="outline" onClick={addFilter}>+ Agregar filtro</Button>
              </div>

              {filters.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500">Sin filtros — se incluirán todos los registros.</p>
              )}

              <div className="space-y-3">
                {filters.map((f, i) => {
                  const opMeta = OPERATORS.find((o) => o.value === f.operator);
                  return (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02]">
                      <div>
                        <Label>Entidad</Label>
                        <Select
                          options={entitySelectOptions}
                          value={f.entity}
                          onChange={(v) => updateFilter(i, { entity: v, field: "" })}
                        />
                      </div>
                      <div>
                        <Label>Campo</Label>
                        <Select
                          options={fieldsForEntity(f.entity)}
                          value={f.field}
                          onChange={(v) => updateFilter(i, { field: v })}
                          placeholder="Selecciona campo..."
                          disabled={!f.entity}
                        />
                      </div>
                      <div>
                        <Label>Operador</Label>
                        <Select
                          options={OPERATORS.map((o) => ({ value: o.value, label: o.label }))}
                          value={f.operator}
                          onChange={(v) => updateFilter(i, { operator: v as FilterOperator })}
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        {!opMeta?.noValue ? (
                          <div className="flex-1">
                            <Label>Valor</Label>
                            <Input
                              type="text"
                              value={String(f.value ?? "")}
                              onChange={(e) => updateFilter(i, { value: e.target.value })}
                              placeholder={opMeta?.arrayValue ? "val1, val2, ..." : "Valor"}
                            />
                          </div>
                        ) : (
                          <div className="flex-1" />
                        )}
                        <button
                          onClick={() => removeFilter(i)}
                          className="mb-0.5 p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ordenamiento */}
          {baseEntity && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                  4. Ordenamiento <span className="text-gray-400 text-sm font-normal">(opcional)</span>
                </h3>
                <Button size="sm" variant="outline" onClick={addOrderBy}>+ Agregar orden</Button>
              </div>

              {orderBy.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500">Sin ordenamiento definido.</p>
              )}

              <div className="space-y-3">
                {orderBy.map((o, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02]">
                    <div>
                      <Label>Entidad</Label>
                      <Select
                        options={entitySelectOptions}
                        value={o.entity}
                        onChange={(v) => updateOrderBy(i, { entity: v, field: "" })}
                      />
                    </div>
                    <div>
                      <Label>Campo</Label>
                      <Select
                        options={fieldsForEntity(o.entity)}
                        value={o.field}
                        onChange={(v) => updateOrderBy(i, { field: v })}
                        placeholder="Selecciona campo..."
                        disabled={!o.entity}
                      />
                    </div>
                    <div>
                      <Label>Dirección</Label>
                      <Select
                        options={[
                          { value: "asc", label: "Ascendente (A → Z)" },
                          { value: "desc", label: "Descendente (Z → A)" },
                        ]}
                        value={o.direction}
                        onChange={(v) => updateOrderBy(i, { direction: v as "asc" | "desc" })}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => removeOrderBy(i)}
                        className="mb-0.5 p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ejecutar */}
          {baseEntity && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">5. Ejecutar reporte</h3>

              {runError && (
                <div className="mb-4">
                  <Alert variant="error" title="Error" message={runError} />
                </div>
              )}

              <div className="flex flex-wrap items-end gap-4">
                <div className="w-40">
                  <Label>Filas por página</Label>
                  <Select
                    options={[
                      { value: "20", label: "20" },
                      { value: "50", label: "50" },
                      { value: "100", label: "100" },
                      { value: "500", label: "500" },
                      { value: "1000", label: "1000" },
                    ]}
                    value={perPage.toString()}
                    onChange={(v) => setPerPage(parseInt(v))}
                  />
                </div>
                <Button
                  onClick={() => handleRun(1)}
                  disabled={!canRun || isRunning}
                >
                  {isRunning ? "Ejecutando..." : "Ejecutar reporte"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={!canRun || isExporting}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  {isExporting ? "Exportando..." : "Exportar CSV"}
                </Button>
              </div>
            </div>
          )}

          {/* Resultados */}
          {hasRun && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/[0.05]">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {resultMeta ? `${resultMeta.total} resultado${resultMeta.total !== 1 ? "s" : ""}` : "Resultados"}
                </span>
                {resultMeta && resultMeta.last_page > 1 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Página {currentPage} de {resultMeta.last_page}
                  </span>
                )}
              </div>

              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      {resultColumns.map((col) => (
                        <TableCell key={col} isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">
                          {col}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {results.map((row, ri) => (
                      <TableRow key={ri}>
                        {resultColumns.map((col) => (
                          <TableCell key={col} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {row[col] === null || row[col] === undefined ? (
                              <span className="text-gray-400">—</span>
                            ) : String(row[col])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {results.length === 0 && (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">El reporte no retornó resultados para los filtros aplicados.</p>
                  </div>
                )}
              </div>

              {/* Paginación */}
              {resultMeta && resultMeta.last_page > 1 && (
                <div className="border-t border-gray-200 dark:border-white/[0.05] px-5 py-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Mostrando {((currentPage - 1) * perPage) + 1}–{Math.min(currentPage * perPage, resultMeta.total)} de {resultMeta.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleRun(currentPage - 1)} disabled={currentPage === 1 || isRunning}>
                      Anterior
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRun(currentPage + 1)} disabled={currentPage === resultMeta.last_page || isRunning}>
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
