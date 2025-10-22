import { ApiResponse } from "../api.types";

export interface UserModule {
    id: number;
    name: string;
    description: string;
}

export interface UserData {
    id: number;
    name: string;
    email: string;
    profile_image: string | null;
    email_verified_at: string | null;
    status: boolean;
    created_at: string;
    updated_at: string;
    user_modules: UserModule[];
}

export interface UsersErrorData {
    message?: string;
    name?: string;
    email?: string;
    modules?: string;
}

export type UsersResponse =
    | ApiResponse<UserData[]>
    | ApiResponse<UsersErrorData>;

export type SingleUserResponse =
    | ApiResponse<UserData>
    | ApiResponse<UsersErrorData>;
