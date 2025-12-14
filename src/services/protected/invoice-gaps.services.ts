import api from "../api";
import {
  InvoiceGapsResponse,
  SingleInvoiceGapResponse,
  InvoiceGapStatisticsResponse,
  GetInvoiceGapsParams,
  ResolveInvoiceGapParams,
} from "../../types/services/protected/invoice-gaps.types";

/**
 * Get all invoice gaps with optional filters
 */
export const getInvoiceGaps = async (params?: GetInvoiceGapsParams) => {
  const queryParams = new URLSearchParams();

  if (params?.pharmacy_id) {
    queryParams.append("pharmacy_id", params.pharmacy_id.toString());
  }
  if (params?.is_resolved !== undefined) {
    queryParams.append("is_resolved", params.is_resolved.toString());
  }
  if (params?.from_date) {
    queryParams.append("from_date", params.from_date);
  }
  if (params?.to_date) {
    queryParams.append("to_date", params.to_date);
  }

  const queryString = queryParams.toString();
  const url = `/administrator/invoice-gaps${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<InvoiceGapsResponse>(url);
  return response.data;
};

/**
 * Get unresolved invoice gaps
 */
export const getUnresolvedInvoiceGaps = async () => {
  const response = await api.get<InvoiceGapsResponse>("/administrator/invoice-gaps/unresolved");
  return response.data;
};

/**
 * Get invoice gaps statistics
 */
export const getInvoiceGapStatistics = async () => {
  const response = await api.get<InvoiceGapStatisticsResponse>("/administrator/invoice-gaps/statistics");
  return response.data;
};

/**
 * Get single invoice gap by ID
 */
export const getInvoiceGapById = async (id: number) => {
  const response = await api.get<SingleInvoiceGapResponse>(`/administrator/invoice-gaps/${id}`);
  return response.data;
};

/**
 * Resolve an invoice gap
 */
export const resolveInvoiceGap = async (id: number, params: ResolveInvoiceGapParams) => {
  const response = await api.post<SingleInvoiceGapResponse>(
    `/administrator/invoice-gaps/${id}/resolve`,
    params
  );
  return response.data;
};
