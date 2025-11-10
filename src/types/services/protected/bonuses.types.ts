import { PatientData } from "./patients.types";
import { ProductData } from "./products.types";
import { DoseData } from "./doses.types";

export interface BonusData {
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

export interface BonusStatistics {
  total: number;
  available: number;
  redeemed: number;
  expired: number;
  total_patients: number;
}

export interface GetBonusesResponse {
  status: number;
  message: string;
  data: BonusData[];
}

export interface GetBonusResponse {
  status: number;
  message: string;
  data: BonusData;
}

export interface GetBonusStatisticsResponse {
  status: number;
  message: string;
  data: BonusStatistics;
}

export interface CreateBonusResponse {
  status: number;
  message: string;
  data: {
    patient: PatientData;
    product: ProductData;
    dose: DoseData;
    quantity: number;
    bonuses: BonusData[];
    issue_date: string;
    expiration_date: string;
  };
}

export interface CreateBonusParams {
  product_dose_id: number;
  quantity: number;
  expiration_days: number;
  notes?: string;
  send_email?: boolean;
}
