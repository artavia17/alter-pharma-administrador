import { ApiResponse } from "../api.types";

export interface CountryBasic {
    id: number;
    name: string;
    code: string;
    phone_code: string;
    phone_min_length: number;
    phone_max_length: number;
    status: boolean;
    created_at: string;
    updated_at: string;
}

export interface StateBasic {
    id: number;
    country_id: number;
    name: string;
    code: string | null;
    status: boolean;
    created_at: string;
    updated_at: string;
}

export interface MunicipalityBasic {
    id: number;
    state_id: number;
    name: string;
    code: string | null;
    status: boolean;
    created_at: string;
    updated_at: string;
}

export interface DistributorBasic {
    id: number;
    country_id: number;
    state_id: number;
    municipality_id: number;
    business_name: string;
    identification_number: string;
    street_address: string;
    phone: string;
    email: string;
    contact_person_name: string;
    status: boolean;
    last_login: string | null;
    created_at: string;
    updated_at: string;
}

export interface PharmacyData {
    id: number;
    country_id: number;
    state_id: number;
    municipality_id: number;
    legal_name: string;
    commercial_name: string;
    identification_number: string;
    physical_address: string;
    street_address: string;
    phone: string;
    email: string;
    administrator_name: string;
    is_chain: boolean;
    status: boolean;
    created_at: string;
    updated_at: string;
    country: CountryBasic;
    state?: StateBasic;
    municipality?: MunicipalityBasic;
    default_distributor?: DistributorBasic | null;
}

export interface PharmaciesErrorData {
    message?: string;
    country_id?: string;
    legal_name?: string;
    commercial_name?: string;
    identification_number?: string;
    physical_address?: string;
    phone?: string;
    email?: string;
    administrator_name?: string;
}

export type PharmaciesResponse =
    | ApiResponse<PharmacyData[]>
    | ApiResponse<PharmaciesErrorData>;

export type SinglePharmacyResponse =
    | ApiResponse<PharmacyData>
    | ApiResponse<PharmaciesErrorData>;
