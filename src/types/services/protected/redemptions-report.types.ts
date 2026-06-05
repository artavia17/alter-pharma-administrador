export interface RedemptionDetailData {
    id: number;
    redemption_date: string;
    created_at: string;
    sub_pharmacy_id: number | null;
    sub_pharmacy_name: string | null;
    patient_id: number;
    patient_name: string;
    patient_identification: string;
    product_id: number;
    product_name: string;
    product_dose_id: number;
    product_dose: string;
    quantity_redeemed: number;
    quantity_received: number;
    notes: string | null;
}

export interface RedemptionsDetailPagination {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    data: RedemptionDetailData[];
}

export interface RedemptionsDetailResponse {
    status: number;
    message: string;
    data: RedemptionsDetailPagination;
}
