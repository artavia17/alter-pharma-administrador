import api from "../api";

export interface DashboardFilters {
  start_date?: string;
  end_date?: string;
}

const getDashboard = async (params?: DashboardFilters) => {
  const queryParams = new URLSearchParams();
  if (params?.start_date) queryParams.append("start_date", params.start_date);
  if (params?.end_date) queryParams.append("end_date", params.end_date);
  const qs = queryParams.toString();
  const response = await api.get(`/administrator/dashboard${qs ? `?${qs}` : ""}`);
  return response.data;
};

export { getDashboard };
