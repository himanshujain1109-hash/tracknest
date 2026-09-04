import { Router } from 'express';
import { Product } from '../models/Product.js';
import { Bin } from '../models/Bin.js';
import { Row } from '../models/Row.js';
import { Warehouse } from '../models/Warehouse.js';
import { InventoryTransaction } from '../models/InventoryTransaction.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { allocateBinForProduct } from '../services/allocationService.js';

const router = Router();

// POST /api/scan - identify product from barcode scan
router.post('/', async (req, res) => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ success: false, message: 'Barcode is required.' });
    }

    const cleanBarcode = String(barcode).trim();
    const product = await Product.findOne({ barcode: cleanBarcode });

    if (!product) {
      return res.status(404).json({
        success: false,
        found: false,
        barcode: cleanBarcode,
        message: `No product found matching barcode "${cleanBarcode}". You can register and slot it now.`,
      });
    }

    const bin = await Bin.findOne({ binCode: product.location.bin });

    // Log scan event
    await ActivityLog.create({
      eventType: 'PRODUCT_SCANNED',
      title: 'Barcode Scanned',
      description: `Scanned barcode ${cleanBarcode} for "${product.name}". Located at ${product.location.row} → Bin ${product.location.bin}.`,
      severity: 'info',
      metadata: { barcode: cleanBarcode, sku: product.sku, bin: product.location.bin },
    });

    res.json({
      success: true,
      found: true,
      product,
      bin,
      message: `Product identified: ${product.name}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/scan/inward - restock or add new stock via barcode
router.post('/inward', async (req, res) => {
  try {
    const { barcode, quantity, name, sku, category, unitPrice, description } = req.body;

    if (!barcode) {
      return res.status(400).json({ success: false, message: 'Barcode is required.' });
    }

    const cleanBarcode = String(barcode).trim();
    const qtyNum = Number(quantity) || 1;

    let product = await Product.findOne({ barcode: cleanBarcode });

    if (product) {
      // Existing product: increase quantity
      const prevQty = product.quantity;
      product.quantity += qtyNum;
      await product.save();

      // Update Bin
      const bin = await Bin.findOne({ binCode: product.location.bin });
      if (bin) {
        bin.currentOccupancy += qtyNum;
        const pItem = bin.assignedProducts.find((p: any) => p.barcode === cleanBarcode);
        if (pItem) {
          pItem.quantity += qtyNum;
        } else {
          bin.assignedProducts.push({
            sku: product.sku,
            barcode: product.barcode,
            name: product.name,
            quantity: qtyNum,
          });
        }
        await bin.save();
        await Row.findOneAndUpdate({ rowCode: bin.rowCode }, { $inc: { currentOccupancy: qtyNum } });
        await Warehouse.findOneAndUpdate({ warehouseId: product.location.warehouseId }, { $inc: { currentOccupancy: qtyNum } });
      }

      await InventoryTransaction.create({
        product: product._id,
        productName: product.name,
        barcode: product.barcode,
        sku: product.sku,
        type: 'INWARD',
        quantity: qtyNum,
        previousQuantity: prevQty,
        newQuantity: product.quantity,
        reason: 'Restock via barcode scanner intake',
        location: { row: product.location.row, bin: product.location.bin },
      });

      await ActivityLog.create({
        eventType: 'INVENTORY_UPDATED',
        title: 'Stock Restocked via Scan',
        description: `Added ${qtyNum} units of "${product.name}" to ${product.location.row} → ${product.location.bin}.`,
        severity: 'success',
      });

      return res.json({
        success: true,
        product,
        message: `Successfully restocked ${qtyNum} units of "${product.name}".`,
      });
    }

    // New product intake: run smart bin allocation
    if (!name || !sku || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, SKU, and category are required to register a brand-new product.',
      });
    }

    const allocation = await allocateBinForProduct({
      productName: name,
      barcode: cleanBarcode,
      sku: sku.toUpperCase().trim(),
      quantity: qtyNum,
    });

    product = await Product.create({
      name: name.trim(),
      sku: sku.toUpperCase().trim(),
      barcode: cleanBarcode,
      category: category.trim(),
      quantity: qtyNum,
      minimumStock: 5,
      unitPrice: Number(unitPrice) || 19.99,
      description: description || '',
      location: {
        warehouseId: allocation.warehouseId,
        row: allocation.row,
        bin: allocation.binCode,
      },
    });

    await InventoryTransaction.create({
      product: product._id,
      productName: product.name,
      barcode: product.barcode,
      sku: product.sku,
      type: 'INWARD',
      quantity: qtyNum,
      previousQuantity: 0,
      newQuantity: qtyNum,
      reason: `Intake scan: ${allocation.reason}`,
      location: { row: allocation.row, bin: allocation.binCode },
    });

    res.status(201).json({
      success: true,
      product,
      allocation,
      message: `Product scanned, registered, and assigned to ${allocation.binCode}.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
