import api from "../api";
import {
  PurchaseReportResponse,
  PurchaseReportParams,
  PharmacySalesResponse,
  PharmacySalesParams,
  ProductSalesResponse,
  ProductSalesParams,
} from "../../types/services/protected/reports.types";

// Get Purchase Report
const getPurchaseReport = async (params?: PurchaseReportParams) => {
  const queryParams = new URLSearchParams();

  if (params?.pharmacy_id) queryParams.append('pharmacy_id', params.pharmacy_id.toString());
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  if (params?.entry_type) queryParams.append('entry_type', params.entry_type);
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
  if (params?.page) queryParams.append('page', params.page.toString());

  const queryString = queryParams.toString();
  const url = queryString
    ? `/administrator/reports/purchases?${queryString}`
    : '/administrator/reports/purchases';

  const response = await api.get<PurchaseReportResponse>(url);
  return response.data;
};

// Get Pharmacy Sales Report
const getPharmacySalesReport = async (params?: PharmacySalesParams) => {
  const queryParams = new URLSearchParams();

  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);

  const queryString = queryParams.toString();
  const url = queryString
    ? `/administrator/reports/pharmacy-sales?${queryString}`
    : '/administrator/reports/pharmacy-sales';

  const response = await api.get<PharmacySalesResponse>(url);
  return response.data;
};

// Get Product Sales Report
const getProductSalesReport = async (params?: ProductSalesParams) => {
  const queryParams = new URLSearchParams();

  if (params?.pharmacy_id) queryParams.append('pharmacy_id', params.pharmacy_id.toString());
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);

  const queryString = queryParams.toString();
  const url = queryString
    ? `/administrator/reports/product-sales?${queryString}`
    : '/administrator/reports/product-sales';

  const response = await api.get<ProductSalesResponse>(url);
  return response.data;
};

export { getPurchaseReport, getPharmacySalesReport, getProductSalesReport };
