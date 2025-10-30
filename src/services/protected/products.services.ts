import { ProductsResponse, SingleProductResponse, CreateProductParams } from "../../types/services/protected/products.types";
import api from "../api";

const getProducts = async () => {
  const response = await api.get<ProductsResponse>("/administrator/products");
  return response.data;
};

const getProduct = async (id: number) => {
  const response = await api.get<SingleProductResponse>(`/administrator/products/${id}`);
  return response.data;
};

const createProduct = async (params: CreateProductParams) => {
  const response = await api.post<SingleProductResponse>("/administrator/products", params);
  return response.data;
};

const updateProduct = async (id: number, params: CreateProductParams) => {
  const response = await api.post<SingleProductResponse>(`/administrator/products/${id}`, params);
  return response.data;
};

const toggleProductStatus = async (id: number) => {
  const response = await api.patch<SingleProductResponse>(`/administrator/products/${id}/toggle-status`);
  return response.data;
};

const deleteProduct = async (id: number) => {
  const response = await api.delete(`/administrator/products/${id}`);
  return response.data;
};

export {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  toggleProductStatus,
  deleteProduct
};
