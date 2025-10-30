import { CountriesResponse, SingleCountryResponse } from "../../types/services/protected/countries.types";
import api from "../api";

const getCountries = async () => {
    const response = await api.get<CountriesResponse>("/administrator/countries");
    return response.data;
};

const getCountry = async (id: number) => {
    const response = await api.get<SingleCountryResponse>(`/administrator/countries/${id}`);
    return response.data;
};

const createCountry = async (
    name: string,
    code: string,
    phone_code: string,
    identification_min_length: number,
    identification_max_length: number,
    phone_min_length: number,
    phone_max_length: number
) => {
    const response = await api.post<SingleCountryResponse>("/administrator/countries", {
        name,
        code,
        phone_code,
        identification_min_length,
        identification_max_length,
        phone_min_length,
        phone_max_length
    });
    return response.data;
};

const updateCountry = async (
    id: number,
    name: string,
    code: string,
    phone_code: string,
    identification_min_length: number,
    identification_max_length: number,
    phone_min_length: number,
    phone_max_length: number
) => {
    const response = await api.post<SingleCountryResponse>(`/administrator/countries/${id}`, {
        name,
        code,
        phone_code,
        identification_min_length,
        identification_max_length,
        phone_min_length,
        phone_max_length
    });
    return response.data;
};

const toggleCountryStatus = async (id: number) => {
    const response = await api.patch<SingleCountryResponse>(`/administrator/countries/${id}/toggle-status`);
    return response.data;
};

export {
    getCountries,
    getCountry,
    createCountry,
    updateCountry,
    toggleCountryStatus
};
