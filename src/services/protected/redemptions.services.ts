import api from "../api";
import {
  PharmacyRedemptionResponse,
  PharmacyRedemptionParams,
  RedemptionDetailResponse,
  RedemptionDetailParams,
  ProductRedemptionResponse,
  ProductRedemptionParams,
  PatientProductRedemptionResponse,
  PatientProductRedemptionParams,
} from "../../types/services/protected/redemptions.types";

// Get Pharmacy Redemption Report
const getPharmacyRedemptionReport = async (params?: PharmacyRedemptionParams) => {
  const queryParams = new URLSearchParams();

  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);

  const queryString = queryParams.toString();
  const url = queryString
    ? `/administrator/reports/redemptions/pharmacy?${queryString}`
    : '/administrator/reports/redemptions/pharmacy';

  const response = await api.get<PharmacyRedemptionResponse>(url);
  return response.data;
};

// Get Redemption Details Report
const getRedemptionDetailsReport = async (params?: RedemptionDetailParams) => {
  const queryParams = new URLSearchParams();

  if (params?.pharmacy_id) queryParams.append('pharmacy_id', params.pharmacy_id.toString());
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
  if (params?.page) queryParams.append('page', params.page.toString());

  const queryString = queryParams.toString();
  const url = queryString
    ? `/administrator/reports/redemptions/details?${queryString}`
    : '/administrator/reports/redemptions/details';

  const response = await api.get<RedemptionDetailResponse>(url);
  return response.data;
};

// Get Product Redemption Report
const getProductRedemptionReport = async (params?: ProductRedemptionParams) => {
  const queryParams = new URLSearchParams();

  if (params?.pharmacy_id) queryParams.append('pharmacy_id', params.pharmacy_id.toString());
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);

  const queryString = queryParams.toString();
  const url = queryString
    ? `/administrator/reports/redemptions/products?${queryString}`
    : '/administrator/reports/redemptions/products';

  const response = await api.get<ProductRedemptionResponse>(url);
  return response.data;
};

// Get Patient-Product Redemption Report
const getPatientProductRedemptionReport = async (params?: PatientProductRedemptionParams) => {
  const queryParams = new URLSearchParams();

  if (params?.patient_id) queryParams.append('patient_id', params.patient_id.toString());
  if (params?.product_id) queryParams.append('product_id', params.product_id.toString());
  if (params?.pharmacy_id) queryParams.append('pharmacy_id', params.pharmacy_id.toString());
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
  if (params?.page) queryParams.append('page', params.page.toString());

  const queryString = queryParams.toString();
  const url = queryString
    ? `/administrator/reports/redemptions/patients-products?${queryString}`
    : '/administrator/reports/redemptions/patients-products';

  const response = await api.get<PatientProductRedemptionResponse>(url);
  return response.data;
};

export {
  getPharmacyRedemptionReport,
  getRedemptionDetailsReport,
  getProductRedemptionReport,
  getPatientProductRedemptionReport
};
