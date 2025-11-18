import { StatesResponse, SingleStateResponse } from "../../types/services/protected/states.types";
import api from "../api";

export interface BulkStateData {
    country_id: number;
    name: string;
    code: string;
}

export interface BulkStateResponse {
    status: number;
    message: string;
    data: {
        success: Array<{
            index: number;
            state: {
                id: number;
                country_id: number;
                name: string;
                code: string;
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

const getStates = async () => {
    const response = await api.get<StatesResponse>("/administrator/states");
    return response.data;
};

const getState = async (id: number) => {
    const response = await api.get<SingleStateResponse>(`/administrator/states/${id}`);
    return response.data;
};

const createState = async (name: string, country_id: number) => {
    const response = await api.post<SingleStateResponse>("/administrator/states", {
        name,
        country_id
    });
    return response.data;
};

const updateState = async (id: number, name: string, country_id: number) => {
    const response = await api.post<SingleStateResponse>(`/administrator/states/${id}`, {
        name,
        country_id
    });
    return response.data;
};

const toggleStateStatus = async (id: number) => {
    const response = await api.patch<SingleStateResponse>(`/administrator/states/${id}/toggle-status`);
    return response.data;
};

const deleteState = async (id: number) => {
    const response = await api.delete<SingleStateResponse>(`/administrator/states/${id}`);
    return response.data;
};

const bulkCreateStates = async (data: { states: BulkStateData[] }) => {
    const response = await api.post<BulkStateResponse>("/administrator/states/bulk", data);
    return response.data;
};

export {
    getStates,
    getState,
    createState,
    updateState,
    toggleStateStatus,
    deleteState,
    bulkCreateStates
};
