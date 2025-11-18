import { useState } from "react";
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
import { searchPatients } from "../../../services/protected/patients.services";
import { PatientData } from "../../../types/services/protected/patients.types";
import { formatDate } from "../../../helper/formatData";
import * as XLSX from 'xlsx';

export default function PacientesPage() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Filtros de búsqueda
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchIdentification, setSearchIdentification] = useState("");

  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modals
  const { isOpen: isDetailOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que haya al menos un filtro
    if (!searchName && !searchEmail && !searchPhone && !searchIdentification) {
      setErrors({ general: "Debe proporcionar al menos un filtro de búsqueda" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const params: any = {};
      if (searchName) params.name = searchName;
      if (searchEmail) params.email = searchEmail;
      if (searchPhone) params.phone = searchPhone;
      if (searchIdentification) params.identification_number = searchIdentification;

      const response = await searchPatients(params);
      if (response.status === 200 && Array.isArray(response.data)) {
        setPatients(response.data);
        setHasSearched(true);
      }
    } catch (error: any) {
      console.error("Error buscando pacientes:", error);
      if (error.response?.status === 400) {
        setErrors({ general: error.response.data.message || "Debe proporcionar al menos un filtro de búsqueda" });
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Ocurrió un error al buscar pacientes" });
      }
      setPatients([]);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchName("");
    setSearchEmail("");
    setSearchPhone("");
    setSearchIdentification("");
    setPatients([]);
    setHasSearched(false);
    setErrors({});
  };

  const openDetail = (patient: PatientData) => {
    setSelectedPatient(patient);
    openDetailModal();
  };

  const handleCloseDetail = () => {
    setSelectedPatient(null);
    closeDetailModal();
  };

  // Función para exportar a Excel
  const handleExportToExcel = () => {
    try {
      // Preparar los datos para exportar
      const dataToExport = patients.map(patient => {
        const fullName = `${patient.first_name} ${patient.last_name}${patient.second_last_name ? ' ' + patient.second_last_name : ''}`;

        return {
          'ID': patient.id,
          'Nombre Completo': fullName,
          'Email': patient.email || 'N/A',
          'Teléfono': patient.phone || 'N/A',
          'Tipo de Identificación': patient.identification_type || 'N/A',
          'Número de Identificación': patient.identification_number || 'N/A',
          'País': patient.country?.name || 'N/A',
          'Estado/Ciudad': patient.state?.name || 'N/A',
          'Municipio': patient.municipality?.name || 'N/A',
          'Fecha de Nacimiento': patient.date_of_birth || 'N/A',
          'Género': patient.gender || 'N/A',
          'Tipo': patient.type || 'N/A',
          'Registrado': patient.is_registered ? 'Sí' : 'No',
          'Estado': patient.status || 'N/A',
          'Fecha de Creación': formatDate(patient.created_at)
        };
      });

      // Crear libro de trabajo
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pacientes');

      // Ajustar el ancho de las columnas
      const columnWidths = [
        { wch: 5 },   // ID
        { wch: 40 },  // Nombre Completo
        { wch: 30 },  // Email
        { wch: 15 },  // Teléfono
        { wch: 25 },  // Tipo de Identificación
        { wch: 25 },  // Número de Identificación
        { wch: 25 },  // País
        { wch: 25 },  // Estado/Ciudad
        { wch: 25 },  // Municipio
        { wch: 18 },  // Fecha de Nacimiento
        { wch: 12 },  // Género
        { wch: 15 },  // Tipo
        { wch: 12 },  // Registrado
        { wch: 12 },  // Estado
        { wch: 18 }   // Fecha de Creación
      ];
      worksheet['!cols'] = columnWidths;

      // Generar archivo Excel
      const timestamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Pacientes_${timestamp}.xlsx`);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
    }
  };

  return (
    <>
      <PageMeta title="Pacientes | Alter Pharma" description="Gestión de pacientes en el sistema" />
      <div className="flex flex-col gap-6">
        <PageBreadcrumb pageTitle="Pacientes" />

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Consultar Pacientes</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Busca pacientes por nombre, email, teléfono o número de identificación
            </p>
          </div>
          {hasSearched && patients.length > 0 && (
            <Button onClick={handleExportToExcel} size="md" variant="outline">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Exportar a Excel
            </Button>
          )}
        </div>

        {/* Formulario de búsqueda */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          {Object.keys(errors).length > 0 && (
            <div className="mb-4">
              <Alert
                variant="error"
                title="Error"
                message={errors.general || "Ocurrió un error al buscar pacientes"}
              />
            </div>
          )}
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Ej: Carlos"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Ej: paciente@example.com"
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  type="text"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Ej: 8095551234"
                />
              </div>
              <div>
                <Label>Número de Identificación</Label>
                <Input
                  type="text"
                  value={searchIdentification}
                  onChange={(e) => setSearchIdentification(e.target.value)}
                  placeholder="Ej: 001-123456-7"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Buscando...' : 'Buscar'}
              </Button>
              <Button type="button" variant="outline" onClick={resetSearch}>
                Limpiar
              </Button>
            </div>
          </form>
        </div>

        {/* Tabla de resultados */}
        {hasSearched && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Paciente</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Identificación</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ubicación</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Contacto</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ciudad</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Acciones</TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{patient.id}</TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div>
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {patient.first_name} {patient.last_name} {patient.second_last_name}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : 'Otro'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                        {patient.identification_number}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="text-sm">
                          <span className="block text-gray-800 dark:text-white/90">{patient.country.name}</span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">{patient.state.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="text-sm">
                          <span className="block text-gray-800 dark:text-white/90">{patient.email}</span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">{patient.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          patient.status === 'active'
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {patient.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <button onClick={() => openDetail(patient)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg dark:text-purple-400 dark:hover:bg-purple-900/20" title="Ver detalles">
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

              {patients.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">No se encontraron pacientes</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    No hay resultados para los filtros aplicados.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Ver Detalles de Paciente */}
      <Modal isOpen={isDetailOpen} onClose={handleCloseDetail} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {selectedPatient?.first_name} {selectedPatient?.last_name} {selectedPatient?.second_last_name}
            </h4>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                selectedPatient?.status === 'active'
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {selectedPatient?.status === 'active' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
          <div className="px-2 pb-4 space-y-4 max-h-[500px] overflow-y-auto">
            <div>
              <Label>Información personal</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Identificación:</span> {selectedPatient?.identification_number}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Fecha de nacimiento:</span> {selectedPatient && formatDate(selectedPatient.date_of_birth)}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Género:</span> {selectedPatient?.gender === 'male' ? 'Masculino' : selectedPatient?.gender === 'female' ? 'Femenino' : 'Otro'}
                </p>
              </div>
            </div>

            <div>
              <Label>Información de contacto</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Email:</span> {selectedPatient?.email}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Teléfono:</span> {selectedPatient?.phone}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Dirección:</span> {selectedPatient?.street_address}
                </p>
              </div>
            </div>

            <div>
              <Label>Ubicación</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">País:</span> {selectedPatient?.country.name}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Ciudad:</span> {selectedPatient?.state.name}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Municipio/Cantón:</span> {selectedPatient?.municipality.name}
                </p>
              </div>
            </div>

            {selectedPatient && selectedPatient.doctors.length > 0 && (
              <div>
                <Label>Doctores asociados</Label>
                <div className="mt-2 space-y-2">
                  {selectedPatient.doctors.map((doctor) => (
                    <div key={doctor.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{doctor.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{doctor.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Licencia: {doctor.license_number}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPatient && selectedPatient.product_doses.length > 0 && (
              <div>
                <Label>Productos/Presentación asignadas</Label>
                <div className="mt-2 space-y-2">
                  {selectedPatient.product_doses.map((dose) => (
                    <div key={dose.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{dose.product.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Presentación: {dose.dose}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Promoción: Compra {dose.promotion_buy} Lleva {dose.promotion_get}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Información adicional</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Registrado:</span> {selectedPatient?.is_registered ? 'Sí' : 'No'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Último login:</span> {selectedPatient?.last_login ? formatDate(selectedPatient.last_login) : 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Creado por:</span> {selectedPatient?.created_by.commercial_name}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" onClick={handleCloseDetail}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
