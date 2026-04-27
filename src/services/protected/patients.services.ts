import { PatientsResponse } from "../../types/services/protected/patients.types";
import api from "../api";

interface SearchPatientsParams {
    identification_number?: string;
    name?: string;
    email?: string;
    phone?: string;
}

const getAllPatients = async () => {
    const response = await api.get<PatientsResponse>('/administrator/patients');
    return response.data;
};

const searchPatients = async (params: SearchPatientsParams) => {
    const queryParams = new URLSearchParams();

    if (params.identification_number) queryParams.append('identification_number', params.identification_number);
    if (params.name) queryParams.append('name', params.name);
    if (params.email) queryParams.append('email', params.email);
    if (params.phone) queryParams.append('phone', params.phone);

    const response = await api.get<PatientsResponse>(`/administrator/patients?${queryParams.toString()}`);
    return response.data;
};

interface TogglePatientStatusResponse {
    status: number;
    message: string;
    data: any;
}

const togglePatientStatus = async (patientId: number) => {
    const response = await api.patch<TogglePatientStatusResponse>(`/administrator/patients/${patientId}/toggle-status`);
    return response.data;
};

interface UpdatePatientParams {
    first_name?: string;
    last_name?: string;
    second_last_name?: string | null;
    identification_type?: string;
    identification_number?: string;
    date_of_birth?: string;
    gender?: string;
    street_address?: string;
    phone?: string;
    email?: string;
    country_id?: number;
    state_id?: number;
    municipality_id?: number;
}

const updatePatient = async (patientId: number, params: UpdatePatientParams) => {
    const response = await api.patch(`/administrator/patients/${patientId}`, params);
    return response.data;
};

const updatePatientEmail = async (patientId: number, email: string) => {
    const response = await api.put(`/administrator/patients/${patientId}/email`, { email });
    return response.data;
};

export {
    getAllPatients,
    searchPatients,
    togglePatientStatus,
    updatePatient,
    updatePatientEmail
};
