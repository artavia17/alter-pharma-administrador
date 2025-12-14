import { PharmacyData } from "./pharmacies.types";
import { SubPharmacyData } from "./sub-pharmacies.types";
import { UserData } from "./users.types";

export interface TransactionBasic {
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
}

export interface AnomalyDetails {
  reason: string;
  max_similarity: number;
  min_similarity: number;
  pattern_similarity: number;
  recent_invoices_sample: string[];
}

export interface InvoiceGapData {
  id: number;
  pharmacy_id: number;
  sub_pharmacy_id: number | null;
  expected_number: number | null;
  received_number: number | null;
  expected_pattern: string;
  received_pattern: string;
  similarity_score: string;
  is_anomaly: boolean;
  anomaly_details: AnomalyDetails;
  missing_range: string;
  detected_in_transaction_id: number;
  is_resolved: boolean;
  resolution_notes: string | null;
  resolved_at: string | null;
  resolved_by: number | null;
  created_at: string;
  updated_at: string;
  pharmacy: PharmacyData;
  sub_pharmacy: SubPharmacyData | null;
  transaction: TransactionBasic;
  resolved_by_user?: UserData | null;
}

export interface InvoiceGapsResponse {
  status: number;
  message: string;
  data: InvoiceGapData[];
}

export interface SingleInvoiceGapResponse {
  status: number;
  message: string;
  data: InvoiceGapData;
}

export interface PharmacyWithGapsCount {
  pharmacy_id: number;
  gaps_count: number;
  pharmacy: PharmacyData;
}

export interface InvoiceGapStatistics {
  total_gaps: number;
  unresolved_gaps: number;
  resolved_gaps: number;
  gaps_this_month: number;
  pharmacies_with_most_gaps: PharmacyWithGapsCount[];
}

export interface InvoiceGapStatisticsResponse {
  status: number;
  message: string;
  data: InvoiceGapStatistics;
}

export interface ResolveInvoiceGapParams {
  resolution_notes?: string;
}

export interface GetInvoiceGapsParams {
  pharmacy_id?: number;
  is_resolved?: boolean;
  from_date?: string;
  to_date?: string;
}
