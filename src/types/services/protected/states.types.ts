import { ApiResponse } from "../api.types";

export interface CountryBasic {
    id: number;
    name: string;
    code: string;
    status: boolean;
    created_at: string;
    updated_at: string;
}

export interface StateData {
    id: number;
    country_id: number;
    name: string;
    code: string | null;
    status: boolean;
    created_at: string;
    updated_at: string;
    country: CountryBasic;
}

export interface StatesErrorData {
    message?: string;
    name?: string;
    country_id?: string;
}

export type StatesResponse =
    | ApiResponse<StateData[]>
    | ApiResponse<StatesErrorData>;

export type SingleStateResponse =
    | ApiResponse<StateData>
    | ApiResponse<StatesErrorData>;
