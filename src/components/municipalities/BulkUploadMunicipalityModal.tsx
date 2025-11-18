import { useState, useEffect, useMemo } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Select from "../form/Select";
import Alert from "../ui/alert/Alert";
import { getCountries } from "../../services/protected/countries.services";
import { getStates } from "../../services/protected/states.services";
import { bulkCreateMunicipalities, type BulkMunicipalityData } from "../../services/protected/municipalities.services";
import { CountryData, StateData } from "../../types/services/protected/countries.types";
import * as XLSX from 'xlsx';

interface BulkUploadMunicipalityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (stateId: number) => void;
}

export default function BulkUploadMunicipalityModal({ isOpen, onClose, onSuccess }: BulkUploadMunicipalityModalProps) {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<BulkMunicipalityData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCountries();
      loadStates();
      // Limpiar todo el estado cuando se abre el modal
      setFile(null);
      setPreviewData([]);
      setErrors([]);
      setSuccessCount(0);
      setFailedCount(0);
      setUploadProgress(0);
      setShowResults(false);
      setIsUploading(false);
      setSelectedCountryId(null);
      setSelectedStateId(null);

      // Limpiar el input de archivo
      const fileInput = document.getElementById('municipality-excel-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }, [isOpen]);

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

  const loadStates = async () => {
    try {
      const response = await getStates();
      if (response.status === 200 && Array.isArray(response.data)) {
        setStates(response.data);
      }
    } catch (error) {
      console.error("Error cargando estados:", error);
    }
  };

  const handleCountryChange = (countryId: string) => {
    if (!countryId) {
      setSelectedCountryId(null);
      setSelectedStateId(null);
      return;
    }
    const id = parseInt(countryId);
    setSelectedCountryId(id);
    setSelectedStateId(null);

    // Reanalizar el archivo si ya hay uno cargado
    if (file) {
      parseExcelFile(file);
    }
  };

  const handleStateChange = (stateId: string) => {
    const id = parseInt(stateId);
    setSelectedStateId(id);

    // Reanalizar el archivo si ya hay uno cargado
    if (file) {
      parseExcelFile(file);
    }
  };

  const clearUploadState = () => {
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    setSuccessCount(0);
    setFailedCount(0);
    setUploadProgress(0);
    setShowResults(false);
    setIsUploading(false);

    // Limpiar el input de archivo
    const fileInput = document.getElementById('municipality-excel-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Limpiar todo el estado de la carga anterior
      clearUploadState();
      setFile(selectedFile);

      // Parsear el nuevo archivo
      parseExcelFile(selectedFile);
    }
  };

  const parseExcelFile = (file: File) => {
    if (!selectedStateId) {
      setErrors(['Debes seleccionar un país y una ciudad/provincia antes de cargar el archivo']);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const parsedData: BulkMunicipalityData[] = jsonData.map((row: any) => ({
          state_id: selectedStateId!,
          name: row['Nombre'] || row['name'] || '',
          code: row['Código'] || row['code'] || '',
          status: row['Estado'] === 'ACTIVO' || row['status'] === true || row['status'] === 'true' || true,
        }));

        setPreviewData(parsedData);
        setErrors([]);
      } catch (error) {
        console.error("Error al leer el archivo Excel:", error);
        setErrors(['Error al leer el archivo Excel. Por favor verifica que el formato sea correcto.']);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!selectedStateId) {
      setErrors(['Debes seleccionar un país y una ciudad/provincia']);
      return;
    }

    if (previewData.length === 0) {
      setErrors(['No hay datos para cargar']);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrors([]);
    setSuccessCount(0);
    setFailedCount(0);

    const batchSize = 50;
    const totalBatches = Math.ceil(previewData.length / batchSize);
    let allSuccess = 0;
    let allFailed = 0;
    const allErrors: string[] = [];

    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, previewData.length);
      const batch = previewData.slice(start, end);

      try {
        const response = await bulkCreateMunicipalities(selectedStateId, { municipalities: batch });

        console.log('Respuesta del lote:', response);

        allSuccess += response.data.summary.created;
        allFailed += response.data.summary.failed;

        if (response.data.errors.length > 0) {
          allErrors.push(...response.data.errors.map((err: any) => {
            const rowNumber = start + err.index + 1;
            const errorMessage = err.error || (Array.isArray(err.errors) ? err.errors.join(', ') : JSON.stringify(err.errors || err));
            return `Fila ${rowNumber}: ${errorMessage}`;
          }));
        }

        setUploadProgress(Math.round(((i + 1) / totalBatches) * 100));
        setSuccessCount(allSuccess);
        setFailedCount(allFailed);
      } catch (error: any) {
        console.error("Error en lote (catch):", error);
        console.error("Error response:", error?.response);
        const errorMessage = error?.response?.data?.message || error?.message || 'Error desconocido';
        allErrors.push(`Error en lote ${i + 1}: ${errorMessage}`);
        allFailed += batch.length;
        setFailedCount(allFailed);
      }

      // Pequeña pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setErrors(allErrors);
    setIsUploading(false);
    setShowResults(true);

    // Llamar onSuccess para recargar los datos si hubo registros exitosos
    if (allSuccess > 0) {
      onSuccess(selectedStateId);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Nombre': 'Santo Domingo Este',
        'Código': 'SDE',
        'Estado': 'ACTIVO',
      },
      {
        'Nombre': 'Santo Domingo Norte',
        'Código': 'SDN',
        'Estado': 'ACTIVO',
      },
      {
        'Nombre': 'Santo Domingo Oeste',
        'Código': 'SDO',
        'Estado': 'ACTIVO',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Municipios");

    XLSX.writeFile(wb, 'plantilla_municipios_cantones.xlsx');
  };

  const resetModal = () => {
    setFile(null);
    setPreviewData([]);
    setSelectedCountryId(null);
    setSelectedStateId(null);
    setErrors([]);
    setSuccessCount(0);
    setFailedCount(0);
    setUploadProgress(0);
    setShowResults(false);
    onClose();
  };

  const countryOptions = useMemo(() => {
    return countries
      .filter(c => c.status)
      .map(c => ({ value: c.id.toString(), label: c.name }));
  }, [countries]);

  const stateOptions = useMemo(() => {
    if (!selectedCountryId) return [];
    // Comparar como strings para evitar problemas de tipo
    const countryIdStr = selectedCountryId.toString();
    return states
      .filter(s => s.country_id.toString() === countryIdStr && s.status)
      .map(s => ({ value: s.id.toString(), label: s.name }));
  }, [states, selectedCountryId]);

  return (
    <Modal isOpen={isOpen} onClose={resetModal} className="max-w-4xl m-4">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
        <div className="px-2 pr-14 mb-6">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Carga Masiva de Municipios/Cantones
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Carga múltiples municipios o cantones desde un archivo Excel
          </p>
        </div>

        {showResults && (
          <div className="px-2 mb-4 space-y-3">
            <Alert
              variant={failedCount === 0 ? "success" : "warning"}
              title="Proceso completado"
              message={`Se crearon ${successCount} municipios/cantones exitosamente. ${failedCount > 0 ? `${failedCount} fallaron.` : ''}`}
            />
            {errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h6 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">Detalles de errores:</h6>
                <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 max-h-40 overflow-y-auto">
                  {errors.map((error, index) => (
                    <li key={index} className="pl-2">• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="px-2 space-y-6">
          {/* Paso 1: Seleccionar País y Estado */}
          <div>
            <h5 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
              Paso 1: Selecciona el país y la ciudad/provincia
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>País *</Label>
                <Select
                  options={countryOptions}
                  placeholder="Selecciona un país"
                  onChange={handleCountryChange}
                  value={selectedCountryId?.toString() || ""}
                />
              </div>
              <div>
                <Label>Ciudad/Provincia *</Label>
                <Select
                  options={stateOptions}
                  placeholder="Selecciona una ciudad/provincia"
                  onChange={handleStateChange}
                  value={selectedStateId?.toString() || ""}
                  disabled={!selectedCountryId}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Todos los municipios/cantones se crearán en la ciudad/provincia seleccionada
                </p>
              </div>
            </div>
          </div>

          {/* Paso 2: Template */}
          <div>
            <h5 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
              Paso 2: Descarga la plantilla
            </h5>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Descarga la plantilla Excel con el formato correcto para cargar los municipios/cantones:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 mb-3 space-y-1 list-disc list-inside">
                <li><strong>Nombre:</strong> Nombre del municipio o cantón</li>
                <li><strong>Código:</strong> Código o abreviatura (ej: SDE, SDN, SDO)</li>
                <li><strong>Estado:</strong> ACTIVO o INACTIVO (opcional, por defecto ACTIVO)</li>
              </ul>
              <Button size="sm" onClick={downloadTemplate}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar Plantilla Excel
              </Button>
            </div>
          </div>

          {/* Paso 3: Cargar archivo */}
          {selectedCountryId && selectedStateId && (
            <div>
              <h5 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
                Paso 3: Carga el archivo Excel
              </h5>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="municipality-excel-upload"
                  disabled={isUploading}
                />
                <label htmlFor="municipality-excel-upload" className="cursor-pointer">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {file ? file.name : 'Haz clic para seleccionar un archivo Excel'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    Formatos soportados: .xlsx, .xls
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* Vista previa */}
          {previewData.length > 0 && !isUploading && !showResults && (
            <div>
              <h5 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
                Vista previa ({previewData.length} municipios/cantones)
              </h5>
              <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ciudad/Provincia</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {previewData.slice(0, 10).map((item, index) => {
                      const state = states.find(s => s.id === item.state_id);
                      return (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              {item.code}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              item.status
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {item.status ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{state?.name}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
                    Mostrando 10 de {previewData.length} municipios/cantones
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progreso */}
          {isUploading && (
            <div>
              <h5 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
                Procesando carga masiva...
              </h5>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  ⏳ Este proceso puede tardar algunos minutos. Por favor, mantén esta ventana abierta hasta que se complete.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Progreso: {uploadProgress}%</span>
                  <span>Procesadas: {successCount + failedCount} de {previewData.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Exitosas</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{successCount}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Fallidas</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{failedCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={resetModal}
            disabled={isUploading}
          >
            {showResults ? 'Cerrar' : 'Cancelar'}
          </Button>
          {showResults && (
            <Button
              size="sm"
              onClick={clearUploadState}
            >
              Cargar Otro Archivo
            </Button>
          )}
          {previewData.length > 0 && !showResults && (
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={isUploading || !selectedStateId}
            >
              {isUploading ? 'Procesando...' : `Cargar ${previewData.length} Municipios/Cantones`}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
