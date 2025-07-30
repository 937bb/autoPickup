import axios from 'axios';
import { Product, ProductFormData, User, Order, RegisterRequest } from '../types';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API调用辅助函数
const makeApiCall = async <T = any>(apiCall: () => Promise<any>): Promise<ApiResponse<T>> => {
  const response = await apiCall();
  return response.data;
};

// 认证相关 API
export const authAPI = {
  login: async (credentials: { username: string; password: string }): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    console.log(response.data)
    return response.data;
  },
  
  register: async (userData: RegisterRequest): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
  
  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
  
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

// 用户管理 API
export const userAPI = {
  getUsers: async (params?: { role?: string; status?: string; page?: number; limit?: number }): Promise<ApiResponse<{ users: User[]; total: number; page: number; totalPages: number }>> => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },
  
  updateUserStatus: async (id: string, status: string): Promise<ApiResponse> => {
    const response = await apiClient.put(`/users/${id}/status`, { status });
    return response.data;
  },
};

// 商品管理 API
export const productAPI = {
  getProducts: async (params?: { merchant?: string; category?: string; status?: string; page?: number; limit?: number }): Promise<ApiResponse<{ products: Product[]; total: number; page: number; totalPages: number }>> => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },
  
  createProduct: async (data: ProductFormData | FormData): Promise<ApiResponse<Product>> => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    
    const response = await apiClient.post('/products', data, config);
    return response.data;
  },
  
  updateProduct: async (id: string, data: Partial<ProductFormData> | FormData): Promise<ApiResponse<Product>> => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    
    const response = await apiClient.put(`/products/${id}`, data, config);
    return response.data;
  },
  
  updateProductStatus: async (id: string, status: 'active' | 'inactive'): Promise<ApiResponse> => {
    const response = await apiClient.put(`/products/${id}/status`, { status });
    return response.data;
  },
  
  deleteProduct: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
  
  // 添加获取单个商品详情的方法
  getProductById: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  }
};

// 订单管理 API
export const orderAPI = {
  getOrders: async (params?: { status?: string; page?: number; limit?: number }): Promise<ApiResponse<{ orders: Order[]; total: number; page: number; totalPages: number }>> => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },
  
  updateOrderStatus: async (orderId: string, status: string): Promise<ApiResponse> => {
    const response = await apiClient.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },
  
  getOrderById: async (orderId: string): Promise<ApiResponse<Order>> => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  }
};

// 统计数据 API
export const statsAPI = {
  getDashboardStats: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/stats/dashboard');
    return response.data;
  },
  
  getMerchantStats: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/stats/merchant');
    return response.data;
  },
};

// 字典相关API
export const dictionaryAPI = {
  // 获取字典类型列表
  getTypes: () => apiClient.get('/dictionary/types'),
  
  // 根据类型代码获取字典项
  getItems: (typeCode: string, parentCode?: string) => {
    const params = parentCode ? { parentCode } : {};
    return apiClient.get(`/dictionary/items/${typeCode}`, { params });
  },
  
  // 获取发货模板列表
  getDeliveryTemplates: (deliveryType?: string) => {
    const params = deliveryType ? { deliveryType } : {};
    return apiClient.get('/dictionary/delivery-templates', { params });
  },
  
  // 管理员接口
  admin: {
    // 创建字典类型
    createType: (data: any) => apiClient.post('/dictionary/admin/types', data),
    
    // 创建字典项
    createItem: (data: any) => apiClient.post('/dictionary/admin/items', data)
  }
};

// 提货码相关API
export const pickupCodeAPI = {
  // 获取商品的提货码列表
  getProductCodes: (productId: string): Promise<ApiResponse> => 
    makeApiCall(() => apiClient.get(`/pickup-codes/product/${productId}`)),
  
  // 创建提货码
  createCode: (productId: string, data: any): Promise<ApiResponse> => 
    makeApiCall(() => apiClient.post(`/pickup-codes/product/${productId}`, data)),
  
  // 更新提货码
  updateCode: (codeId: string, data: any): Promise<ApiResponse> => 
    makeApiCall(() => apiClient.put(`/pickup-codes/${codeId}`, data)),
  
  // 删除提货码
  deleteCode: (codeId: string): Promise<ApiResponse> => 
    makeApiCall(() => apiClient.delete(`/pickup-codes/${codeId}`)),
};

export default apiClient;