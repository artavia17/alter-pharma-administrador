// ==================== Redemption Reports Types ====================

// Pharmacy Redemption Report Types
export interface PharmacyRedemptionData {
  id: number;
  commercial_name: string;
  identification_number: string;
  total_redemptions: number;
  total_quantity_redeemed: string;
  total_quantity_received: string;
  unique_patients: number;
  unique_products: number;
}

export interface PharmacyRedemptionResponse {
  status: number;
  message: string;
  data: PharmacyRedemptionData[];
}

export interface PharmacyRedemptionParams {
  start_date?: string;
  end_date?: string;
}

// Redemption Detail Types
export interface RedemptionDetailData {
  id: number;
  redemption_date: string;
  pharmacy_name: string;
  sub_pharmacy_name: string | null;
  patient_name: string;
  patient_identification: string;
  product_name: string;
  product_dose: string;
  quantity_redeemed: number;
  quantity_received: number;
  notes: string | null;
  created_at: string;
}

export interface RedemptionDetailPagination {
  current_page: number;
  data: RedemptionDetailData[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface RedemptionDetailResponse {
  status: number;
  message: string;
  data: RedemptionDetailPagination;
}

export interface RedemptionDetailParams {
  pharmacy_id?: number;
  start_date?: string;
  end_date?: string;
  per_page?: number;
  page?: number;
}

// Product Redemption Report Types
export interface ProductRedemptionData {
  id: number;
  name: string;
  dose: string;
  total_redemptions: number;
  total_quantity_redeemed: string;
  total_quantity_received: string;
  pharmacies_count: number;
  patients_count: number;
}

export interface ProductRedemptionResponse {
  status: number;
  message: string;
  data: ProductRedemptionData[];
}

export interface ProductRedemptionParams {
  pharmacy_id?: number;
  start_date?: string;
  end_date?: string;
}

// Patient-Product Redemption Report Types
export interface PatientProductRedemptionData {
  patient_id: number;
  patient_name: string;
  patient_identification: string;
  patient_email: string;
  product_id: number;
  product_name: string;
  product_dose: string;
  total_redemptions: number;
  total_quantity_redeemed: number;
  total_quantity_received: number;
  last_redemption_date: string;
  pharmacies_count: number;
}

export interface PatientProductRedemptionPagination {
  current_page: number;
  data: PatientProductRedemptionData[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface PatientProductRedemptionResponse {
  status: number;
  message: string;
  data: PatientProductRedemptionPagination;
}

export interface PatientProductRedemptionParams {
  patient_id?: number;
  product_id?: number;
  pharmacy_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  per_page?: number;
  page?: number;
}
