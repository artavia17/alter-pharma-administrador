import { ApiResponse } from "../api.types";

export interface MyaccountSuccessData {
    id: number;
    name: string;
    email: string;
    profile_image: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface MyaccountSuccessDataErrorData {
  message?: string;
}


export type MyAccountResponse =
    | ApiResponse<MyaccountSuccessData>
    | ApiResponse<MyaccountSuccessDataErrorData>;