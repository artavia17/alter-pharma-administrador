import api from "../api";

export const getBlockedRedemptions = async (params?: {
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
  const response = await api.get(qs ? `/administrator/redemptions/blocked?${qs}` : '/administrator/redemptions/blocked');
  return response.data;
};

export const unblockRedemption = async (id: number) => {
  const response = await api.post(`/administrator/redemptions/${id}/unblock`);
  return response.data;
};

export const blockRedemptionManual = async (id: number, reason: string) => {
  const response = await api.post(`/administrator/redemptions/${id}/block`, { reason });
  return response.data;
};
