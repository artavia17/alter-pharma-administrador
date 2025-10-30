export interface DoseData {
  id: number;
  product_id: number;
  dose: string;
  max_redemptions_per_month: number;
  max_redemptions_per_year: number;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface DosesResponse {
  status: number;
  message: string;
  data: DoseData[];
}

export interface SingleDoseResponse {
  status: number;
  message: string;
  data: DoseData;
}

export interface CreateDoseParams {
  dose: string;
  max_redemptions_per_month: number;
  max_redemptions_per_year: number;
}
