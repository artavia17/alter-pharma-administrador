import api from "../api";

interface PharmaciesByCountryResponse {
  status: number;
  message: string;
  data: Array<{
    id: number;
    country_id: number;
    legal_name: string;
    commercial_name: string;
    identification_number: string;
    physical_address: string;
    phone: string;
    email: string;
    administrator_name: string;
    is_chain: boolean;
    status: boolean;
    remember_token: string | null;
    created_at: string;
    updated_at: string;
    country: {
      id: number;
      name: string;
      code: string;
      status: boolean;
      created_at: string;
      updated_at: string;
    };
  }>;
}

interface SubPharmaciesResponse {
  status: number;
  message: string;
  data: Array<{
    id: number;
    pharmacy_id: number;
    country_id: number;
    commercial_name: string;
    physical_address: string;
    phone: string;
    email: string;
    administrator_name: string;
    status: boolean;
    created_at: string;
    updated_at: string;
    pharmacy: {
      id: number;
      country_id: number;
      legal_name: string;
      commercial_name: string;
      identification_number: string;
      physical_address: string;
      phone: string;
      email: string;
      administrator_name: string;
      is_chain: boolean;
      status: boolean;
      created_at: string;
      updated_at: string;
      country: {
        id: number;
        name: string;
        code: string;
        status: boolean;
        created_at: string;
        updated_at: string;
      };
    };
  }>;
}

interface CreateSubPharmacyParams {
  state_id: number;
  municipality_id: number;
  commercial_name: string;
  street_address: string;
  phone: string;
  email: string;
  administrator_name: string;
}

interface CreateSubPharmacyResponse {
  status: number;
  message: string;
  data: any;
}

interface BulkSubPharmacyData {
  state_id: number;
  municipality_id: number;
  commercial_name: string;
  street_address: string;
  phone: string;
  email: string;
  administrator_name: string;
}

interface BulkCreateSubPharmaciesParams {
  sub_pharmacies: BulkSubPharmacyData[];
}

interface BulkCreateSubPharmaciesResponse {
  status: number;
  message: string;
  data: {
    success: any[];
    errors: any[];
    summary: {
      total: number;
      created: number;
      failed: number;
    };
  };
}

interface ToggleStatusResponse {
  status: number;
  message: string;
  data: any;
}

interface DeleteSubPharmacyResponse {
  status: number;
  message: string;
}

const getPharmaciesByCountry = async (countryId: number) => {
  const response = await api.get<PharmaciesByCountryResponse>(`/administrator/countries/${countryId}/pharmacies`);
  return response.data;
};

const getSubPharmacies = async (pharmacyId: number) => {
  const response = await api.get<SubPharmaciesResponse>(`/administrator/pharmacies/${pharmacyId}/sub-pharmacies`);
  return response.data;
};

const createSubPharmacy = async (pharmacyId: number, params: CreateSubPharmacyParams) => {
  const response = await api.post<CreateSubPharmacyResponse>(`/administrator/pharmacies/${pharmacyId}/sub-pharmacies`, params);
  return response.data;
};

const bulkCreateSubPharmacies = async (pharmacyId: number, params: BulkCreateSubPharmaciesParams) => {
  const response = await api.post<BulkCreateSubPharmaciesResponse>(`/administrator/pharmacies/${pharmacyId}/sub-pharmacies/bulk`, params);
  return response.data;
};

const toggleSubPharmacyStatus = async (pharmacyId: number, subPharmacyId: number) => {
  const response = await api.patch<ToggleStatusResponse>(`/administrator/pharmacies/${pharmacyId}/sub-pharmacies/${subPharmacyId}/toggle-status`);
  return response.data;
};

const deleteSubPharmacy = async (pharmacyId: number, subPharmacyId: number) => {
  const response = await api.delete<DeleteSubPharmacyResponse>(`/administrator/pharmacies/${pharmacyId}/sub-pharmacies/${subPharmacyId}`);
  return response.data;
};

export {
  getPharmaciesByCountry,
  getSubPharmacies,
  createSubPharmacy,
  bulkCreateSubPharmacies,
  toggleSubPharmacyStatus,
  deleteSubPharmacy
};

export type {
  BulkSubPharmacyData,
  BulkCreateSubPharmaciesParams,
  BulkCreateSubPharmaciesResponse,
  CreateSubPharmacyParams
};
