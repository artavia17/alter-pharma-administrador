export interface SubPharmacyData {
  id: number;
  pharmacy_id: number;
  country_id: number;
  state_id?: number;
  municipality_id?: number;
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
  state?: {
    id: number;
    country_id: number;
    name: string;
    code: string | null;
    status: boolean;
    created_at: string;
    updated_at: string;
  };
  municipality?: {
    id: number;
    state_id: number;
    name: string;
    code: string | null;
    status: boolean;
    created_at: string;
    updated_at: string;
  };
  default_distributor?: {
    id: number;
    country_id: number;
    state_id: number;
    municipality_id: number;
    business_name: string;
    identification_number: string;
    street_address: string;
    phone: string;
    email: string;
    contact_person_name: string;
    status: boolean;
    last_login: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}
