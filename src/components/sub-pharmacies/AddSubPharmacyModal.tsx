import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import InputField from "../form/input/InputField";
import Select from "../form/Select";
import Alert from "../ui/alert/Alert";
import { getCountries } from "../../services/protected/countries.services";
import { getStates } from "../../services/protected/states.services";
import { getMunicipalities } from "../../services/protected/municipalities.services";
import { createSubPharmacy, type CreateSubPharmacyParams } from "../../services/protected/sub-pharmacies.services";
import { StateData } from "../../types/services/protected/countries.types";
import { MunicipalityData } from "../../types/services/protected/municipalities.types";

interface AddSubPharmacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pharmacyId: number;
  countryId: number;
}

export default function AddSubPharmacyModal({ isOpen, onClose, onSuccess, pharmacyId, countryId }: AddSubPharmacyModalProps) {
  const [states, setStates] = useState<StateData[]>([]);
  const [municipalities, setMunicipalities] = useState<MunicipalityData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para validación de teléfono
  const [phonePrefix, setPhonePrefix] = useState("");
  const [phoneMinLength, setPhoneMinLength] = useState<number>(0);
  const [phoneMaxLength, setPhoneMaxLength] = useState<number>(0);

  const [formData, setFormData] = useState<CreateSubPharmacyParams>({
    state_id: 0,
    municipality_id: 0,
    commercial_name: "",
    street_address: "",
    phone: "",
    email: "",
    administrator_name: ""
  });

  const [alert, setAlert] = useState<{
    show: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }>({ show: false, type: "success", title: "", message: "" });

  useEffect(() => {
    if (isOpen) {
      loadStates();
      loadCountryPhoneSettings();
      resetForm();
    }
  }, [isOpen]);

  const loadCountryPhoneSettings = async () => {
    try {
      const response = await getCountries();
      if (response.status === 200 && Array.isArray(response.data)) {
        const country = response.data.find(c => Number(c.id) === Number(countryId));
        if (country) {
          const prefix = `+${country.phone_code} `;
          setPhonePrefix(prefix);
          setPhoneMinLength(country.phone_min_length);
          setPhoneMaxLength(country.phone_max_length);
          setFormData(prev => ({ ...prev, phone: prefix }));
        }
      }
    } catch (error) {
      console.error("Error cargando configuración de teléfono:", error);
    }
  };

  const loadStates = async () => {
    try {
      const response = await getStates();
      if (response.status === 200 && Array.isArray(response.data)) {
        const filteredStates = response.data.filter(state => Number(state.country_id) === Number(countryId));
        setStates(filteredStates);
      }
    } catch (error) {
      console.error("Error cargando ciudades:", error);
    }
  };

  const loadMunicipalities = async (stateId: number) => {
    try {
      const response = await getMunicipalities(stateId);
      if (response.status === 200 && Array.isArray(response.data)) {
        setMunicipalities(response.data);
      }
    } catch (error) {
      console.error("Error cargando municipios:", error);
    }
  };


  const handleStateChange = (stateId: string) => {
    const id = parseInt(stateId);
    setFormData({ ...formData, state_id: id, municipality_id: 0 });
    setMunicipalities([]);
    if (id) {
      loadMunicipalities(id);
    }
  };

  const handlePhoneChange = (value: string) => {
    // Asegurar que el teléfono siempre comience con el prefijo del país
    if (phonePrefix && !value.startsWith(phonePrefix)) {
      return; // No permitir eliminar el prefijo
    }

    // Solo permitir números después del prefijo
    const afterPrefix = value.substring(phonePrefix.length);
    const onlyNumbers = afterPrefix.replace(/\D/g, '');

    // Limitar según la longitud máxima
    if (onlyNumbers.length <= phoneMaxLength) {
      setFormData({ ...formData, phone: phonePrefix + onlyNumbers });
    }
  };

  const resetForm = (clearAlert: boolean = true) => {
    setFormData({
      state_id: 0,
      municipality_id: 0,
      commercial_name: "",
      street_address: "",
      phone: phonePrefix || "",
      email: "",
      administrator_name: ""
    });
    setMunicipalities([]);
    if (clearAlert) {
      setAlert({ show: false, type: "success", title: "", message: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.state_id || !formData.municipality_id) {
      setAlert({
        show: true,
        type: "error",
        title: "Error de validación",
        message: "Debes seleccionar ciudad y municipio"
      });
      return;
    }

    // Validar longitud del teléfono (sin contar el prefijo)
    const phoneDigits = formData.phone.substring(phonePrefix.length);
    if (phoneDigits.length < phoneMinLength || phoneDigits.length > phoneMaxLength) {
      setAlert({
        show: true,
        type: "error",
        title: "Error de validación",
        message: `El teléfono debe tener entre ${phoneMinLength} y ${phoneMaxLength} dígitos`
      });
      return;
    }

    setIsLoading(true);
    setAlert({ show: false, type: "success", title: "", message: "" });

    try {
      const response = await createSubPharmacy(pharmacyId, formData);
      if (response.status === 201) {
        setAlert({
          show: true,
          type: "success",
          title: "Éxito",
          message: response.message || "Sucursal creada exitosamente. Credenciales enviadas por email."
        });
        onSuccess();
        // Limpiar formulario para agregar otra sucursal, pero no cerrar el modal ni la alerta de éxito
        resetForm(false);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Error al crear la sucursal";
      const errorData = error?.response?.data?.data;

      let detailedMessage = errorMessage;
      if (errorData && typeof errorData === 'object') {
        const errors = Object.values(errorData).flat();
        if (errors.length > 0) {
          detailedMessage = errors.join(', ');
        }
      }

      setAlert({
        show: true,
        type: "error",
        title: "Error",
        message: detailedMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stateOptions = states
    .filter(s => s.status)
    .map(s => ({ value: s.id.toString(), label: s.name }));

  const municipalityOptions = municipalities
    .filter(m => m.status)
    .map(m => ({ value: m.id.toString(), label: m.name }));


  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl m-4">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
        <div className="px-2 pr-14 mb-6">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Agregar Nueva Sucursal
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Completa los datos de la nueva sucursal
          </p>
        </div>

        {alert.show && (
          <div className="px-2 mb-4">
            <Alert
              variant={alert.type}
              title={alert.title}
              message={alert.message}
            />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="px-2 space-y-4">
            {/* Ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Ciudad/Provincia *</Label>
                <Select
                  options={stateOptions}
                  placeholder="Selecciona una ciudad"
                  onChange={handleStateChange}
                  value={formData.state_id?.toString() || ""}
                />
              </div>
              <div>
                <Label>Municipio/Cantón *</Label>
                <Select
                  options={municipalityOptions}
                  placeholder="Selecciona un municipio/cantón"
                  onChange={(value) => setFormData({ ...formData, municipality_id: parseInt(value) })}
                  value={formData.municipality_id?.toString() || ""}
                  disabled={!formData.state_id}
                />
              </div>
            </div>

            {/* Información básica */}
            <div>
              <Label>Nombre Comercial *</Label>
              <InputField
                type="text"
                placeholder="Ej: Sucursal Centro"
                value={formData.commercial_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, commercial_name: e.target.value })}
              />
            </div>

            <div>
              <Label>Dirección *</Label>
              <InputField
                type="text"
                placeholder="Ej: Calle Principal #123"
                value={formData.street_address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, street_address: e.target.value })}
              />
            </div>

            {/* Contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Teléfono *</Label>
                <InputField
                  type="text"
                  placeholder={phonePrefix ? `${phonePrefix}${"X".repeat(phoneMinLength)}` : "Teléfono"}
                  value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePhoneChange(e.target.value)}
                />
                {phonePrefix && phoneMinLength > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    El prefijo {phonePrefix.trim()} no se puede eliminar. Debe tener entre {phoneMinLength} y {phoneMaxLength} dígitos.
                  </p>
                )}
              </div>
              <div>
                <Label>Email *</Label>
                <InputField
                  type="email"
                  placeholder="Ej: sucursal@farmacia.com"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Nombre del Administrador *</Label>
              <InputField
                type="text"
                placeholder="Ej: Juan Pérez"
                value={formData.administrator_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, administrator_name: e.target.value })}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar Sucursal'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
