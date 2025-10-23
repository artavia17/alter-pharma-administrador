import { StatesResponse, SingleStateResponse } from "../../types/services/protected/states.types";
import api from "../api";

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

export {
    getStates,
    getState,
    createState,
    updateState,
    toggleStateStatus,
    deleteState
};
