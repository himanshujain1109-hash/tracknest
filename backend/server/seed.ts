import { connectDB } from './db.js';
import { Warehouse } from './models/Warehouse.js';
import { Row } from './models/Row.js';
import { Bin } from './models/Bin.js';
import { Product } from './models/Product.js';
import { Order } from './models/Order.js';
import { InventoryTransaction } from './models/InventoryTransaction.js';
import { ActivityLog } from './models/ActivityLog.js';
import { calculateBinStatus } from './services/allocationService.js';

export async function seedDatabase(force: boolean = false) {
  await connectDB();

  const existingProducts = await Product.countDocuments();
  if (existingProducts > 0 && !force) {
    console.log(`Database already seeded (${existingProducts} products found). Skipping seed.`);
    return { status: 'already_seeded', productCount: existingProducts };
  }

  console.log('Seeding StockPilot MongoDB database with realistic warehouse dataset...');

  // Clear existing collections
  await Promise.all([
    Warehouse.deleteMany({}),
    Row.deleteMany({}),
    Bin.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    InventoryTransaction.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);

  const warehouseId = 'WH-01';

  // 1. Create Warehouse
  const warehouse = await Warehouse.create({
    warehouseId,
    name: 'StockPilot Hub 1 - E-Commerce Distribution Center',
    code: 'WH-01',
    totalCapacity: 1200,
    currentOccupancy: 0,
    rowsCount: 3,
    status: 'active',
  });

  // 2. Create Rows (Row A, Row B, Row C)
  const rowsData = [
    { warehouseId, rowCode: 'Row A', orderIndex: 1, capacity: 300, currentOccupancy: 0, binsCount: 6, status: 'active' },
    { warehouseId, rowCode: 'Row B', orderIndex: 2, capacity: 300, currentOccupancy: 0, binsCount: 6, status: 'active' },
    { warehouseId, rowCode: 'Row C', orderIndex: 3, capacity: 300, currentOccupancy: 0, binsCount: 6, status: 'active' },
  ];
  await Row.insertMany(rowsData);

  // 3. Create Bins (A01-A06, B01-B06, C01-C06)
  const binsToInsert = [];
  const rowLetters = ['A', 'B', 'C'];
  for (const letter of rowLetters) {
    for (let i = 1; i <= 6; i++) {
      const binNum = i < 10 ? `0${i}` : `${i}`;
      binsToInsert.push({
        warehouseId,
        rowCode: `Row ${letter}`,
        binCode: `${letter}${binNum}`,
        orderIndex: i,
        capacity: 50,
        currentOccupancy: 0,
        status: 'empty',
        assignedProducts: [],
      });
    }
  }
  await Bin.insertMany(binsToInsert);

  // 4. Products Master Data (Realistic Barcodes & Quantities)
  // Notice: Wireless Mouse is in Row B -> Bin B04, exactly as highlighted in user prompt workflow!
  const productsMaster = [
    {
      name: 'Wireless Ergonomic Mouse',
      sku: 'ELEC-MOU-01',
      barcode: '8901001001',
      category: 'Electronics',
      quantity: 28,
      minimumStock: 10,
      unitPrice: 24.99,
      description: '2.4GHz rechargeable wireless optical mouse with ergonomic palm contour.',
      location: { warehouseId, row: 'Row B', bin: 'B04' },
    },
    {
      name: 'Mechanical Gaming Keyboard RGB',
      sku: 'ELEC-KEY-02',
      barcode: '8901001002',
      category: 'Electronics',
      quantity: 18,
      minimumStock: 8,
      unitPrice: 79.99,
      description: 'Tenkeyless tactile mechanical switches with per-key RGB backlighting.',
      location: { warehouseId, row: 'Row B', bin: 'B02' },
    },
    {
      name: 'USB-C Fast Charging Hub 7-in-1',
      sku: 'ELEC-HUB-03',
      barcode: '8901001003',
      category: 'Electronics',
      quantity: 35,
      minimumStock: 12,
      unitPrice: 39.5,
      description: 'Multi-port aluminum adapter with HDMI 4K 60Hz and 100W PD delivery.',
      location: { warehouseId, row: 'Row A', bin: 'A01' },
    },
    {
      name: 'Noise-Cancelling Wireless Headphones',
      sku: 'AUD-HDP-04',
      barcode: '8901001004',
      category: 'Audio',
      quantity: 4, // LOW STOCK
      minimumStock: 10,
      unitPrice: 129.0,
      description: 'Hybrid active noise cancellation with 40-hour battery stamina.',
      location: { warehouseId, row: 'Row A', bin: 'A03' },
    },
    {
      name: 'Braided Thunderbolt 4 Cable 2m',
      sku: 'ACC-TBL-05',
      barcode: '8901001005',
      category: 'Accessories',
      quantity: 45,
      minimumStock: 15,
      unitPrice: 19.99,
      description: '40Gbps high-speed data transfer & 240W EPR charging cable.',
      location: { warehouseId, row: 'Row A', bin: 'A02' },
    },
    {
      name: 'Adjustable Aluminum Laptop Stand',
      sku: 'OFF-LST-06',
      barcode: '8901001006',
      category: 'Office',
      quantity: 22,
      minimumStock: 10,
      unitPrice: 34.0,
      description: 'Foldable dual-pivot riser supporting 11-17 inch laptops.',
      location: { warehouseId, row: 'Row B', bin: 'B01' },
    },
    {
      name: 'Smart 4K Web Camera 60FPS',
      sku: 'ELEC-CAM-07',
      barcode: '8901001007',
      category: 'Electronics',
      quantity: 3, // LOW STOCK
      minimumStock: 10,
      unitPrice: 89.99,
      description: 'Ultra HD sensor with auto-framing and dual stereo microphones.',
      location: { warehouseId, row: 'Row A', bin: 'A04' },
    },
    {
      name: 'Extended Anti-Fray Desk Mat',
      sku: 'OFF-MAT-08',
      barcode: '8901001008',
      category: 'Office',
      quantity: 40,
      minimumStock: 15,
      unitPrice: 16.5,
      description: '900x400mm waterproof micro-weave cloth with non-slip rubber base.',
      location: { warehouseId, row: 'Row B', bin: 'B03' },
    },
    {
      name: 'Smart WiFi LED Desk Lamp',
      sku: 'HOM-LMP-09',
      barcode: '8901001009',
      category: 'Home & Office',
      quantity: 14,
      minimumStock: 8,
      unitPrice: 42.0,
      description: 'Stepless dimming with wireless QI charging pad in the base.',
      location: { warehouseId, row: 'Row C', bin: 'C01' },
    },
    {
      name: 'Thermal Barcode Label Printer',
      sku: 'LOG-PRN-10',
      barcode: '8901001010',
      category: 'Hardware',
      quantity: 8,
      minimumStock: 5,
      unitPrice: 145.0,
      description: 'Direct thermal 4x6 shipping and warehouse bin label generator.',
      location: { warehouseId, row: 'Row C', bin: 'C02' },
    },
    {
      name: 'Magnetic Cable Organizer Clips (5-pk)',
      sku: 'ACC-ORG-11',
      barcode: '8901001011',
      category: 'Accessories',
      quantity: 48,
      minimumStock: 20,
      unitPrice: 9.99,
      description: 'Reusable silicone magnetic cable ties and desk wire holders.',
      location: { warehouseId, row: 'Row A', bin: 'A05' },
    },
    {
      name: 'Compact Cordless Barcode Scanner 2D',
      sku: 'LOG-SCN-12',
      barcode: '8901001012',
      category: 'Hardware',
      quantity: 0, // OUT OF STOCK
      minimumStock: 6,
      unitPrice: 65.0,
      description: 'Bluetooth & 2.4G rugged warehouse QR and 1D barcode reader.',
      location: { warehouseId, row: 'Row C', bin: 'C03' },
    },
    {
      name: 'High-Speed NVMe M.2 Enclosure',
      sku: 'ELEC-SSD-13',
      barcode: '8901001013',
      category: 'Electronics',
      quantity: 26,
      minimumStock: 10,
      unitPrice: 27.99,
      description: 'Tool-free 10Gbps USB 3.2 Gen 2 aluminum heatsink casing.',
      location: { warehouseId, row: 'Row B', bin: 'B05' },
    },
    {
      name: 'Ergonomic Memory Foam Wrist Rest',
      sku: 'OFF-WRS-14',
      barcode: '8901001014',
      category: 'Office',
      quantity: 5, // LOW STOCK
      minimumStock: 12,
      unitPrice: 14.99,
      description: 'Relieves carpal tunnel pressure with cooling gel layer.',
      location: { warehouseId, row: 'Row B', bin: 'B06' },
    },
  ];

  const createdProducts = await Product.insertMany(productsMaster);

  // Update Bins and Rows with initial product assignments
  let totalOccupancy = 0;
  for (const prod of createdProducts) {
    totalOccupancy += prod.quantity;
    const bin = await Bin.findOne({ warehouseId, binCode: prod.location.bin });
    if (bin) {
      bin.assignedProducts.push({
        productId: prod._id,
        sku: prod.sku,
        barcode: prod.barcode,
        name: prod.name,
        quantity: prod.quantity,
      });
      bin.currentOccupancy += prod.quantity;
      bin.status = calculateBinStatus(bin.currentOccupancy, bin.capacity);
      await bin.save();

      await Row.findOneAndUpdate(
        { warehouseId, rowCode: bin.rowCode },
        { $inc: { currentOccupancy: prod.quantity } }
      );
    }

    // Create Initial Inward Transaction
    await InventoryTransaction.create({
      product: prod._id,
      productName: prod.name,
      barcode: prod.barcode,
      sku: prod.sku,
      type: 'INWARD',
      quantity: prod.quantity,
      previousQuantity: 0,
      newQuantity: prod.quantity,
      reason: 'Initial warehouse intake and smart bin slotting',
      location: { row: prod.location.row, bin: prod.location.bin },
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 3),
    });
  }

  await Warehouse.findOneAndUpdate({ warehouseId }, { currentOccupancy: totalOccupancy });

  // 5. Create Sample Orders
  const mouseProd = createdProducts.find((p) => p.barcode === '8901001001')!;
  const kbProd = createdProducts.find((p) => p.barcode === '8901001002')!;
  const hubProd = createdProducts.find((p) => p.barcode === '8901001003')!;
  const matProd = createdProducts.find((p) => p.barcode === '8901001008')!;
  const headpProd = createdProducts.find((p) => p.barcode === '8901001004')!;

  const ordersData = [
    {
      orderId: 'SP1001',
      customerName: 'Marcus Vance',
      customerEmail: 'm.vance@techfleet.io',
      destination: 'Bay 4 - Priority Express Courier',
      priority: 'Express',
      status: 'Pending',
      items: [
        {
          productId: mouseProd._id,
          barcode: mouseProd.barcode,
          name: mouseProd.name,
          sku: mouseProd.sku,
          quantity: 2,
          location: mouseProd.location,
          isPicked: false,
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 2),
    },
    {
      orderId: 'SP1002',
      customerName: 'Avery Chen',
      customerEmail: 'avery.c@designlab.org',
      destination: 'Bay 2 - Ground Shipping',
      priority: 'High',
      status: 'Picking',
      items: [
        {
          productId: kbProd._id,
          barcode: kbProd.barcode,
          name: kbProd.name,
          sku: kbProd.sku,
          quantity: 1,
          location: kbProd.location,
          isPicked: true,
          pickedAt: new Date(Date.now() - 1800000),
          scannedBarcode: kbProd.barcode,
        },
        {
          productId: hubProd._id,
          barcode: hubProd.barcode,
          name: hubProd.name,
          sku: hubProd.sku,
          quantity: 2,
          location: hubProd.location,
          isPicked: false,
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 5),
    },
    {
      orderId: 'SP1003',
      customerName: 'Devon Miller',
      customerEmail: 'dmiller@hyperops.net',
      destination: 'Bay 1 - Same-Day Van',
      priority: 'Standard',
      status: 'Ready for Dispatch',
      items: [
        {
          productId: matProd._id,
          barcode: matProd.barcode,
          name: matProd.name,
          sku: matProd.sku,
          quantity: 1,
          location: matProd.location,
          isPicked: true,
          pickedAt: new Date(Date.now() - 7200000),
          scannedBarcode: matProd.barcode,
        },
      ],
      pickedAt: new Date(Date.now() - 7200000),
      createdAt: new Date(Date.now() - 3600000 * 8),
    },
    {
      orderId: 'SP1004',
      customerName: 'Elena Rostova',
      customerEmail: 'elena@vanguard.co',
      destination: 'Bay 3 - Regional Freight',
      priority: 'Standard',
      status: 'Dispatched',
      items: [
        {
          productId: headpProd._id,
          barcode: headpProd.barcode,
          name: headpProd.name,
          sku: headpProd.sku,
          quantity: 1,
          location: headpProd.location,
          isPicked: true,
          pickedAt: new Date(Date.now() - 86400000),
          scannedBarcode: headpProd.barcode,
        },
      ],
      pickedAt: new Date(Date.now() - 86400000),
      dispatchedAt: new Date(Date.now() - 82000000),
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
  ];

  await Order.insertMany(ordersData);

  // 6. Create Realistic Activity Logs
  const initialLogs = [
    {
      eventType: 'SYSTEM_ALERT',
      title: 'Warehouse System Initialized',
      description: 'StockPilot online. 3 storage aisles (Rows A-C) mapped with 18 high-density dynamic storage bins.',
      severity: 'info',
      timestamp: new Date(Date.now() - 86400000 * 3),
    },
    {
      eventType: 'PRODUCT_ADDED',
      title: 'Bulk Intake Processed',
      description: '14 product SKUs received, cataloged with high-resolution 1D/2D barcodes.',
      severity: 'success',
      timestamp: new Date(Date.now() - 86400000 * 2),
    },
    {
      eventType: 'LOCATION_ASSIGNED',
      title: 'Smart Bin Assigned',
      description: 'Assigned "Wireless Ergonomic Mouse" to Row B → Bin B04 based on proximity routing.',
      severity: 'success',
      timestamp: new Date(Date.now() - 3600000 * 12),
    },
    {
      eventType: 'ORDER_CREATED',
      title: 'Order SP1001 Ingested',
      description: 'Customer Marcus Vance placed express order for 2x Wireless Ergonomic Mouse.',
      severity: 'info',
      timestamp: new Date(Date.now() - 3600000 * 2),
    },
    {
      eventType: 'WRONG_BARCODE_SCANNED',
      title: 'Mispick Attempt Intercepted',
      description: 'Picker scanned keyboard barcode for mouse order item. StockPilot error-prevention blocked pick.',
      severity: 'error',
      timestamp: new Date(Date.now() - 3600000),
    },
  ];

  await ActivityLog.insertMany(initialLogs);

  console.log('StockPilot database seed completed successfully!');
  return {
    status: 'success',
    productsCount: createdProducts.length,
    ordersCount: ordersData.length,
    binsCount: binsToInsert.length,
  };
}

// Standalone execution support: tsx server/seed.ts
if (process.argv[1]?.includes('seed')) {
  seedDatabase(true)
    .then(() => {
      console.log('Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed script failure:', err);
      process.exit(1);
    });
}
