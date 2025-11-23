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
    distributor_id?: number;
}

const updatePharmacyRequestStatus = async (id: number, params: UpdatePharmacyRequestStatusParams) => {
    const response = await api.post<SinglePharmacyRequestResponse>(`/administrator/pharmacy-registration-requests/${id}/status`, params);
    return response.data;
};

export {
    getPharmacyRequests,
    getPharmacyRequest,
    updatePharmacyRequestStatus
};

export type { UpdatePharmacyRequestStatusParams };
