import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Select from "../form/Select";
import Alert from "../ui/alert/Alert";
import { getDistributors } from "../../services/protected/distributors.services";
import { bulkCreatePharmacies, type BulkPharmacyData } from "../../services/protected/pharmacies.services";
import { DistributorData } from "../../types/services/protected/distributors.types";
import * as XLSX from 'xlsx';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const [distributors, setDistributors] = useState<DistributorData[]>([]);
  const [selectedDistributorId, setSelectedDistributorId] = useState<number | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<BulkPharmacyData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDistributors();
      // Limpiar todo cuando se abre el modal
      setFile(null);
      setPreviewData([]);
      setErrors([]);
      setSuccessCount(0);
      setFailedCount(0);
      setUploadProgress(0);
      setShowResults(false);
      setIsUploading(false);
      setSelectedDistributorId(null);

      // Limpiar el input de archivo
      const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }, [isOpen]);

  const loadDistributors = async () => {
    try {
      const response = await getDistributors();
      if (response.status === 200 && Array.isArray(response.data)) {
        setDistributors(response.data);
      }
    } catch (error) {
      console.error("Error cargando distribuidores:", error);
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
    const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Limpiar todo el ciudad de la carga anterior
      clearUploadState();
      setFile(selectedFile);

      // Parsear el nuevo archivo
      parseExcelFile(selectedFile);
    }
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const parsedData: BulkPharmacyData[] = jsonData.map((row: any) => ({
          country_name: row['País'] || row['country_name'] || '',
          state_name: row['Estado/Provincia'] || row['state_name'] || '',
          municipality_name: row['Municipio/Cantón'] || row['municipality_name'] || '',
          legal_name: row['Razón Social'] || row['legal_name'] || '',
          commercial_name: row['Nombre Comercial'] || row['commercial_name'] || '',
          identification_number: String(row['RNC'] || row['identification_number'] || ''),
          street_address: row['Dirección'] || row['street_address'] || '',
          phone: String(row['Teléfono'] || row['phone'] || ''),
          email: row['Email'] || row['email'] || '',
          administrator_name: row['Administrador'] || row['administrator_name'] || '',
          is_chain: row['Es Cadena'] === 'SI' || row['Es Cadena'] === 'TRUE' || row['Es Cadena'] === 'true' || row['is_chain'] === true || row['is_chain'] === 'true' || false,
          distributor_id: selectedDistributorId!,
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
    if (!selectedDistributorId) {
      setErrors(['Debes seleccionar un distribuidor antes de cargar el archivo']);
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

    const batchSize = 10;
    const totalBatches = Math.ceil(previewData.length / batchSize);
    let allSuccess = 0;
    let allFailed = 0;
    const allErrors: string[] = [];

    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, previewData.length);
      const batch = previewData.slice(start, end);

      try {
        const response = await bulkCreatePharmacies({ pharmacies: batch });

        console.log('Respuesta del lote:', response);

        allSuccess += response.data.summary.created;
        allFailed += response.data.summary.failed;

        if (response.data.errors.length > 0) {
          allErrors.push(...response.data.errors.map((err: any) => {
            const rowNumber = start + err.index + 1;
            const pharmacyName = err.data?.commercial_name || err.data?.legal_name || `Fila ${rowNumber}`;
            const errorMessage = err.error || (Array.isArray(err.errors) ? err.errors.join(', ') : JSON.stringify(err.errors || err));
            return `${pharmacyName} (Fila ${rowNumber}): ${errorMessage}`;
          }));
        }

        setUploadProgress(Math.round(((i + 1) / totalBatches) * 100));
        setSuccessCount(allSuccess);
        setFailedCount(allFailed);
      } catch (error: any) {
        console.error("Error en lote (catch):", error);
        console.error("Error response:", error?.response);

        // Verificar si el error tiene datos de respuesta con errores detallados
        if (error?.response?.data?.data?.errors && Array.isArray(error.response.data.data.errors)) {
          const responseData = error.response.data.data;

          // Actualizar contadores
          allSuccess += responseData.summary?.created || 0;
          allFailed += responseData.summary?.failed || 0;

          // Procesar errores detallados
          allErrors.push(...responseData.errors.map((err: any) => {
            const rowNumber = start + err.index + 1;
            const pharmacyName = err.data?.commercial_name || err.data?.legal_name || `Fila ${rowNumber}`;
            const errorMessage = err.error || (Array.isArray(err.errors) ? err.errors.join(', ') : JSON.stringify(err.errors || err));
            return `${pharmacyName} (Fila ${rowNumber}): ${errorMessage}`;
          }));
        } else {
          // Error genérico sin detalles
          const errorMessage = error?.response?.data?.message || error?.message || 'Error desconocido';
          allErrors.push(`Error en lote ${i + 1}: ${errorMessage}`);
          allFailed += batch.length;
        }

        setSuccessCount(allSuccess);
        setFailedCount(allFailed);
      }

      // Pequeña pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setErrors(allErrors);
    setIsUploading(false);
    setShowResults(true);

    if (allSuccess > 0) {
      onSuccess();
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'País': 'República Dominicana',
        'Estado/Provincia': 'Santo Domingo',
        'Municipio/Cantón': 'Distrito Nacional',
        'Razón Social': 'Farmacia Ejemplo S.A.',
        'Nombre Comercial': 'Farmacia Ejemplo',
        'RNC': '123456789',
        'Dirección': 'Calle Principal #123',
        'Teléfono': '555-1234',
        'Email': 'farmacia@example.com',
        'Administrador': 'Juan Pérez',
        'Es Cadena': 'NO',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Farmacias");

    // Agregar comentarios en la primera fila
    if (!ws['!comments']) ws['!comments'] = [];

    XLSX.writeFile(wb, 'plantilla_farmacias.xlsx');
  };

  const resetModal = () => {
    setFile(null);
    setPreviewData([]);
    setSelectedDistributorId(null);
    setErrors([]);
    setSuccessCount(0);
    setFailedCount(0);
    setUploadProgress(0);
    setShowResults(false);
    onClose();
  };

  const distributorOptions = distributors
    .filter(d => d.status)
    .map(d => ({ value: d.id.toString(), label: d.business_name }));

  return (
    <Modal isOpen={isOpen} onClose={resetModal} className="max-w-4xl m-4">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
        <div className="px-2 pr-14 mb-6">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Carga Masiva de Farmacias
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Carga múltiples farmacias desde un archivo Excel
          </p>
        </div>

        {showResults && (
          <div className="px-2 mb-4 space-y-3">
            <Alert
              variant={failedCount === 0 ? "success" : "warning"}
              title="Proceso completado"
              message={`Se crearon ${successCount} farmacias exitosamente. ${failedCount > 0 ? `${failedCount} fallaron.` : ''} Los usuarios recibirán un correo con sus credenciales de acceso.`}
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
          {/* Paso 1: Seleccionar Distribuidor */}
          <div>
            <h5 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
              Paso 1: Selecciona el distribuidor
            </h5>
            <div className="max-w-md">
              <Label>Distribuidor *</Label>
              <Select
                options={distributorOptions}
                placeholder="Selecciona un distribuidor"
                onChange={(value) => setSelectedDistributorId(parseInt(value))}
                value={selectedDistributorId?.toString() || ""}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                El distribuidor seleccionado se asignará a todas las farmacias del archivo Excel
              </p>
            </div>
          </div>

          {/* Paso 2: Template */}
          <div>
            <h5 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
              Paso 2: Descarga la plantilla
            </h5>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Descarga la plantilla Excel con el formato correcto para cargar las farmacias:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 mb-3 space-y-1 list-disc list-inside">
                <li><strong>País:</strong> Nombre del país (ej: República Dominicana)</li>
                <li><strong>Estado/Provincia:</strong> Nombre del estado o provincia</li>
                <li><strong>Municipio/Cantón:</strong> Nombre del municipio o cantón</li>
                <li><strong>Razón Social:</strong> Nombre legal de la farmacia</li>
                <li><strong>Nombre Comercial:</strong> Nombre con el que se conoce</li>
                <li><strong>RNC:</strong> Número de identificación fiscal</li>
                <li><strong>Dirección:</strong> Dirección física de la farmacia</li>
                <li><strong>Teléfono:</strong> Número de contacto</li>
                <li><strong>Email:</strong> Correo electrónico (se usará para el acceso)</li>
                <li><strong>Administrador:</strong> Nombre del administrador</li>
                <li><strong>Es Cadena:</strong> Escribe "SI" si es cadena, "NO" si no lo es</li>
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
          {selectedDistributorId && (
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
                  id="excel-upload"
                  disabled={isUploading}
                />
                <label htmlFor="excel-upload" className="cursor-pointer">
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
                Vista previa ({previewData.length} farmacias)
              </h5>
              <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre Comercial</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Administrador</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {previewData.slice(0, 10).map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.commercial_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.administrator_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.is_chain
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {item.is_chain ? 'Cadena' : 'Independiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
                    Mostrando 10 de {previewData.length} farmacias
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
                  ⏳ Este proceso puede tardar varios minutos. Por favor, mantén esta ventana abierta hasta que se complete.
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
              disabled={isUploading || !selectedDistributorId}
            >
              {isUploading ? 'Procesando...' : `Cargar ${previewData.length} Farmacias`}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
