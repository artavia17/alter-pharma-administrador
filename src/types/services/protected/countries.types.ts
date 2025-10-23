import { ApiResponse } from "../api.types";

export interface StateData {
    id: number;
    country_id: number;
    name: string;
    code: string | null;
    status: boolean;
    created_at: string;
    updated_at: string;
}

export interface CountryData {
    id: number;
    name: string;
    code: string;
    status: boolean;
    created_at: string;
    updated_at: string;
    states: StateData[];
}

export interface CountriesErrorData {
    message?: string;
    name?: string;
    code?: string;
}

export type CountriesResponse =
    | ApiResponse<CountryData[]>
    | ApiResponse<CountriesErrorData>;

export type SingleCountryResponse =
    | ApiResponse<CountryData>
    | ApiResponse<CountriesErrorData>;
