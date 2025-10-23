import { ApiResponse } from "../api.types";

export interface DoctorBasic {
    id: number;
    country_id: number;
    name: string;
    email: string;
    phone: string;
    license_number: string;
    bio: string | null;
    profile_image: string | null;
    status: boolean;
    created_at: string;
    updated_at: string;
}

export interface SpecialtyData {
    id: number;
    name: string;
    description: string | null;
    status: boolean;
    created_at: string;
    updated_at: string;
    doctors_count: number;
}

export interface SpecialtyDetailData extends SpecialtyData {
    doctors: DoctorBasic[];
}

export interface SpecialtiesErrorData {
    message?: string;
    name?: string;
}

export type SpecialtiesResponse =
    | ApiResponse<SpecialtyData[]>
    | ApiResponse<SpecialtiesErrorData>;

export type SingleSpecialtyResponse =
    | ApiResponse<SpecialtyDetailData>
    | ApiResponse<SpecialtiesErrorData>;

export type SpecialtyCreateUpdateResponse =
    | ApiResponse<SpecialtyData>
    | ApiResponse<SpecialtiesErrorData>;
