import api from "../api";
import {
  ProductGroupsResponse,
  SingleProductGroupResponse,
  CreateProductGroupParams,
  UpdateProductGroupParams,
  GetProductGroupsParams,
} from "../../types/services/protected/product-groups.types";

/**
 * Get all product groups with optional filters
 */
export const getProductGroups = async (params?: GetProductGroupsParams) => {
  const queryParams = new URLSearchParams();

  if (params?.is_active !== undefined) {
    queryParams.append("is_active", params.is_active.toString());
  }
  if (params?.search) {
    queryParams.append("search", params.search);
  }

  const queryString = queryParams.toString();
  const url = `/administrator/product-groups${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<ProductGroupsResponse>(url);
  return response.data;
};

/**
 * Get single product group by ID
 */
export const getProductGroupById = async (id: number) => {
  const response = await api.get<SingleProductGroupResponse>(`/administrator/product-groups/${id}`);
  return response.data;
};

/**
 * Create a new product group
 */
export const createProductGroup = async (params: CreateProductGroupParams) => {
  const response = await api.post<SingleProductGroupResponse>("/administrator/product-groups", params);
  return response.data;
};

/**
 * Update an existing product group
 */
export const updateProductGroup = async (id: number, params: UpdateProductGroupParams) => {
  const response = await api.put<SingleProductGroupResponse>(`/administrator/product-groups/${id}`, params);
  return response.data;
};

/**
 * Delete a product group
 */
export const deleteProductGroup = async (id: number) => {
  const response = await api.delete<{ status: number; message: string }>(`/administrator/product-groups/${id}`);
  return response.data;
};

/**
 * Toggle product group status (activate/deactivate)
 */
export const toggleProductGroupStatus = async (id: number) => {
  const response = await api.post<SingleProductGroupResponse>(`/administrator/product-groups/${id}/toggle-status`);
  return response.data;
};
