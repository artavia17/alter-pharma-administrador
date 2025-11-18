import { MunicipalitiesResponse, SingleMunicipalityResponse } from "../../types/services/protected/municipalities.types";
import api from "../api";

export interface BulkMunicipalityData {
    state_id: number;
    name: string;
    code: string;
    status?: boolean;
}

export interface BulkMunicipalityResponse {
    status: number;
    message: string;
    data: {
        success: Array<{
            index: number;
            municipality: {
                id: number;
                state_id: number;
                name: string;
                code: string;
                status?: boolean;
                created_at: string;
                updated_at: string;
            };
            name: string;
        }>;
        errors: Array<{
            index: number;
            name?: string;
            error?: string;
            errors?: any;
        }>;
        summary: {
            total: number;
            created: number;
            failed: number;
        };
    };
}

const getMunicipalities = async (stateId: number) => {
    const response = await api.get<MunicipalitiesResponse>(`/administrator/states/${stateId}/municipalities`);
    return response.data;
};

const getMunicipality = async (stateId: number, municipalityId: number) => {
    const response = await api.get<SingleMunicipalityResponse>(`/administrator/states/${stateId}/municipalities/${municipalityId}`);
    return response.data;
};

const createMunicipality = async (stateId: number, name: string) => {
    const response = await api.post<SingleMunicipalityResponse>(`/administrator/states/${stateId}/municipalities`, {
        name,
        state_id: stateId
    });
    return response.data;
};

const updateMunicipality = async (stateId: number, municipalityId: number, name: string) => {
    const response = await api.post<SingleMunicipalityResponse>(`/administrator/states/${stateId}/municipalities/${municipalityId}`, {
        name
    });
    return response.data;
};

const toggleMunicipalityStatus = async (stateId: number, municipalityId: number) => {
    const response = await api.patch<SingleMunicipalityResponse>(`/administrator/states/${stateId}/municipalities/${municipalityId}/toggle-status`);
    return response.data;
};

const deleteMunicipality = async (stateId: number, municipalityId: number) => {
    const response = await api.delete<SingleMunicipalityResponse>(`/administrator/states/${stateId}/municipalities/${municipalityId}`);
    return response.data;
};

const bulkCreateMunicipalities = async (stateId: number, data: { municipalities: BulkMunicipalityData[] }) => {
    const response = await api.post<BulkMunicipalityResponse>(`/administrator/states/${stateId}/municipalities/bulk`, data);
    return response.data;
};

export {
    getMunicipalities,
    getMunicipality,
    createMunicipality,
    updateMunicipality,
    toggleMunicipalityStatus,
    deleteMunicipality,
    bulkCreateMunicipalities
};
