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

const getPharmaciesByCountry = async (countryId: number) => {
  const response = await api.get<PharmaciesByCountryResponse>(`/administrator/countries/${countryId}/pharmacies`);
  return response.data;
};

const getSubPharmacies = async (pharmacyId: number) => {
  const response = await api.get<SubPharmaciesResponse>(`/administrator/pharmacies/${pharmacyId}/sub-pharmacies`);
  return response.data;
};

export {
  getPharmaciesByCountry,
  getSubPharmacies
};
