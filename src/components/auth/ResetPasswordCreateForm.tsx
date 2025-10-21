import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import type {
  ResetPasswordCreateFormData,
  ResetPasswordCreateFormErrors,
} from "../../types/auth";
import { resetPasswordCreate } from "../../services/auth/auth.services";

export default function ResetPasswordCreateForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [formData, setFormData] = useState<ResetPasswordCreateFormData>({
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<ResetPasswordCreateFormErrors>({});
  const [touched, setTouched] = useState<{ password: boolean; password_confirmation: boolean }>({
    password: false,
    password_confirmation: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validar que tenemos token y email
  useEffect(() => {
    if (!token || !email) {
      setErrors({
        general: "El enlace de restablecimiento es inválido o ha expirado. Por favor solicita uno nuevo.",
      });
    }
  }, [token, email]);

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return "La contraseña es requerida";
    }
    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    if (!/[A-Z]/.test(password)) {
      return "La contraseña debe contener al menos una letra mayúscula";
    }
    if (!/[a-z]/.test(password)) {
      return "La contraseña debe contener al menos una letra minúscula";
    }
    if (!/[0-9]/.test(password)) {
      return "La contraseña debe contener al menos un número";
    }
    return undefined;
  };

  const validatePasswordConfirmation = (confirmation: string, password: string): string | undefined => {
    if (!confirmation) {
      return "Debes confirmar la contraseña";
    }
    if (confirmation !== password) {
      return "Las contraseñas no coinciden";
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: ResetPasswordCreateFormErrors = {
      password: validatePassword(formData.password),
      password_confirmation: validatePasswordConfirmation(
        formData.password_confirmation,
        formData.password
      ),
    };

    setErrors(newErrors);
    return !newErrors.password && !newErrors.password_confirmation;
  };

  const handleInputChange = (field: keyof ResetPasswordCreateFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validar en tiempo real solo si el campo ya fue tocado
    if (touched[field]) {
      let error: string | undefined;
      if (field === "password") {
        error = validatePassword(value);
      } else {
        error = validatePasswordConfirmation(value, formData.password);
      }
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: keyof ResetPasswordCreateFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    let error: string | undefined;
    if (field === "password") {
      error = validatePassword(formData[field]);
    } else {
      error = validatePasswordConfirmation(formData[field], formData.password);
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que tenemos token y email
    if (!token || !email) {
      setErrors({
        general: "El enlace de restablecimiento es inválido. Por favor solicita uno nuevo.",
      });
      return;
    }

    // Marcar todos los campos como tocados
    setTouched({ password: true, password_confirmation: true });

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {

      const resp = await resetPasswordCreate(
        {
          password: formData.password,
          password_confirmation: formData.password_confirmation,
        }, 
        email, token
      );
      
      if(resp.status == 202){
        setIsSuccess(true);

        // Redirigir después de 3 segundos
        setTimeout(() => {
          navigate("/auth/sign-in");
        }, 3000);
      }else{
        setErrors({
          general: resp.message || "No se pudo restablecer la contraseña. Verifica los datos e intenta nuevamente.",
        });
      }
      

    } catch (error: any) {
      console.error("Error al restablecer contraseña:", error);

      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({
          general: "No se pudo restablecer la contraseña. El enlace puede haber expirado.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col flex-1">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            <div className="mb-5 sm:mb-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-success-100 dark:bg-success-900/20">
                <svg
                  className="w-8 h-8 text-success-600 dark:text-success-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="mb-2 font-semibold text-center text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Contraseña Restablecida
              </h1>
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                Tu contraseña ha sido restablecida exitosamente. Serás redirigido al inicio de sesión en unos segundos.
              </p>
            </div>
            <Link
              to="/auth/sign-in"
              className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Crear Nueva Contraseña
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ingresa tu nueva contraseña para la cuenta <strong>{email}</strong>
            </p>
          </div>

          {errors.general && (
            <div className="p-4 mb-6 border rounded-lg bg-error-50 border-error-200 dark:bg-error-900/20 dark:border-error-800">
              <p className="text-sm text-error-700 dark:text-error-400">{errors.general}</p>
            </div>
          )}

          <div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-6">
                <div>
                  <Label>
                    Nueva Contraseña <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="Ingrese su nueva contraseña"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    error={touched.password && !!errors.password}
                    hint={touched.password ? errors.password : undefined}
                    disabled={!token || !email}
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números
                  </p>
                </div>

                <div>
                  <Label>
                    Confirmar Contraseña <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="password"
                    name="password_confirmation"
                    placeholder="Confirme su nueva contraseña"
                    value={formData.password_confirmation}
                    onChange={(e) =>
                      handleInputChange("password_confirmation", e.target.value)
                    }
                    onBlur={() => handleBlur("password_confirmation")}
                    error={touched.password_confirmation && !!errors.password_confirmation}
                    hint={touched.password_confirmation ? errors.password_confirmation : undefined}
                    disabled={!token || !email}
                  />
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="sm"
                    disabled={isSubmitting || !token || !email}
                  >
                    {isSubmitting ? "Restableciendo..." : "Restablecer Contraseña"}
                  </Button>
                </div>

                <div className="text-center">
                  <Link
                    to="/auth/sign-in"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Volver al inicio de sesión
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
