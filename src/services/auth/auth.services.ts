import { LoginResponse, ResetPasswordResponse } from '../../types/services/auth/auth.types';
import api from '../api';


const login = async (data: Record<string, any>) => {
    const response = await api.post<LoginResponse>("/administrator/auth/login", data);
    return response.data;
};

const resetPassword = async (data: Record<string, any>) => {
    const response = await api.post<ResetPasswordResponse>("/administrator/auth/reset-password/send", data);
    return response.data;
};

const resetPasswordCreate = async (data: Record<string, any>, email: string, token: string) => {
    const response = await api.post<ResetPasswordResponse>(`/administrator/auth/reset-password/reset/${email}/${token}`, data);
    return response.data;
};

export {
    login,
    resetPassword,
    resetPasswordCreate
}