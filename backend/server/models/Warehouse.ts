import mongoose, { Schema, Model } from 'mongoose';

export interface IWarehouse {
  warehouseId: string;
  name: string;
  code: string;
  totalCapacity: number;
  currentOccupancy: number;
  rowsCount: number;
  status: 'active' | 'maintenance';
  createdAt?: Date;
  updatedAt?: Date;
}

const WarehouseSchema = new Schema<IWarehouse>(
  {
    warehouseId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    totalCapacity: { type: Number, default: 1000 },
    currentOccupancy: { type: Number, default: 0 },
    rowsCount: { type: Number, default: 3 },
    status: { type: String, enum: ['active', 'maintenance'], default: 'active' },
  },
  { timestamps: true }
);

export const Warehouse: Model<IWarehouse> =
  (mongoose.models.Warehouse as Model<IWarehouse>) ||
  mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
