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

export interface ProductData {
  id: number;
  name: string;
  description: string;
  country_ids: number[];
  status: boolean;
  created_at: string;
  updated_at: string;
  doses: DoseData[];
}

export interface ProductsResponse {
  status: number;
  message: string;
  data: ProductData[];
}

export interface SingleProductResponse {
  status: number;
  message: string;
  data: ProductData;
}

export interface CreateProductParams {
  name: string;
  description?: string;
  country_ids: number[];
}
