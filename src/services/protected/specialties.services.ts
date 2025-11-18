import { SpecialtiesResponse, SingleSpecialtyResponse, SpecialtyCreateUpdateResponse } from "../../types/services/protected/specialties.types";
import api from "../api";

const getSpecialties = async () => {
    const response = await api.get<SpecialtiesResponse>("/administrator/specialties");
    return response.data;
};

const getSpecialty = async (id: number) => {
    const response = await api.get<SingleSpecialtyResponse>(`/administrator/specialties/${id}`);
    return response.data;
};

const createSpecialty = async (name: string) => {
    const response = await api.post<SpecialtyCreateUpdateResponse>("/administrator/specialties", {
        name
    });
    return response.data;
};

const updateSpecialty = async (id: number, name: string) => {
    const response = await api.post<SpecialtyCreateUpdateResponse>(`/administrator/specialties/${id}`, {
        name
    });
    return response.data;
};

const toggleSpecialtyStatus = async (id: number) => {
    const response = await api.patch<SpecialtyCreateUpdateResponse>(`/administrator/specialties/${id}/toggle-status`);
    return response.data;
};

const deleteSpecialty = async (id: number) => {
    const response = await api.delete<SpecialtyCreateUpdateResponse>(`/administrator/specialties/${id}`);
    return response.data;
};

export interface BulkSpecialtyData {
    name: string;
    description?: string;
}

export interface BulkSpecialtyResponse {
    status: number;
    message: string;
    data: {
        success: Array<{
            index: number;
            specialty: any;
            name: string;
        }>;
        errors: Array<{
            index: number;
            data?: any;
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

const bulkCreateSpecialties = async (data: { specialties: BulkSpecialtyData[] }): Promise<BulkSpecialtyResponse> => {
    const response = await api.post<BulkSpecialtyResponse>("/administrator/specialties/bulk", data);
    return response.data;
};

export {
    getSpecialties,
    getSpecialty,
    createSpecialty,
    updateSpecialty,
    toggleSpecialtyStatus,
    deleteSpecialty,
    bulkCreateSpecialties
};
