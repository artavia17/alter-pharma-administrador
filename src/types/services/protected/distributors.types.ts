import { CountryData } from './countries.types';
import { StateData } from './states.types';
import { MunicipalityData } from './municipalities.types';

export interface DistributorData {
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
  created_at: string;
  updated_at: string;
  country: CountryData;
  state: StateData;
  municipality: MunicipalityData;
}

export interface CreateDistributorParams {
  country_id: number;
  state_id: number;
  municipality_id: number;
  business_name: string;
  identification_number: string;
  street_address: string;
  phone: string;
  email: string;
  contact_person_name: string;
}

export interface UpdateDistributorParams {
  country_id: number;
  state_id: number;
  municipality_id: number;
  business_name: string;
  identification_number: string;
  street_address: string;
  phone: string;
  email: string;
  contact_person_name: string;
}

export interface GetDistributorsResponse {
  status: number;
  message: string;
  data: DistributorData[];
}

export interface GetDistributorResponse {
  status: number;
  message: string;
  data: DistributorData;
}

export interface CreateDistributorResponse {
  status: number;
  message: string;
  data: DistributorData;
}

export interface UpdateDistributorResponse {
  status: number;
  message: string;
  data: DistributorData;
}

export interface DeleteDistributorResponse {
  status: number;
  message: string;
}

export interface ToggleDistributorStatusResponse {
  status: number;
  message: string;
}
