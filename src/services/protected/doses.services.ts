import { DosesResponse, SingleDoseResponse, CreateDoseParams } from "../../types/services/protected/doses.types";
import api from "../api";

const getDoses = async (productId: number) => {
  const response = await api.get<DosesResponse>(`/administrator/products/${productId}/doses`);
  return response.data;
};

const getDose = async (productId: number, doseId: number) => {
  const response = await api.get<SingleDoseResponse>(`/administrator/products/${productId}/doses/${doseId}`);
  return response.data;
};

const createDose = async (productId: number, params: CreateDoseParams) => {
  const response = await api.post<SingleDoseResponse>(`/administrator/products/${productId}/doses`, params);
  return response.data;
};

const updateDose = async (productId: number, doseId: number, params: CreateDoseParams) => {
  const response = await api.post<SingleDoseResponse>(`/administrator/products/${productId}/doses/${doseId}`, params);
  return response.data;
};

const toggleDoseStatus = async (productId: number, doseId: number) => {
  const response = await api.patch<SingleDoseResponse>(`/administrator/products/${productId}/doses/${doseId}/toggle-status`);
  return response.data;
};

const deleteDose = async (productId: number, doseId: number) => {
  const response = await api.delete(`/administrator/products/${productId}/doses/${doseId}`);
  return response.data;
};

export {
  getDoses,
  getDose,
  createDose,
  updateDose,
  toggleDoseStatus,
  deleteDose
};
