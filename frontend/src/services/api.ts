import {
  IProduct,
  IOrder,
  IRowGroup,
  IWarehouseStats,
  IBin,
  IAnalyticsData,
  IActivityLog,
  IAllocationResult,
} from '../types.js';

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function fetchSafe<T>(url: string, options?: RequestInit, retries: number = 2): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${res.status}`);
      }
      return (await res.json()) as T;
    } catch (err: any) {
      attempt++;
      if (attempt > retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
}

export const api = {
  // Health
  async getHealth() {
    return fetchSafe<{ status: string; service: string; version: string; database: any }>(`${BASE_URL}/health`);
  },

  // Products
  async getProducts(params?: { search?: string; category?: string; status?: string; sortBy?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.sortBy) query.set('sortBy', params.sortBy);

    return fetchSafe<{ success: boolean; count: number; products: IProduct[] }>(
      `${BASE_URL}/products?${query.toString()}`
    );
  },

  async getProductByBarcode(barcode: string) {
    return fetchSafe<{ success: boolean; product: IProduct; bin?: IBin; message?: string }>(
      `${BASE_URL}/products/barcode/${encodeURIComponent(barcode)}`
    );
  },

  async getProduct(id: string) {
    return fetchSafe<{ success: boolean; product: IProduct; bin?: IBin; recentTransactions: any[] }>(
      `${BASE_URL}/products/${id}`
    );
  },

  async createProduct(data: {
    name: string;
    sku: string;
    barcode: string;
    category: string;
    quantity: number;
    minimumStock?: number;
    unitPrice?: number;
    description?: string;
  }) {
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json() as Promise<{
      success: boolean;
      product?: IProduct;
      allocation?: IAllocationResult;
      message?: string;
    }>;
  },

  async updateProduct(id: string, data: Partial<IProduct>) {
    const res = await fetch(`${BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json() as Promise<{ success: boolean; product?: IProduct; message?: string }>;
  },

  async deleteProduct(id: string) {
    const res = await fetch(`${BASE_URL}/products/${id}`, { method: 'DELETE' });
    return res.json() as Promise<{ success: boolean; message: string }>;
  },

  // Orders
  async getOrders(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${BASE_URL}/orders?${query.toString()}`);
    return res.json() as Promise<{ success: boolean; count: number; orders: IOrder[] }>;
  },

  async getOrder(id: string) {
    const res = await fetch(`${BASE_URL}/orders/${id}`);
    return res.json() as Promise<{ success: boolean; order: IOrder }>;
  },

  async createOrder(data: {
    customerName: string;
    customerEmail?: string;
    destination?: string;
    priority?: string;
    items: { productId?: string; barcode?: string; quantity: number }[];
  }) {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json() as Promise<{ success: boolean; order?: IOrder; message?: string }>;
  },

  async pickOrderItem(orderId: string, data: { scannedBarcode: string; expectedBarcode: string }) {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/pick-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json() as Promise<{
      success: boolean;
      verified: boolean;
      errorType?: string;
      message?: string;
      expected?: any;
      scanned?: any;
      allPicked?: boolean;
      orderStatus?: string;
      order?: IOrder;
    }>;
  },

  async dispatchOrder(orderId: string) {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/dispatch`, {
      method: 'POST',
    });
    return res.json() as Promise<{ success: boolean; order?: IOrder; message?: string }>;
  },

  // Scan
  async scanBarcode(barcode: string) {
    const res = await fetch(`${BASE_URL}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode }),
    });
    return res.json() as Promise<{
      success: boolean;
      found: boolean;
      product?: IProduct;
      bin?: IBin;
      message?: string;
    }>;
  },

  async inwardStock(data: {
    barcode: string;
    quantity: number;
    name?: string;
    sku?: string;
    category?: string;
    unitPrice?: number;
    description?: string;
  }) {
    const res = await fetch(`${BASE_URL}/scan/inward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json() as Promise<{
      success: boolean;
      product?: IProduct;
      allocation?: IAllocationResult;
      message?: string;
    }>;
  },

  // Warehouse
  async getWarehouseOverview() {
    return fetchSafe<{
      success: boolean;
      warehouse: any;
      stats: IWarehouseStats;
      rows: any[];
    }>(`${BASE_URL}/warehouse`);
  },

  async getWarehouseBins() {
    return fetchSafe<{
      success: boolean;
      rows: IRowGroup[];
      rawBins: IBin[];
    }>(`${BASE_URL}/warehouse/bins`);
  },

  async addWarehouseRow() {
    return fetchSafe<{ success: boolean; message: string; row: any; bins: any[] }>(
      `${BASE_URL}/warehouse/add-row`,
      { method: 'POST' }
    );
  },

  // Analytics
  async getAnalytics() {
    return fetchSafe<IAnalyticsData & { success: boolean }>(`${BASE_URL}/analytics`);
  },

  // Activity
  async getActivity(params?: { eventType?: string; severity?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.eventType) query.set('eventType', params.eventType);
    if (params?.severity) query.set('severity', params.severity);
    if (params?.limit) query.set('limit', String(params.limit));

    return fetchSafe<{ success: boolean; count: number; logs: IActivityLog[] }>(
      `${BASE_URL}/activity?${query.toString()}`
    );
  },

};
