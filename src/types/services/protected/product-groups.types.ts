import { ProductData } from "./products.types";

export interface ProductGroupData {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products_count?: string;
  products?: ProductData[];
}

export interface ProductGroupsResponse {
  status: number;
  message: string;
  data: ProductGroupData[];
}

export interface SingleProductGroupResponse {
  status: number;
  message: string;
  data: ProductGroupData;
}

export interface CreateProductGroupParams {
  name: string;
  description: string;
  is_active: boolean;
}

export interface UpdateProductGroupParams {
  name: string;
  description: string;
  is_active: boolean;
}

export interface GetProductGroupsParams {
  is_active?: boolean;
  search?: string;
}
