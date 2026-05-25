import api from "../api";
import {
  GetManualTransactionsResponse,
  GetManualTransactionResponse,
  GetManualTransactionStatisticsResponse,
  CreateManualTransactionResponse,
  CreateManualTransactionParams,
} from "../../types/services/protected/manual-transactions.types";

export const getAllManualTransactions = async () => {
  const response = await api.get<GetManualTransactionsResponse>(
    "/administrator/manual-transactions"
  );
  return response.data;
};

export const getManualTransaction = async (transactionId: number) => {
  const response = await api.get<GetManualTransactionResponse>(
    `/administrator/manual-transactions/${transactionId}`
  );
  return response.data;
};

export const getManualTransactionStatistics = async () => {
  const response = await api.get<GetManualTransactionStatisticsResponse>(
    "/administrator/manual-transactions/statistics"
  );
  return response.data;
};

export const createManualTransaction = async (
  patientId: number,
  params: CreateManualTransactionParams
) => {
  const response = await api.post<CreateManualTransactionResponse>(
    `/administrator/patients/${patientId}/manual-transactions`,
    params
  );
  return response.data;
};

export const cancelManualTransaction = async (transactionId: number) => {
  const response = await api.delete<GetManualTransactionResponse>(
    `/administrator/manual-transactions/${transactionId}`
  );
  return response.data;
};
