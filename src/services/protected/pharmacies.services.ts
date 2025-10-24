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
    legal_name: string;
    commercial_name: string;
    identification_number: string;
    physical_address: string;
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

export {
    getPharmacies,
    getPharmacy,
    createPharmacy,
    updatePharmacy,
    togglePharmacyStatus
};
