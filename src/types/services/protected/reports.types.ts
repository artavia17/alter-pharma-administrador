// ==================== Reports Types ====================

// Purchase Report Types
export interface PurchaseTransactionProduct {
  id: number;
  transaction_id: number;
  product_id: number;
  product_dose_id: number;
  quantity: number;
  unit_price: string;
  subtotal: string;
  created_at: string;
  updated_at: string;
  product: {
    id: number;
    name: string;
  };
  product_dose: {
    id: number;
    product_id: number;
    dose: string;
  };
}

export interface PurchaseTransactionPatient {
  id: number;
  first_name: string;
  last_name: string;
  identification_number: string;
}

export interface PurchaseTransactionPharmacy {
  id: number;
  commercial_name: string;
  identification_number: string;
}

export interface PurchaseTransaction {
  id: number;
  patient_id: number;
  pharmacy_id: number;
  sub_pharmacy_id: number | null;
  created_by: string;
  pharmacy_name: string;
  transaction_date: string;
  invoice_number: string;
  total: string;
  entry_type: string;
  invoice_file_url: string | null;
  created_at: string;
  updated_at: string;
  patient: PurchaseTransactionPatient;
  pharmacy: PurchaseTransactionPharmacy;
  sub_pharmacy: any;
  products: PurchaseTransactionProduct[];
}

export interface PurchaseReportPagination {
  current_page: number;
  data: PurchaseTransaction[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface PurchaseReportSummary {
  total_transactions: number;
  total_amount: string;
  automatic_entries: number;
  manual_entries: number;
  average_transaction: number;
}

export interface PurchaseReportData {
  transactions: PurchaseReportPagination;
  summary: PurchaseReportSummary;
}

export interface PurchaseReportResponse {
  status: number;
  message: string;
  data: PurchaseReportData;
}

export interface PurchaseReportParams {
  pharmacy_id?: number;
  start_date?: string;
  end_date?: string;
  entry_type?: string;
  per_page?: number;
  page?: number;
}

// Pharmacy Sales Report Types
export interface PharmacySalesData {
  id: number;
  commercial_name: string;
  identification_number: string;
  total_transactions: number;
  total_sales: string;
  average_transaction: string;
  unique_patients: number;
}

export interface PharmacySalesResponse {
  status: number;
  message: string;
  data: PharmacySalesData[];
}

export interface PharmacySalesParams {
  start_date?: string;
  end_date?: string;
}

// Product Sales Report Types
export interface ProductSalesData {
  id: number;
  name: string;
  dose: string;
  total_quantity: string;
  total_revenue: string;
  pharmacies_count: number;
  patients_count: number;
}

export interface ProductSalesResponse {
  status: number;
  message: string;
  data: ProductSalesData[];
}

export interface ProductSalesParams {
  pharmacy_id?: number;
  start_date?: string;
  end_date?: string;
}
