import { DoctorsResponse, SingleDoctorResponse } from "../../types/services/protected/doctors.types";
import api from "../api";

const getDoctors = async () => {
    const response = await api.get<DoctorsResponse>("/administrator/doctors");
    return response.data;
};

const getDoctor = async (id: number) => {
    const response = await api.get<SingleDoctorResponse>(`/administrator/doctors/${id}`);
    return response.data;
};

interface CreateDoctorParams {
    name: string;
    country_id: number;
    specialties: number[];
    email?: string;
    phone?: string;
    license_number?: string;
    bio?: string;
}

const createDoctor = async (params: CreateDoctorParams) => {
    const response = await api.post<SingleDoctorResponse>("/administrator/doctors", params);
    return response.data;
};

const updateDoctor = async (id: number, params: CreateDoctorParams) => {
    const response = await api.post<SingleDoctorResponse>(`/administrator/doctors/${id}`, params);
    return response.data;
};

const toggleDoctorStatus = async (id: number) => {
    const response = await api.patch<SingleDoctorResponse>(`/administrator/doctors/${id}/toggle-status`);
    return response.data;
};

const deleteDoctor = async (id: number) => {
    const response = await api.delete<SingleDoctorResponse>(`/administrator/doctors/${id}`);
    return response.data;
};

export interface BulkDoctorData {
    country_id: number;
    name: string;
    email?: string;
    phone?: string;
    license_number?: string;
    bio?: string;
    specialties: number[];
}

export interface BulkDoctorResponse {
    status: number;
    message: string;
    data: {
        success: Array<{
            index: number;
            doctor: any;
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

const bulkCreateDoctors = async (data: { doctors: BulkDoctorData[] }): Promise<BulkDoctorResponse> => {
    const response = await api.post<BulkDoctorResponse>("/administrator/doctors/bulk", data);
    return response.data;
};

export {
    getDoctors,
    getDoctor,
    createDoctor,
    updateDoctor,
    toggleDoctorStatus,
    deleteDoctor,
    bulkCreateDoctors
};
