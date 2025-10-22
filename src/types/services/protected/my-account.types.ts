import { ApiResponse } from "../api.types";

export interface Module {
    id: number;
    name: string;
    description: string;
    created_at?: string;
    updated_at?: string;
}

export interface Permission {
    id: number;
    module_id?: number;
    name: string;
    description: string;
    created_at?: string;
    updated_at?: string;
    pivot?: {
        user_id: number;
        permission_id: number;
    };
    module?: Module;
}

export interface AllPermission {
    id: number;
    name: string;
    description: string;
    module: Module;
}

export interface MyaccountSuccessData {
    id: number;
    name: string;
    email: string;
    profile_image: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    all_permissions?: AllPermission[];
    permissions?: Permission[];
}

export interface MyaccountErrorData {
    message?: string;
    password?: string;
    name?: string;
    profile_photo?: string;
}

export type MyAccountResponse =
    | ApiResponse<MyaccountSuccessData>
    | ApiResponse<MyaccountErrorData>;

export interface VerifyEmailSuccessData {
    message: string;
}

export interface VerifyEmailErrorData {
    message: string;
}

export type VerifyEmailResponse =
    | ApiResponse<VerifyEmailSuccessData>
    | ApiResponse<VerifyEmailErrorData>;