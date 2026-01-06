import api from '@/lib/api';
import type {
    Product,
    ProductListItem,
    ProductListParams,
    ProductCreateInput,
    ProductUpdateInput,
} from '@/types/product';
import type { PaginatedResponse } from '@/types/api';

const BASE_URL = '/products';

export const productService = {
    async getList(params: ProductListParams = {}): Promise<PaginatedResponse<ProductListItem>> {
        const response = await api.get<PaginatedResponse<ProductListItem>>(BASE_URL, { params });
        return response.data;
    },

    async getById(id: number): Promise<Product> {
        const response = await api.get<Product>(`${BASE_URL}/${id}`);
        return response.data;
    },

    async create(data: ProductCreateInput): Promise<Product> {
        const response = await api.post<Product>(BASE_URL, data);
        return response.data;
    },

    async update(id: number, data: ProductUpdateInput): Promise<Product> {
        const response = await api.put<Product>(`${BASE_URL}/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`${BASE_URL}/${id}`);
    },
};
