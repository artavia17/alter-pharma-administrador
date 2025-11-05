import { MunicipalitiesResponse, SingleMunicipalityResponse } from "../../types/services/protected/municipalities.types";
import api from "../api";

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

export {
    getMunicipalities,
    getMunicipality,
    createMunicipality,
    updateMunicipality,
    toggleMunicipalityStatus,
    deleteMunicipality
};
