import api from "../api";
import {
  GetBonusesResponse,
  GetBonusResponse,
  GetBonusStatisticsResponse,
  CreateBonusResponse,
  CreateBonusParams,
} from "../../types/services/protected/bonuses.types";

export const getAllBonuses = async () => {
  const response = await api.get<GetBonusesResponse>("/administrator/bonuses");
  return response.data;
};

export const getBonusesByPatient = async (patientId: number) => {
  const response = await api.get<GetBonusesResponse>(
    `/administrator/patients/${patientId}/bonuses`
  );
  return response.data;
};

export const getBonus = async (bonusId: number) => {
  const response = await api.get<GetBonusResponse>(
    `/administrator/bonuses/${bonusId}`
  );
  return response.data;
};

export const getBonusStatistics = async () => {
  const response = await api.get<GetBonusStatisticsResponse>(
    "/administrator/bonuses/statistics"
  );
  return response.data;
};

export const createBonus = async (
  patientId: number,
  params: CreateBonusParams
) => {
  const response = await api.post<CreateBonusResponse>(
    `/administrator/patients/${patientId}/bonuses`,
    params
  );
  return response.data;
};

export const cancelBonus = async (bonusId: number) => {
  const response = await api.delete<GetBonusResponse>(
    `/administrator/bonuses/${bonusId}`
  );
  return response.data;
};
