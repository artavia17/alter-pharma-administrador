import { PharmaciesResponse, SinglePharmacyResponse } from "../../types/services/protected/pharmacies.types";
import api from "../api";

const getPharmacies = async () => {
    const response = await api.get<PharmaciesResponse>("/administrator/pharmacies");
    return response.data;
};

const getPharmacy = async (id: number) => {
    const response = await api.get<SinglePharmacyResponse>(`/administrator/pharmacies/${id}`);
    return response.data;
};

interface CreatePharmacyParams {
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
}

const createPharmacy = async (params: CreatePharmacyParams) => {
    const response = await api.post<SinglePharmacyResponse>("/administrator/pharmacies", params);
    return response.data;
};

const updatePharmacy = async (id: number, params: CreatePharmacyParams) => {
    const response = await api.post<SinglePharmacyResponse>(`/administrator/pharmacies/${id}`, params);
    return response.data;
};

const togglePharmacyStatus = async (id: number) => {
    const response = await api.patch<SinglePharmacyResponse>(`/administrator/pharmacies/${id}/toggle-status`);
    return response.data;
};

interface BulkPharmacyData {
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
    distributor_id: number;
}

interface BulkCreatePharmaciesParams {
    pharmacies: BulkPharmacyData[];
}

interface BulkCreatePharmaciesResponse {
    status: number;
    message: string;
    data: {
        success: any[];
        errors: any[];
        summary: {
            total: number;
            created: number;
            failed: number;
        };
    };
}

const bulkCreatePharmacies = async (params: BulkCreatePharmaciesParams) => {
    const response = await api.post<BulkCreatePharmaciesResponse>("/administrator/pharmacies/bulk", params);
    return response.data;
};

export {
    getPharmacies,
    getPharmacy,
    createPharmacy,
    updatePharmacy,
    togglePharmacyStatus,
    bulkCreatePharmacies
};

export type { BulkPharmacyData, BulkCreatePharmaciesParams, BulkCreatePharmaciesResponse };
