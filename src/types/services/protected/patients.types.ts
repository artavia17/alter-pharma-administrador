import { ApiResponse } from "../api.types";

export interface CountryBasic {
    id: number;
    name: string;
    code: string;
    phone_code: string;
    identification_min_length: number;
    identification_max_length: number;
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
    specialties: SpecialtyBasic[];
}

export interface ProductBasic {
    id: number;
    name: string;
    description: string | null;
    country_ids: number[];
    status: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProductDoseBasic {
    id: number;
    product_id: number;
    dose: string;
    promotion_buy: number;
    promotion_get: number;
    max_redemptions_per_month: number;
    max_redemptions_per_year: number;
    status: boolean;
    created_at: string;
    updated_at: string;
    pivot?: {
        patient_id: number;
        product_dose_id: number;
        created_at: string;
        updated_at: string;
    };
    product: ProductBasic;
}

export interface PharmacyBasic {
    id: number;
    country_id: number;
    state_id: number;
    municipality_id: number;
    legal_name: string;
    commercial_name: string;
    identification_number: string;
    street_address: string;
    phone: string;
    email: string;
    administrator_name: string;
    is_chain: boolean;
    status: boolean;
    last_login: string | null;
    created_at: string;
    updated_at: string;
}

export interface PatientData {
    id: number;
    country_id: number;
    state_id: number;
    municipality_id: number;
    first_name: string;
    last_name: string;
    second_last_name: string | null;
    identification_type: string;
    identification_number: string;
    date_of_birth: string;
    street_address: string;
    phone: string;
    email: string;
    gender: string;
    type: string;
    is_registered: boolean;
    terms_accepted: boolean;
    privacy_notice_accepted: boolean;
    last_login: string | null;
    status: string;
    created_by_type: string;
    created_by_id: number;
    created_at: string;
    updated_at: string;
    country: CountryBasic;
    state: StateBasic;
    municipality: MunicipalityBasic;
    doctors: DoctorBasic[];
    product_doses: ProductDoseBasic[];
    created_by: PharmacyBasic;
}

export interface PatientsResponse {
    status: number;
    message: string;
    data: PatientData[];
}

export type SinglePatientResponse = ApiResponse<PatientData>;
