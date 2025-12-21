export interface CountryData {
  id: number;
  name: string;
  iso_code: string;
  phone_code: string;
  phone_min_length: number;
  phone_max_length: number;
  identification_min_length: number;
  identification_max_length: number;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoseData {
  id: number;
  product_id: number;
  dose: string;
  name?: string;
  description?: string;
  barcode?: string | null;
  promotion_buy?: string | number;
  promotion_get?: string | number;
  redemption_days?: string | number;
  max_redemptions_per_month: number;
  max_redemptions_per_year: number;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductGroupBasic {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductData {
  id: number;
  product_group_id: string | null;
  name: string;
  description: string;
  country_ids: number[];
  countries?: CountryData[];
  status: boolean;
  created_at: string;
  updated_at: string;
  doses: DoseData[];
  product_group: ProductGroupBasic | null;
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
  product_group_id: number;
  name: string;
  description?: string;
  country_ids: number[];
}

export interface UpdateProductParams {
  product_group_id: number;
  name: string;
  description?: string;
  country_ids: number[];
}
