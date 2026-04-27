import api from "../api";
import { SchemaData, ReportQueryParams, ReportQueryResponse } from "../../types/services/protected/dynamic-reports.types";

const getDynamicReportSchema = async () => {
  const response = await api.get<{ status: number; message: string; data: SchemaData }>(
    "/administrator/reports/dynamic/schema"
  );
  return response.data;
};

const runDynamicReport = async (params: ReportQueryParams) => {
  const response = await api.post<ReportQueryResponse>(
    "/administrator/reports/dynamic/query",
    params
  );
  return response.data;
};

const exportDynamicReport = async (params: Omit<ReportQueryParams, "per_page" | "page">) => {
  const response = await api.post(
    "/administrator/reports/dynamic/export",
    params,
    { responseType: "blob" }
  );
  return response;
};

export { getDynamicReportSchema, runDynamicReport, exportDynamicReport };
