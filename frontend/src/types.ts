export interface IProductLocation {
  warehouseId: string;
  row: string;
  bin: string;
}

export interface IProduct {
  _id: string;
  barcode: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minimumStock: number;
  location: IProductLocation;
  unitPrice: number;
  description?: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  createdAt?: string;
  updatedAt?: string;
}

export interface IAssignedProduct {
  productId?: string;
  sku: string;
  barcode: string;
  name: string;
  quantity: number;
}

export interface IBin {
  _id: string;
  warehouseId: string;
  rowCode: string;
  binCode: string;
  orderIndex: number;
  capacity: number;
  currentOccupancy: number;
  status: 'empty' | 'available' | 'nearly_full' | 'full';
  assignedProducts: IAssignedProduct[];
}

export interface IRowGroup {
  rowCode: string;
  orderIndex: number;
  capacity: number;
  currentOccupancy: number;
  occupancyRate: number;
  status: string;
  bins: IBin[];
}

export interface IWarehouseStats {
  totalCapacity: number;
  currentOccupancy: number;
  occupancyRate: number;
  totalRows: number;
  totalBins: number;
  occupiedBins: number;
  availableBins: number;
  fullBins: number;
}

export interface IOrderItem {
  productId: string;
  barcode: string;
  name: string;
  sku: string;
  quantity: number;
  location: {
    warehouseId: string;
    row: string;
    bin: string;
  };
  isPicked: boolean;
  pickedAt?: string;
  scannedBarcode?: string;
}

export interface IOrder {
  _id: string;
  orderId: string;
  customerName: string;
  customerEmail?: string;
  destination: string;
  items: IOrderItem[];
  status: 'Pending' | 'Picking' | 'Picked' | 'Ready for Dispatch' | 'Dispatched';
  priority: 'Standard' | 'High' | 'Express';
  createdAt: string;
  pickedAt?: string;
  dispatchedAt?: string;
}

export interface IInventoryTransaction {
  _id: string;
  product: string;
  productName: string;
  barcode: string;
  sku: string;
  type: 'INWARD' | 'PICK' | 'ADJUSTMENT' | 'TRANSFER' | 'OUTWARD';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  location: {
    row: string;
    bin: string;
  };
  referenceOrder?: string;
  timestamp: string;
}

export interface IActivityLog {
  _id: string;
  eventType:
    | 'PRODUCT_ADDED'
    | 'PRODUCT_SCANNED'
    | 'LOCATION_ASSIGNED'
    | 'ORDER_CREATED'
    | 'PRODUCT_PICKED'
    | 'WRONG_BARCODE_SCANNED'
    | 'INVENTORY_UPDATED'
    | 'ORDER_DISPATCHED'
    | 'ROW_ACTIVATED'
    | 'SYSTEM_ALERT';
  title: string;
  description: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface IRestockInsight {
  sku: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  suggestedReorderQuantity: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  reason: string;
}

export interface IWarehouseInsights {
  summary: string;
  restockRecommendations: IRestockInsight[];
  slottingAdvice: string[];
  throughputTip: string;
  source: 'gemini-ai' | 'deterministic-heuristics';
}

export interface IAnalyticsData {
  summary: {
    totalProducts: number;
    totalInventoryUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalOrders: number;
    pendingOrders: number;
    pickingOrders: number;
    pickedOrders: number;
    readyForDispatchOrders: number;
    dispatchedOrders: number;
    warehouseCapacity: number;
    warehouseOccupancy: number;
    warehouseOccupancyRate: number;
    totalBins: number;
    availableBins: number;
    occupiedBins: number;
    mispickAttemptsPrevented: number;
    successfulPicks: number;
    pickingAccuracy: number;
  };
  inventoryByCategory: { name: string; skus: number; units: number }[];
  rowStats: { row: string; occupancy: number; capacity: number; occupancyRate: number; binsCount: number }[];
  ordersByStatus: { status: string; count: number; fill: string }[];
  lowStockList: {
    id: string;
    name: string;
    sku: string;
    barcode: string;
    quantity: number;
    minimumStock: number;
    location: string;
    status: 'low_stock' | 'out_of_stock';
  }[];
  recentTransactions: IInventoryTransaction[];
  aiInsights: IWarehouseInsights;
}

export interface IAllocationResult {
  warehouseId: string;
  row: string;
  bin: string;
  binCode: string;
  capacity: number;
  newOccupancy: number;
  reason: string;
  isNewRowCreated: boolean;
}
