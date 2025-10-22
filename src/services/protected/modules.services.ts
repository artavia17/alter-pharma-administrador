import { ModulesResponse, SingleModuleResponse } from "../../types/services/protected/modules.types";
import api from "../api";

const getModules = async () => {
    const response = await api.get<ModulesResponse>("/administrator/modules/");
    return response.data;
};

const createModule = async (name: string) => {
    const response = await api.post<SingleModuleResponse>("/administrator/modules/", {
        name
    });
    return response.data;
};

const updateModule = async (id: number, name: string) => {
    const response = await api.post<SingleModuleResponse>(`/administrator/modules/${id}`, {
        name
    });
    return response.data;
};

const deleteModule = async (id: number) => {
    const response = await api.delete<SingleModuleResponse>(`/administrator/modules/${id}`);
    return response.data;
};

export {
    getModules,
    createModule,
    updateModule,
    deleteModule
};
