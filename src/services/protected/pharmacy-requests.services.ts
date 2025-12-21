import { PharmacyRequestsResponse, SinglePharmacyRequestResponse, PharmacyRequestStatus } from "../../types/services/protected/pharmacy-requests.types";
import api from "../api";

const getPharmacyRequests = async () => {
    const response = await api.get<PharmacyRequestsResponse>("/administrator/pharmacy-registration-requests");
    return response.data;
};

const getPharmacyRequest = async (id: number) => {
    const response = await api.get<SinglePharmacyRequestResponse>(`/administrator/pharmacy-registration-requests/${id}`);
    return response.data;
};

interface UpdatePharmacyRequestStatusParams {
    status: PharmacyRequestStatus;
}

interface UpdatePharmacyRequestParams {
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
}

const updatePharmacyRequestStatus = async (id: number, params: UpdatePharmacyRequestStatusParams) => {
    const response = await api.post<SinglePharmacyRequestResponse>(`/administrator/pharmacy-registration-requests/${id}/status`, params);
    return response.data;
};

const updatePharmacyRequest = async (id: number, params: UpdatePharmacyRequestParams) => {
    const response = await api.post<SinglePharmacyRequestResponse>(`/administrator/pharmacy-registration-requests/${id}`, params);
    return response.data;
};

export {
    getPharmacyRequests,
    getPharmacyRequest,
    updatePharmacyRequestStatus,
    updatePharmacyRequest
};

export type { UpdatePharmacyRequestStatusParams, UpdatePharmacyRequestParams };
