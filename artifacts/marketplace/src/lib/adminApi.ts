const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminApi = {
  getStats: () => adminFetch<AdminStats>("/admin/stats"),
  getUsers: (page = 1, limit = 20) =>
    adminFetch<Paginated<AdminUser>>(`/admin/users?page=${page}&limit=${limit}`),
  deleteUser: (id: number) => adminFetch<{ message: string }>(`/admin/users/${id}`, { method: "DELETE" }),
  getProducts: (page = 1, limit = 20) =>
    adminFetch<Paginated<AdminProduct>>(`/admin/products?page=${page}&limit=${limit}`),
  updateProduct: (id: number, data: Partial<AdminProductUpdate>) =>
    adminFetch<AdminProduct>(`/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProduct: (id: number) => adminFetch<{ message: string }>(`/admin/products/${id}`, { method: "DELETE" }),
  getOrders: (page = 1, limit = 20) =>
    adminFetch<Paginated<AdminOrder>>(`/admin/orders?page=${page}&limit=${limit}`),
  updateOrderStatus: (id: number, status: string) =>
    adminFetch<{ message: string }>(`/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  getSettings: () => adminFetch<{ exchangeRate: number }>("/admin/settings"),
  updateSettings: (data: { exchangeRate: number }) =>
    adminFetch<{ message: string }>("/admin/settings", { method: "PATCH", body: JSON.stringify(data) }),
};

export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: { status: string; count: number }[];
  recentOrders: AdminOrderSummary[];
}

export interface AdminOrderSummary {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AdminProduct {
  id: number;
  sellerId: number;
  sellerName: string;
  name: string;
  description: string;
  price: number;
  discountPercent: number | null;
  category: string;
  stock: number;
  imageUrl: string | null;
  createdAt: string;
}

export interface AdminProductUpdate {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  discountPercent: number | null;
  imageUrl: string | null;
}

export interface AdminOrder {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  shippingAddress: string;
  items: { productId: number; productName: string; quantity: number; unitPrice: number; subtotal: number }[];
  createdAt: string;
  updatedAt: string;
}
