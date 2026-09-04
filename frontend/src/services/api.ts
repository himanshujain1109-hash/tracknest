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

/*
 * API BASE URL
 *
 * Vercel Environment Variable:
 *
 * VITE_API_URL=https://YOUR-BACKEND.onrender.com
 *
 * The /api prefix is added automatically.
 */
const configuredUrl = String(import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/+$/, '');

const BASE_URL = configuredUrl
  ? configuredUrl.endsWith('/api')
    ? configuredUrl
    : `${configuredUrl}/api`
  : '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';

  let data: any;

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = {
      success: false,
      message: text || `Request failed with status ${response.status}`,
    };
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data as T;
}

export const api = {
  // --------------------------------------------------
  // HEALTH
  // --------------------------------------------------

  getHealth() {
    return request<{
      status: string;
      service: string;
      version: string;
      database: any;
      timestamp?: string;
    }>('/health');
  },

  // --------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------

  getProducts(params?: {
    search?: string;
    category?: string;
    status?: string;
    sortBy?: string;
  }) {
    const query = new URLSearchParams();

    if (params?.search) {
      query.set('search', params.search);
    }

    if (params?.category) {
      query.set('category', params.category);
    }

    if (params?.status) {
      query.set('status', params.status);
    }

    if (params?.sortBy) {
      query.set('sortBy', params.sortBy);
    }

    const queryString = query.toString();

    return request<{
      success: boolean;
      count: number;
      products: IProduct[];
    }>(
      `/products${queryString ? `?${queryString}` : ''}`
    );
  },

  getProductByBarcode(barcode: string) {
    return request<{
      success: boolean;
      product: IProduct;
      bin?: IBin;
      message?: string;
    }>(
      `/products/barcode/${encodeURIComponent(barcode)}`
    );
  },

  getProduct(id: string) {
    return request<{
      success: boolean;
      product: IProduct;
      bin?: IBin;
      recentTransactions: any[];
    }>(`/products/${id}`);
  },

  createProduct(data: {
    name: string;
    sku: string;
    barcode: string;
    category: string;
    quantity: number;
    minimumStock?: number;
    unitPrice?: number;
    description?: string;
  }) {
    return request<{
      success: boolean;
      product?: IProduct;
      allocation?: IAllocationResult;
      message?: string;
    }>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateProduct(
    id: string,
    data: Partial<IProduct>
  ) {
    return request<{
      success: boolean;
      product?: IProduct;
      message?: string;
    }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteProduct(id: string) {
    return request<{
      success: boolean;
      message: string;
    }>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // --------------------------------------------------
  // ORDERS
  // --------------------------------------------------

  getOrders(params?: {
    status?: string;
    search?: string;
  }) {
    const query = new URLSearchParams();

    if (params?.status) {
      query.set('status', params.status);
    }

    if (params?.search) {
      query.set('search', params.search);
    }

    const queryString = query.toString();

    return request<{
      success: boolean;
      count: number;
      orders: IOrder[];
    }>(
      `/orders${queryString ? `?${queryString}` : ''}`
    );
  },

  getOrder(id: string) {
    return request<{
      success: boolean;
      order: IOrder;
    }>(`/orders/${id}`);
  },

  createOrder(data: {
    customerName: string;
    customerEmail?: string;
    destination?: string;
    priority?: string;
    items: {
      productId?: string;
      barcode?: string;
      quantity: number;
    }[];
  }) {
    return request<{
      success: boolean;
      order?: IOrder;
      message?: string;
    }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  pickOrderItem(
    orderId: string,
    data: {
      scannedBarcode: string;
      expectedBarcode: string;
    }
  ) {
    return request<{
      success: boolean;
      verified: boolean;
      errorType?: string;
      message?: string;
      expected?: any;
      scanned?: any;
      allPicked?: boolean;
      orderStatus?: string;
      order?: IOrder;
    }>(
      `/orders/${orderId}/pick-item`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  dispatchOrder(orderId: string) {
    return request<{
      success: boolean;
      order?: IOrder;
      message?: string;
    }>(
      `/orders/${orderId}/dispatch`,
      {
        method: 'POST',
      }
    );
  },

  // --------------------------------------------------
  // BARCODE SCANNING
  // --------------------------------------------------

  scanBarcode(barcode: string) {
    return request<{
      success: boolean;
      found: boolean;
      product?: IProduct;
      bin?: IBin;
      message?: string;
    }>('/scan', {
      method: 'POST',
      body: JSON.stringify({ barcode }),
    });
  },

  inwardStock(data: {
    barcode: string;
    quantity: number;
    name?: string;
    sku?: string;
    category?: string;
    unitPrice?: number;
    description?: string;
  }) {
    return request<{
      success: boolean;
      product?: IProduct;
      allocation?: IAllocationResult;
      message?: string;
    }>('/scan/inward', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --------------------------------------------------
  // WAREHOUSE
  // --------------------------------------------------

  getWarehouseOverview() {
    return request<{
      success: boolean;
      warehouse: any;
      stats: IWarehouseStats;
      rows: any[];
    }>('/warehouse');
  },

  getWarehouseBins() {
    return request<{
      success: boolean;
      rows: IRowGroup[];
      rawBins: IBin[];
    }>('/warehouse/bins');
  },

  addWarehouseRow() {
    return request<{
      success: boolean;
      message: string;
      row: any;
      bins: any[];
    }>('/warehouse/add-row', {
      method: 'POST',
    });
  },

  // --------------------------------------------------
  // ANALYTICS
  // --------------------------------------------------

  getAnalytics() {
    return request<
      IAnalyticsData & {
        success: boolean;
      }
    >('/analytics');
  },

  // --------------------------------------------------
  // ACTIVITY
  // --------------------------------------------------

  getActivity(params?: {
    eventType?: string;
    severity?: string;
    limit?: number;
  }) {
    const query = new URLSearchParams();

    if (params?.eventType) {
      query.set('eventType', params.eventType);
    }

    if (params?.severity) {
      query.set('severity', params.severity);
    }

    if (params?.limit) {
      query.set('limit', String(params.limit));
    }

    const queryString = query.toString();

    return request<{
      success: boolean;
      count: number;
      logs: IActivityLog[];
    }>(
      `/activity${queryString ? `?${queryString}` : ''}`
    );
  },
};
