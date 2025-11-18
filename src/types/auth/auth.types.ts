/**
 * Tipos y interfaces para autenticación
 */

/**
 * Credenciales de inicio de sesión
 */
export interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * Credenciales de registro
 */
export interface SignUpCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Datos del usuario autenticado
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  avatar?: string;
}

/**
 * Respuesta del servidor al iniciar sesión
 */
export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * Opciones de inicio de sesión
 */
export interface SignInOptions {
  rememberMe?: boolean;
}

/**
 * Ciudad de autenticación
 */
export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Petición de restablecimiento de contraseña
 */
export interface ResetPasswordRequest {
  email: string;
}

/**
 * Confirmación de nueva contraseña
 */
export interface ResetPasswordConfirm {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/**
 * Datos del formulario de creación de nueva contraseña
 */
export interface ResetPasswordCreateFormData {
  password: string;
  password_confirmation: string;
}

/**
 * Errores del formulario de creación de nueva contraseña
 */
export interface ResetPasswordCreateFormErrors {
  password?: string;
  password_confirmation?: string;
  general?: string;
}
