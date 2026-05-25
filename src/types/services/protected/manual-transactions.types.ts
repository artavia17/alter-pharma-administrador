import { PatientData } from "./patients.types";
import { ProductData } from "./products.types";
import { DoseData } from "./doses.types";

export interface ManualTransactionData {
  id: number;
  patient_id: number;
  product_id: number;
  product_dose_id: number;
  transaction_product_id: number | null;
  source: string;
  status: string;
  purchase_date: string;
  redemption_days: number;
  expiration_date: string;
  redeemed_at: string | null;
  redeemed_transaction_id: number | null;
  notes: string;
  created_at: string;
  updated_at: string;
  product?: ProductData;
  product_dose?: DoseData;
  patient?: PatientData;
}

export interface ManualTransactionStatistics {
  total: number;
  available: number;
  redeemed: number;
  expired: number;
  total_patients: number;
}

export interface GetManualTransactionsResponse {
  status: number;
  message: string;
  data: ManualTransactionData[];
}

export interface GetManualTransactionResponse {
  status: number;
  message: string;
  data: ManualTransactionData;
}

export interface GetManualTransactionStatisticsResponse {
  status: number;
  message: string;
  data: ManualTransactionStatistics;
}

export interface CreateManualTransactionResponse {
  status: number;
  message: string;
  data: {
    patient: PatientData;
    product: ProductData;
    dose: DoseData;
    quantity: number;
    transactions: ManualTransactionData[];
    issue_date: string;
    expiration_date: string;
  };
}

export interface CreateManualTransactionParams {
  product_dose_id: number;
  quantity: number;
  expiration_days: number;
  notes?: string;
  send_email?: boolean;
}
