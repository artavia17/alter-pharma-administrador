import { ApiResponse } from "../api.types";

// Iniciar sesión

export interface LoginSuccessData {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    profile_image: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
  };
}

export interface LoginErrorData {
  email?: string;
  password?: string;
}


// Exportar los tipados
export type LoginResponse =
    | ApiResponse<LoginSuccessData>
    | ApiResponse<LoginErrorData>;