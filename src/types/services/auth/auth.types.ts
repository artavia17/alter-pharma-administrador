import { ApiResponse } from "../api.types";

// Iniciar sesión

export interface UserModule {
  id: number;
  name: string;
  description: string;
}

export interface LoginSuccessData {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    profile_image: string | null;
    email_verified_at: string | null;
    status: boolean;
    created_at: string;
    updated_at: string;
    user_modules: UserModule[];
  };
}

export interface LoginErrorData {
  email?: string;
  password?: string;
}

export interface ResetPasswordErrorData {
  email?: string;
}

// Exportar los tipados
export type LoginResponse =
    | ApiResponse<LoginSuccessData>
    | ApiResponse<LoginErrorData>;

export type ResetPasswordResponse =
    | ApiResponse<{ message: string }>
    | ApiResponse<ResetPasswordErrorData>;