import { ApiResponse } from "../api.types";

export interface TransactionData {
    id: number;
    patient_id: number;
    pharmacy_id: number;
    product_dose_id: number;
    entry_type: string;
    redemption_date: string;
    created_at: string;
    updated_at: string;
    patient?: {
        id: number;
        first_name: string;
        last_name: string;
        second_last_name: string | null;
        identification_number: string;
        email: string;
        phone: string;
    };
    pharmacy?: {
        id: number;
        commercial_name: string;
        legal_name: string;
    };
    product_dose?: {
        id: number;
        dose: string;
        promotion_buy: number;
        promotion_get: number;
        product: {
            id: number;
            name: string;
        };
    };
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
