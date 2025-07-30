export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'merchant' | 'customer';
  status: 'active' | 'inactive' | 'pending';
  merchantInfo?: {
    companyName: string;
    contactPerson: string;
    phone: string;
    qq?: string;
    wechat?: string;
    businessLicense?: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  categoryCode?: {
    _id: string;
    code: string;
    name: string;
  };
  price: number;
  stock: number;
  deliveryType: 'link' | 'text' | 'file' | 'account';
  deliveryTypeCode?: {
    _id: string;
    code: string;
    name: string;
  };
  deliveryTemplate: string;
  deliveryData?: any;
  merchant: string | User;
  status: 'active' | 'inactive';
  images: string[];
  tags: string[];
  sales: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  deliveryType: 'link' | 'text' | 'file' | 'account';
  deliveryTemplate: string;
  tags?: string[];
  status?: 'active' | 'inactive';
  images?: File[] | string[];
  generatePickupCode?: boolean;
  pickupCodeConfig?: {
    usageLimit?: number;
    expiresInDays?: number;
  };
}

export interface Order {
  _id: string;
  orderNumber: string;
  product: Product | string;
  customer: {
    email?: string;
    phone?: string;
    name?: string;
  };
  totalAmount: number;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
  createdAt: string;
  updatedAt: string;
  pickedUpAt?: string;
  expiresAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{
    field?: string;
    message: string;
    value?: any;
  }>;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: 'merchant'; // 修改为必需字段
  merchantInfo?: {
    companyName: string;
    contactPerson: string;
    phone: string;
    qq?: string;
    wechat?: string;
    businessLicense?: string;
    description?: string;
  };
}

// 添加仪表板统计数据的具体类型定义
export interface AdminDashboardStats {
  totalUsers: number;
  totalMerchants: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: Order[];
  topProducts: Product[];
}

export interface MerchantDashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  recentOrders: Order[];
}

export interface DashboardStats {
  totalUsers?: number;
  totalMerchants?: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders?: number;
  recentOrders: Order[];
  topProducts?: Product[];
}