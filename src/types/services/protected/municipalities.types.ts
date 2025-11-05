import { ApiResponse } from "../api.types";

export interface MunicipalityData {
    id: number;
    state_id: number;
    name: string;
    code: string | null;
    status: boolean;
    created_at: string;
    updated_at: string;
}

export interface MunicipalitiesErrorData {
    message?: string;
    name?: string;
    state_id?: string;
}

export type MunicipalitiesResponse =
    | ApiResponse<MunicipalityData[]>
    | ApiResponse<MunicipalitiesErrorData>;

export type SingleMunicipalityResponse =
    | ApiResponse<MunicipalityData>
    | ApiResponse<MunicipalitiesErrorData>;
