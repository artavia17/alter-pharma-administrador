import api from '../api';
import {
  GetDistributorsResponse,
  GetDistributorResponse,
  CreateDistributorParams,
  CreateDistributorResponse,
  UpdateDistributorParams,
  UpdateDistributorResponse,
  DeleteDistributorResponse,
  ToggleDistributorStatusResponse
} from '../../types/services/protected/distributors.types';

export const getDistributors = async () => {
  const response = await api.get<GetDistributorsResponse>('/administrator/distributors');
  return response.data;
};

export const getDistributor = async (id: number) => {
  const response = await api.get<GetDistributorResponse>(`/administrator/distributors/${id}`);
  return response.data;
};

export const createDistributor = async (params: CreateDistributorParams) => {
  const response = await api.post<CreateDistributorResponse>('/administrator/distributors', params);
  return response.data;
};

export const updateDistributor = async (id: number, params: UpdateDistributorParams) => {
  const response = await api.put<UpdateDistributorResponse>(`/administrator/distributors/${id}`, params);
  return response.data;
};

export const deleteDistributor = async (id: number) => {
  const response = await api.delete<DeleteDistributorResponse>(`/administrator/distributors/${id}`);
  return response.data;
};

export const toggleDistributorStatus = async (id: number) => {
  const response = await api.patch<ToggleDistributorStatusResponse>(`/administrator/distributors/${id}/toggle-status`);
  return response.data;
};
