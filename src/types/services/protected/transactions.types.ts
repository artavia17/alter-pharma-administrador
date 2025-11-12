import { ApiResponse } from "../api.types";

export interface TransactionProductData {
    id: number;
    transaction_id: string;
    product_id: string;
    product_dose_id: string;
    quantity: string;
    unit_price: string;
    subtotal: string;
    created_at: string;
    updated_at: string;
    product?: {
        id: number;
        name: string;
        description: string;
        country_ids: number[];
        status: boolean;
        created_at: string;
        updated_at: string;
    };
    product_dose?: {
        id: number;
        product_id: string;
        dose: string;
        barcode: string | null;
        promotion_buy: string;
        promotion_get: string;
        redemption_days: string;
        max_redemptions_per_month: string;
        max_redemptions_per_year: string;
        status: boolean;
        created_at: string;
        updated_at: string;
    };
}

export interface TransactionData {
    id: number;
    patient_id: string;
    pharmacy_id: string;
    sub_pharmacy_id: string | null;
    created_by: string;
    pharmacy_name: string;
    transaction_date: string;
    invoice_number: string;
    total: string;
    entry_type: string;
    invoice_file_url: string | null;
    created_at: string;
    updated_at: string;
    patient?: {
        id: number;
        country_id: string;
        state_id: string;
        municipality_id: string;
        first_name: string;
        last_name: string;
        second_last_name: string;
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
        last_login: string;
        status: string;
        created_by_type: string;
        created_by_id: string;
        created_at: string;
        updated_at: string;
    };
    pharmacy?: {
        id: number;
        country_id: string;
        state_id: string;
        municipality_id: string;
        legal_name: string;
        commercial_name: string;
        identification_number: string;
        street_address: string;
        phone: string;
        email: string;
        administrator_name: string;
        is_chain: boolean;
        status: boolean;
        last_login: string;
        created_at: string;
        updated_at: string;
    };
    sub_pharmacy?: any | null;
    products?: TransactionProductData[];
}

export interface TransactionsPagination {
    current_page: number;
    data: TransactionData[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface TransactionsResponse {
    status: number;
    message: string;
    data: TransactionsPagination;
}

export type SingleTransactionResponse = ApiResponse<TransactionData>;
