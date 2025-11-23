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

export {
    getAllPatients,
    searchPatients,
    togglePatientStatus
};
