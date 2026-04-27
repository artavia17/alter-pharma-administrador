import { useState, useEffect, useMemo } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import Alert from "../ui/alert/Alert";
import { updatePatient } from "../../services/protected/patients.services";
import { getCountries } from "../../services/protected/countries.services";
import { getStates } from "../../services/protected/states.services";
import { getMunicipalities } from "../../services/protected/municipalities.services";
import { PatientData } from "../../types/services/protected/patients.types";
import { CountryData, StateData } from "../../types/services/protected/countries.types";
import { MunicipalityData } from "../../types/services/protected/municipalities.types";

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: PatientData) => void;
  patient: PatientData | null;
}

const IDENTIFICATION_TYPES = [
  { value: "national", label: "Cédula nacional" },
  { value: "foreign", label: "Cédula extranjera" },
  { value: "dimex", label: "DIMEX" },
  { value: "passport", label: "Pasaporte" },
  { value: "other", label: "Otro" },
];

const GENDERS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Femenino" },
  { value: "other", label: "Otro" },
];

export default function EditPatientModal({ isOpen, onClose, onSuccess, patient }: EditPatientModalProps) {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [municipalities, setMunicipalities] = useState<MunicipalityData[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [identificationType, setIdentificationType] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [countryId, setCountryId] = useState<number | null>(null);
  const [stateId, setStateId] = useState<number | null>(null);
  const [municipalityId, setMunicipalityId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen && patient) {
      loadCountries();
      populateForm(patient);
    }
  }, [isOpen, patient]);

  const populateForm = (p: PatientData) => {
    setFirstName(p.first_name);
    setLastName(p.last_name);
    setSecondLastName(p.second_last_name ?? "");
    setIdentificationType(p.identification_type);
    setIdentificationNumber(p.identification_number);
    setDateOfBirth(p.date_of_birth);
    setGender(p.gender);
    setStreetAddress(p.street_address);
    setPhone(p.phone);
    setEmail(p.email);
    setCountryId(p.country_id);
    setStateId(p.state_id);
    setMunicipalityId(p.municipality_id);
    setSuccessMessage("");
    setErrorMessage("");
    if (p.country_id) loadStates(p.country_id);
    if (p.state_id) loadMunicipalities(p.state_id);
  };

  const loadCountries = async () => {
    try {
      const res = await getCountries();
      if (res.status === 200 && Array.isArray(res.data)) setCountries(res.data);
    } catch {}
  };

  const loadStates = async (cid: number) => {
    try {
      const res = await getStates();
      if (res.status === 200 && Array.isArray(res.data)) {
        setStates(res.data.filter((s) => Number(s.country_id) === Number(cid)));
      }
    } catch {}
  };

  const loadMunicipalities = async (sid: number) => {
    try {
      const res = await getMunicipalities(sid);
      if (res.status === 200 && Array.isArray(res.data)) setMunicipalities(res.data);
    } catch {}
  };

  const handleCountryChange = (value: string) => {
    const id = parseInt(value);
    setCountryId(id);
    setStateId(null);
    setMunicipalityId(null);
    setStates([]);
    setMunicipalities([]);
    if (id) loadStates(id);
  };

  const handleStateChange = (value: string) => {
    const id = parseInt(value);
    setStateId(id);
    setMunicipalityId(null);
    setMunicipalities([]);
    if (id) loadMunicipalities(id);
  };

  const handleSubmit = async () => {
    if (!patient) return;
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await updatePatient(patient.id, {
        first_name: firstName,
        last_name: lastName,
        second_last_name: secondLastName || null,
        identification_type: identificationType,
        identification_number: identificationNumber,
        date_of_birth: dateOfBirth,
        gender,
        street_address: streetAddress,
        phone,
        email,
        country_id: countryId ?? undefined,
        state_id: stateId ?? undefined,
        municipality_id: municipalityId ?? undefined,
      });

      if (res.status === 200) {
        setSuccessMessage("Paciente actualizado exitosamente");
        setTimeout(() => {
          onSuccess(res.data);
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      const data = err.response?.data;
      const msg =
        data?.errors
          ? Object.values(data.errors).flat().join(" ")
          : data?.message || "Error al actualizar el paciente";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const countryOptions = useMemo(
    () => countries.filter((c) => c.status).map((c) => ({ value: c.id.toString(), label: c.name })),
    [countries]
  );
  const stateOptions = useMemo(
    () => states.filter((s) => s.status).map((s) => ({ value: s.id.toString(), label: s.name })),
    [states]
  );
  const municipalityOptions = useMemo(
    () => municipalities.filter((m) => m.status).map((m) => ({ value: m.id.toString(), label: m.name })),
    [municipalities]
  );

  if (!patient) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl m-4">
      <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
        <div className="px-2 pr-14 mb-6">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Editar Paciente</h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {patient.first_name} {patient.last_name}
          </p>
        </div>

        {successMessage && (
          <div className="px-2 mb-4">
            <Alert variant="success" title="Éxito" message={successMessage} />
          </div>
        )}
        {errorMessage && (
          <div className="px-2 mb-4">
            <Alert variant="error" title="Error" message={errorMessage} />
          </div>
        )}

        <div className="px-2 space-y-4 max-h-[60vh] overflow-y-auto pr-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre *</Label>
              <Input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nombre" />
            </div>
            <div>
              <Label>Primer apellido *</Label>
              <Input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Primer apellido" />
            </div>
            <div>
              <Label>Segundo apellido <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Input type="text" value={secondLastName} onChange={(e) => setSecondLastName(e.target.value)} placeholder="Segundo apellido" />
            </div>
            <div>
              <Label>Género *</Label>
              <Select options={GENDERS} value={gender} onChange={setGender} placeholder="Selecciona..." />
            </div>
            <div>
              <Label>Tipo de identificación *</Label>
              <Select options={IDENTIFICATION_TYPES} value={identificationType} onChange={setIdentificationType} placeholder="Selecciona..." />
            </div>
            <div>
              <Label>Número de identificación *</Label>
              <Input type="text" value={identificationNumber} onChange={(e) => setIdentificationNumber(e.target.value)} placeholder="Número de identificación" />
            </div>
            <div>
              <Label>Fecha de nacimiento *</Label>
              <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <Label>Teléfono *</Label>
              <Input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono" />
            </div>
            <div>
              <Label>País *</Label>
              <Select options={countryOptions} value={countryId?.toString() ?? ""} onChange={handleCountryChange} placeholder="Selecciona un país" />
            </div>
            <div>
              <Label>Estado/Provincia *</Label>
              <Select options={stateOptions} value={stateId?.toString() ?? ""} onChange={handleStateChange} placeholder="Selecciona un estado" disabled={!countryId} />
            </div>
            <div>
              <Label>Municipio/Cantón *</Label>
              <Select options={municipalityOptions} value={municipalityId?.toString() ?? ""} onChange={(v) => setMunicipalityId(parseInt(v))} placeholder="Selecciona un municipio" disabled={!stateId} />
            </div>
            <div className="md:col-span-2">
              <Label>Dirección</Label>
              <Input type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="Dirección" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
          <Button size="sm" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button size="sm" onClick={handleSubmit} disabled={isLoading || !firstName || !lastName || !email}>
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
