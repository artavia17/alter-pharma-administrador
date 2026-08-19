import api from "../api";

export const getEvidenceRequests = async (params?: {
  status?: string;
  search?: string;
  per_page?: number;
  page?: number;
}) => {
  const q = new URLSearchParams();
  if (params?.status) q.append('status', params.status);
  if (params?.search) q.append('search', params.search);
  if (params?.per_page) q.append('per_page', params.per_page.toString());
  if (params?.page) q.append('page', params.page.toString());
  const qs = q.toString();
  const response = await api.get(qs ? `/administrator/evidence-requests?${qs}` : '/administrator/evidence-requests');
  return response.data;
};

export const createEvidenceRequest = async (data: {
  pharmacy_id: number;
  reason: string;
  invoices?: { invoice_number: string; patient_name: string; pharmacy_name: string }[];
}) => {
  const response = await api.post('/administrator/evidence-requests', data);
  return response.data;
};

export const sendReminder = async (id: number) => {
  const response = await api.post(`/administrator/evidence-requests/${id}/remind`);
  return response.data;
};

export const resolveEvidenceRequest = async (id: number, notes?: string) => {
  const response = await api.post(`/administrator/evidence-requests/${id}/resolve`, { notes });
  return response.data;
};
