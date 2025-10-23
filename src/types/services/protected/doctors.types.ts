import { ApiResponse } from "../api.types";

export interface SpecialtyBasic {
    id: number;
    name: string;
    description: string | null;
    status: boolean;
    created_at: string;
    updated_at: string;
    pivot?: {
        doctor_id: number;
        specialty_id: number;
    };
}

export interface CountryBasic {
    id: number;
    name: string;
    code: string;
    status: boolean;
    created_at: string;
    updated_at: string;
}

export interface DoctorData {
    id: number;
    country_id: number;
    name: string;
    email: string | null;
    phone: string | null;
    license_number: string | null;
    bio: string | null;
    profile_image: string | null;
    status: boolean;
    created_at: string;
    updated_at: string;
    specialties: SpecialtyBasic[];
    country: CountryBasic;
}

export interface DoctorsErrorData {
    message?: string;
    name?: string;
    country_id?: string;
    specialties?: string;
    email?: string;
    phone?: string;
    license_number?: string;
    bio?: string;
}

export type DoctorsResponse =
    | ApiResponse<DoctorData[]>
    | ApiResponse<DoctorsErrorData>;

export type SingleDoctorResponse =
    | ApiResponse<DoctorData>
    | ApiResponse<DoctorsErrorData>;
