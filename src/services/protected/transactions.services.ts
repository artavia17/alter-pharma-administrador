import { TransactionsResponse } from "../../types/services/protected/transactions.types";
import api from "../api";

interface GetTransactionsParams {
    per_page?: number;
    page?: number;
    patient_id?: number;
    identification_number?: string;
    email?: string;
    name?: string;
    pharmacy_id?: number;
    date_from?: string;
    date_to?: string;
    entry_type?: string;
}

const getTransactions = async (params?: GetTransactionsParams) => {
    const queryParams = new URLSearchParams();

    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.patient_id) queryParams.append('patient_id', params.patient_id.toString());
    if (params?.identification_number) queryParams.append('identification_number', params.identification_number);
    if (params?.email) queryParams.append('email', params.email);
    if (params?.name) queryParams.append('name', params.name);
    if (params?.pharmacy_id) queryParams.append('pharmacy_id', params.pharmacy_id.toString());
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.entry_type) queryParams.append('entry_type', params.entry_type);

    const queryString = queryParams.toString();
    const url = queryString ? `/administrator/transactions?${queryString}` : '/administrator/transactions';

    const response = await api.get<TransactionsResponse>(url);
    return response.data;
};

interface ReversedTransactionProduct {
    id: number;
    product_id: number;
    product_name: string;
    product_dose_id: number;
    dose: string;
    quantity: number;
    unit_price: string;
    subtotal: string;
}

interface ReversedTransactionRedemption {
    id: number;
    product_id: number;
    product_name: string;
    product_dose_id: number;
    dose: string;
    status: string;
    purchase_date: string;
    expiration_date: string;
}

export interface ReversedTransactionData {
    id: number;
    original_transaction_id: number;
    patient: {
        id: number;
        name: string;
        identification_number: string;
        email: string;
        phone?: string;
    };
    pharmacy: {
        id: number;
        commercial_name: string;
        legal_name?: string;
    };
    sub_pharmacy: any | null;
    transaction_date: string;
    invoice_number: string;
    total: string;
    products_count?: number;
    products: ReversedTransactionProduct[];
    redemptions_count: number;
    redemptions: ReversedTransactionRedemption[];
    transaction_data?: {
        id: number;
        patient_id: number;
        pharmacy_id: number;
        sub_pharmacy_id: number | null;
        transaction_date: string;
        invoice_number: string;
        total: string;
        entry_type: string;
        created_at: string;
        updated_at: string;
    };
    reversed_by: {
        id: number;
        name: string;
        email: string;
    };
    reason: string | null;
    reversed_at: string;
    created_at: string;
}

interface GetReversedTransactionsParams {
    patient_id?: number;
    pharmacy_id?: number;
    reversed_from?: string;
    reversed_to?: string;
    transaction_date_from?: string;
    transaction_date_to?: string;
    search?: string;
}

const getReversedTransactions = async (params?: GetReversedTransactionsParams) => {
    const queryParams = new URLSearchParams();
    if (params?.patient_id) queryParams.append('patient_id', params.patient_id.toString());
    if (params?.pharmacy_id) queryParams.append('pharmacy_id', params.pharmacy_id.toString());
    if (params?.reversed_from) queryParams.append('reversed_from', params.reversed_from);
    if (params?.reversed_to) queryParams.append('reversed_to', params.reversed_to);
    if (params?.transaction_date_from) queryParams.append('transaction_date_from', params.transaction_date_from);
    if (params?.transaction_date_to) queryParams.append('transaction_date_to', params.transaction_date_to);
    if (params?.search) queryParams.append('search', params.search);
    const queryString = queryParams.toString();
    const url = queryString ? `/administrator/transactions/reversed?${queryString}` : '/administrator/transactions/reversed';
    const response = await api.get<{ status: number; message: string; data: ReversedTransactionData[] }>(url);
    return response.data;
};

const getReversedTransactionDetail = async (id: number) => {
    const response = await api.get<{ status: number; message: string; data: ReversedTransactionData }>(`/administrator/transactions/reversed/${id}`);
    return response.data;
};

const reverseTransaction = async (id: number, reason?: string) => {
    const body: { reason?: string } = {};
    if (reason) body.reason = reason;
    const response = await api.post(`/administrator/transactions/${id}/reverse`, body);
    return response.data;
};

export {
    getTransactions,
    reverseTransaction,
    getReversedTransactions,
    getReversedTransactionDetail
};
