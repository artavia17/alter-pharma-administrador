import { UsersResponse, SingleUserResponse } from "../../types/services/protected/users.types";
import api from "../api";

const getUsers = async () => {
    const response = await api.get<UsersResponse>("/administrator/users");
    return response.data;
};

const getUser = async (id: number) => {
    const response = await api.get<SingleUserResponse>(`/administrator/users/${id}`);
    return response.data;
};

const createUser = async (name: string, email: string, modules: number[]) => {
    const response = await api.post<SingleUserResponse>("/administrator/users", {
        name,
        email,
        modules
    });
    return response.data;
};

const updateUser = async (id: number, name: string, email?: string, modules?: number[]) => {
    const body: any = { name };
    if (email) body.email = email;
    if (modules) body.modules = modules;

    const response = await api.post<SingleUserResponse>(`/administrator/users/${id}`, body);
    return response.data;
};

const toggleUserStatus = async (id: number) => {
    const response = await api.patch<SingleUserResponse>(`/administrator/users/${id}/toggle-status`);
    return response.data;
};

const addPermissions = async (id: number, modules: number[]) => {
    const response = await api.post<SingleUserResponse>(`/administrator/users/${id}/permissions/add`, {
        modules
    });
    return response.data;
};

const removePermissions = async (id: number, modules: number[]) => {
    const response = await api.post<SingleUserResponse>(`/administrator/users/${id}/permissions/remove`, {
        modules
    });
    return response.data;
};

export {
    getUsers,
    getUser,
    createUser,
    updateUser,
    toggleUserStatus,
    addPermissions,
    removePermissions
};
