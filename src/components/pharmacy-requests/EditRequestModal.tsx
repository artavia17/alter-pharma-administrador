import { useState, useEffect, useMemo } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import Alert from "../ui/alert/Alert";
import Switch from "../form/switch/Switch";
import { updatePharmacyRequest } from "../../services/protected/pharmacy-requests.services";
import { getCountries } from "../../services/protected/countries.services";
import { getStates } from "../../services/protected/states.services";
import { getMunicipalities } from "../../services/protected/municipalities.services";
import { getDistributors } from "../../services/protected/distributors.services";
import { PharmacyRequestData } from "../../types/services/protected/pharmacy-requests.types";
import { CountryData, StateData } from "../../types/services/protected/countries.types";
import { MunicipalityData } from "../../types/services/protected/municipalities.types";
import { DistributorData } from "../../types/services/protected/distributors.types";

interface EditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: PharmacyRequestData | null;
}

export default function EditRequestModal({ isOpen, onClose, onSuccess, request }: EditRequestModalProps) {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [municipalities, setMunicipalities] = useState<MunicipalityData[]>([]);
  const [distributors, setDistributors] = useState<DistributorData[]>([]);

  // Form fields
  const [legalName, setLegalName] = useState("");
  const [commercialName, setCommercialName] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [administratorName, setAdministratorName] = useState("");
  const [isChain, setIsChain] = useState(false);
  const [countryId, setCountryId] = useState<number | null>(null);
  const [stateId, setStateId] = useState<number | null>(null);
  const [municipalityId, setMunicipalityId] = useState<number | null>(null);
  const [distributorId, setDistributorId] = useState<number | null>(null);
  const [phonePrefix, setPhonePrefix] = useState("");
  const [phoneMinLength, setPhoneMinLength] = useState<number>(0);
  const [phoneMaxLength, setPhoneMaxLength] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen && request) {
      loadCountries();
      loadDistributors();
      loadFormData();
    }
  }, [isOpen, request]);

  const loadFormData = () => {
    if (!request) return;

    setLegalName(request.legal_name);
    setCommercialName(request.commercial_name);
    setIdentificationNumber(request.identification_number);
    setStreetAddress(request.street_address);
    setPhone(request.phone);
    setEmail(request.email);
    setAdministratorName(request.administrator_name);
    setIsChain(request.is_chain);
    setCountryId(request.country_id);
    setStateId(request.state_id);
    setMunicipalityId(request.municipality_id);
    setDistributorId(request.distributor_id);

    // Set phone prefix based on country
    if (request.country) {
      const prefix = `+${request.country.phone_code} `;
      setPhonePrefix(prefix);
      setPhoneMinLength(request.country.phone_min_length);
      setPhoneMaxLength(request.country.phone_max_length);
    }

    // Load related data
    if (request.country_id) {
      loadStates(request.country_id);
    }
    if (request.state_id) {
      loadMunicipalities(request.state_id);
    }
  };

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

  const loadStates = async (countryIdParam: number) => {
    try {
      const response = await getStates();
      if (response.status === 200 && Array.isArray(response.data)) {
        const filteredStates = response.data.filter(state => Number(state.country_id) === Number(countryIdParam));
        setStates(filteredStates);
      }
    } catch (error) {
      console.error("Error cargando estados:", error);
    }
  };

  const loadMunicipalities = async (stateIdParam: number) => {
    try {
      const response = await getMunicipalities(stateIdParam);
      if (response.status === 200 && Array.isArray(response.data)) {
        setMunicipalities(response.data);
      }
    } catch (error) {
      console.error("Error cargando municipios:", error);
    }
  };

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

  const handleCountryChange = (value: string) => {
    const id = parseInt(value);
    setCountryId(id);
    setStateId(null);
    setMunicipalityId(null);
    setStates([]);
    setMunicipalities([]);
    if (id) {
      loadStates(id);

      // Update phone prefix based on selected country
      const country = countries.find(c => Number(c.id) === Number(id));
      if (country) {
        const prefix = `+${country.phone_code} `;
        setPhonePrefix(prefix);
        setPhoneMinLength(country.phone_min_length);
        setPhoneMaxLength(country.phone_max_length);
        // Set phone to prefix when country changes
        setPhone(prefix);
      }
    }
  };

  const handleStateChange = (value: string) => {
    const id = parseInt(value);
    setStateId(id);
    setMunicipalityId(null);
    setMunicipalities([]);
    if (id) {
      loadMunicipalities(id);
    }
  };

  const handlePhoneChange = (value: string) => {
    // If no prefix is set yet, just set the value
    if (!phonePrefix) {
      setPhone(value);
      return;
    }

    // If trying to delete or modify the prefix, keep only the prefix
    if (!value.startsWith(phonePrefix)) {
      setPhone(phonePrefix);
      return;
    }

    // Only allow numbers after the prefix
    const afterPrefix = value.substring(phonePrefix.length);
    const onlyNumbers = afterPrefix.replace(/\D/g, '');

    // Limit to max length
    if (onlyNumbers.length <= phoneMaxLength) {
      setPhone(phonePrefix + onlyNumbers);
    }
  };

  const handleSubmit = async () => {
    if (!request) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    // Validate phone length (without counting the prefix)
    const phoneDigits = phone.substring(phonePrefix.length);
    if (phoneDigits.length < phoneMinLength || phoneDigits.length > phoneMaxLength) {
      setErrorMessage(`El teléfono debe tener entre ${phoneMinLength} y ${phoneMaxLength} dígitos`);
      setIsLoading(false);
      return;
    }

    try {
      const response = await updatePharmacyRequest(request.id, {
        country_id: countryId!,
        state_id: stateId!,
        municipality_id: municipalityId!,
        distributor_id: distributorId!,
        legal_name: legalName,
        commercial_name: commercialName,
        identification_number: identificationNumber,
        street_address: streetAddress,
        phone,
        email,
        administrator_name: administratorName,
        is_chain: isChain,
      });

      if (response.status === 200) {
        setSuccessMessage("Solicitud actualizada exitosamente");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error actualizando solicitud:", error);
      const errorMsg = error?.response?.data?.message || "Error al actualizar la solicitud";
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const countryOptions = useMemo(() => {
    return countries
      .filter(c => c.status)
      .map(c => ({ value: c.id.toString(), label: c.name }));
  }, [countries]);

  const stateOptions = useMemo(() => {
    return states
      .filter(s => s.status)
      .map(s => ({ value: s.id.toString(), label: s.name }));
  }, [states]);

  const municipalityOptions = useMemo(() => {
    return municipalities
      .filter(m => m.status)
      .map(m => ({ value: m.id.toString(), label: m.name }));
  }, [municipalities]);

  const distributorOptions = useMemo(() => {
    return distributors
      .filter(d => d.status)
      .map(d => ({ value: d.id.toString(), label: d.business_name }));
  }, [distributors]);

  if (!request) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl m-4">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          Editar Solicitud de Farmacia
        </h2>

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

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Razón Social *</Label>
              <Input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Razón Social"
              />
            </div>
            <div>
              <Label>Nombre Comercial *</Label>
              <Input
                type="text"
                value={commercialName}
                onChange={(e) => setCommercialName(e.target.value)}
                placeholder="Nombre Comercial"
              />
            </div>
            <div>
              <Label>RNC/Identificación *</Label>
              <Input
                type="text"
                value={identificationNumber}
                onChange={(e) => setIdentificationNumber(e.target.value)}
                placeholder="RNC/Identificación"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />
            </div>
            <div>
              <Label>Teléfono *</Label>
              <Input
                type="text"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Teléfono"
              />
              {phonePrefix && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  El prefijo {phonePrefix.trim()} es automático. Ingrese {phoneMinLength}-{phoneMaxLength} dígitos.
                </p>
              )}
            </div>
            <div>
              <Label>Administrador *</Label>
              <Input
                type="text"
                value={administratorName}
                onChange={(e) => setAdministratorName(e.target.value)}
                placeholder="Nombre del Administrador"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Dirección *</Label>
              <Input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Dirección"
              />
            </div>
            <div>
              <Label>País *</Label>
              <Select
                options={countryOptions}
                value={countryId?.toString() || ""}
                onChange={handleCountryChange}
                placeholder="Selecciona un país"
              />
            </div>
            <div>
              <Label>Estado/Provincia *</Label>
              <Select
                options={stateOptions}
                value={stateId?.toString() || ""}
                onChange={handleStateChange}
                placeholder="Selecciona un estado"
                disabled={!countryId}
              />
            </div>
            <div>
              <Label>Municipio/Cantón *</Label>
              <Select
                options={municipalityOptions}
                value={municipalityId?.toString() || ""}
                onChange={(value) => setMunicipalityId(parseInt(value))}
                placeholder="Selecciona un municipio"
                disabled={!stateId}
              />
            </div>
            <div>
              <Label>Distribuidor *</Label>
              <Select
                options={distributorOptions}
                value={distributorId?.toString() || ""}
                onChange={(value) => setDistributorId(parseInt(value))}
                placeholder="Selecciona un distribuidor"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <Switch
                checked={isChain}
                onChange={setIsChain}
              />
              <Label className="mb-0">¿Es cadena de farmacias?</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
