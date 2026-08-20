import api from "../api";

export const getRedemptionTransactions = async (params?: {
  search?: string;
  from?: string;
  to?: string;
  per_page?: number;
  page?: number;
}) => {
  const q = new URLSearchParams();
  if (params?.search) q.append('search', params.search);
  if (params?.from) q.append('from', params.from);
  if (params?.to) q.append('to', params.to);
  if (params?.per_page) q.append('per_page', params.per_page.toString());
  if (params?.page) q.append('page', params.page.toString());
  const qs = q.toString();
  const response = await api.get(qs ? `/administrator/redemption-transactions?${qs}` : '/administrator/redemption-transactions');
  return response.data;
};

export const reverseRedemptionTransaction = async (id: number) => {
  const response = await api.post(`/administrator/redemption-transactions/${id}/reverse`);
  return response.data;
};
