import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import type { SignInCredentials, FormErrors } from "../../types";
import { login } from "../../services/auth/auth.services";
import { LoginSuccessData } from "../../types/services/auth/auth.types";
import { setCookieHelper } from "../../helper/cookieHelper";

export default function SignInForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState<SignInCredentials>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors<SignInCredentials>>({});
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return "La contraseña es requerida";
    }
    if (password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres";
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors<SignInCredentials> = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
    };

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleInputChange = (field: keyof SignInCredentials, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validar en tiempo real solo si el campo ya fue tocado
    if (touched[field]) {
      const error =
        field === "email" ? validateEmail(value) : validatePassword(value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: keyof SignInCredentials) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Validar al perder el foco
    const error =
      field === "email"
        ? validateEmail(formData[field])
        : validatePassword(formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos los campos como tocados
    setTouched({ email: true, password: true });

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      
      const resp = await login(formData);

      if(resp.status == 202){
        const data: LoginSuccessData = resp.data as LoginSuccessData;
        const token = data.token;
        const user = data.user;

        setCookieHelper('user_token', token);
        setCookieHelper('user_name', user.name);
        setCookieHelper('user_email', user.email);
        setCookieHelper('user_profile_image', user.profile_image || '');
        setCookieHelper('user_updated_at', user.updated_at);
        setCookieHelper('user_created_at', user.created_at);
        setCookieHelper('user_email_verified_at', user.email_verified_at || '');

        // Redirect to the page the user was trying to access, or home page by default
        const redirectPath = searchParams.get('redirect') || '/';
        navigate(redirectPath);
      }else{
        setErrors({
          email: resp.message || "Credenciales incorrectas. Verifica tu correo y contraseña.",
        });
      }

    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setErrors({
        email: "Credenciales incorrectas. Verifica tu correo y contraseña.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Iniciar sesión
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ingresa tu correo electrónico y contraseña para iniciar sesión.
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-6">
                <div>
                  <Label>
                    Correo electrónico <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Ingrese su correo electrónico"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    error={touched.email && !!errors.email}
                    hint={touched.email ? errors.email : undefined}
                  />
                </div>
                <div>
                  <Label>
                    Contraseña <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="Ingrese su contraseña"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    onBlur={() => handleBlur("password")}
                    error={touched.password && !!errors.password}
                    hint={touched.password ? errors.password : undefined}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Mantener la sesión iniciada
                    </span>
                  </div>
                  <Link
                    to="/auth/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
