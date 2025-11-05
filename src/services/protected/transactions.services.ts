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

export {
    getTransactions
};
