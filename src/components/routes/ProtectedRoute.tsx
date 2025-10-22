import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { myAccount } from "../../services/protected/my-account.services";
import { getCookie, setCookieHelper } from "../../helper/cookieHelper";
import { MyaccountSuccessData } from "../../types/services/protected/my-account.types";

/**
 * Componente que protege rutas verificando si el usuario está autenticado
 * Valida el token con el servidor antes de permitir el acceso
 */
export default function ProtectedRoute() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getCookie("user_token");

      // Si no hay token, redirigir inmediatamente
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Validar el token con el servidor
        const response = await myAccount();

        if (response.status === 200) {
          const user: MyaccountSuccessData = response.data as MyaccountSuccessData;

          setCookieHelper('user_token', token);
          setCookieHelper('user_name', user.name);
          setCookieHelper('user_email', user.email);
          setCookieHelper('user_profile_image', user.profile_image || '');
          setCookieHelper('user_updated_at', user.updated_at);
          setCookieHelper('user_created_at', user.created_at);
          setCookieHelper('user_email_verified_at', user.email_verified_at || '');
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error validando token:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Mostrar un loader mientras se valida el token
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full border-t-brand-500 animate-spin"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ingresando...
          </p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login con el path actual como redirect
  if (!isAuthenticated) {
    const redirectPath = location.pathname + location.search;
    return <Navigate to={`auth/sign-in?redirect=${encodeURIComponent(redirectPath)}`} replace />;
  }

  // Si está autenticado, renderizar las rutas hijas
  return <Outlet />;
}
