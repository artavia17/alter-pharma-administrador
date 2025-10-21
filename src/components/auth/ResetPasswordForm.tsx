import { useState } from "react";
import { Link } from "react-router";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { resetPassword } from "../../services/auth/auth.services";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return "El correo electrónico es requerido";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Ingrese un correo electrónico válido";
    }
    return undefined;
  };

  const handleInputChange = (value: string) => {
    setEmail(value);

    if (touched) {
      setError(validateEmail(value));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched(true);
    const validationError = validateEmail(email);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const resp = await resetPassword({ email });

      if (resp.status === 202) {
        setIsSuccess(true);
      } else {
        setError(resp.message || "No se pudo procesar la solicitud. Intenta nuevamente.");
      }
      
    } catch (error: any) {
      if(error.response.data.message){
        setError(error.response.data.message);
      }else{
        setError("No se pudo procesar la solicitud. Intenta nuevamente.");
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
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Correo Enviado
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hemos enviado un enlace de restablecimiento de contraseña a <strong>{email}</strong>.
                Por favor revisa tu bandeja de entrada.
              </p>
            </div>
            <Link
              to="/auth/sign-in"
              className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600"
            >
              Volver al inicio de sesión
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
              Restablecer Contraseña
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-6">
                <div>
                  <Label>
                    Correo electrónico <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Ingrese su correo electrónico"
                    value={email}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onBlur={handleBlur}
                    error={touched && !!error}
                    hint={touched ? error : undefined}
                  />
                </div>
                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Enviando..." : "Enviar enlace de restablecimiento"}
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
