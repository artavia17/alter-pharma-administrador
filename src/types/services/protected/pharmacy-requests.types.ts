import { ApiResponse } from "../api.types";
import { CountryBasic, StateBasic, MunicipalityBasic, DistributorBasic } from "./pharmacies.types";

export type PharmacyRequestStatus = "pending" | "approved" | "rejected";

export interface PharmacyRequestData {
    id: number;
    country_id: number;
    state_id: number;
    municipality_id: number;
    distributor_id: number | null;
    legal_name: string;
    commercial_name: string;
    identification_number: string;
    street_address: string;
    phone: string;
    email: string;
    administrator_name: string;
    is_chain: boolean;
    status: PharmacyRequestStatus;
    created_at: string;
    updated_at: string;
    country: CountryBasic;
    state: StateBasic;
    municipality: MunicipalityBasic;
    distributor: DistributorBasic | null;
}

export interface PharmacyRequestErrorData {
    message?: string;
    status?: string;
    distributor_id?: string;
}

export type PharmacyRequestsResponse =
    | ApiResponse<PharmacyRequestData[]>
    | ApiResponse<PharmacyRequestErrorData>;

export type SinglePharmacyRequestResponse =
    | ApiResponse<PharmacyRequestData>
    | ApiResponse<PharmacyRequestErrorData>;
