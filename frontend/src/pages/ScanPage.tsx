import React, { useState, useEffect } from 'react';
import {
  Camera,
  Scan,
  Package,
  MapPin,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers,
  KeyRound,
  RefreshCw,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { IProduct, IBin, IAllocationResult } from '../types.js';
import { api } from '../services/api.js';
import { CameraScannerModal } from '../components/CameraScannerModal.js';
import { BarcodeRenderer } from '../components/BarcodeRenderer.js';

export const ScanPage: React.FC = () => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isInwarding, setIsInwarding] = useState(false);

  // Scan Result State
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [foundProduct, setFoundProduct] = useState<IProduct | null>(null);
  const [assignedBin, setAssignedBin] = useState<IBin | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);

  // Inward existing product form state
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockSuccess, setRestockSuccess] = useState<string | null>(null);

  // New product registration form state
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCategory, setNewCategory] = useState('Electronics');
  const [newQty, setNewQty] = useState<number>(20);
  const [newMinStock, setNewMinStock] = useState<number>(10);
  const [newPrice, setNewPrice] = useState<number>(39.99);
  const [newDesc, setNewDesc] = useState('');
  const [allocationSuccess, setAllocationSuccess] = useState<IAllocationResult | null>(null);


  const handleLookupBarcode = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setIsSearching(true);
    setScannedBarcode(cleanCode);
    setRestockSuccess(null);
    setAllocationSuccess(null);

    try {
      const res = await api.scanBarcode(cleanCode);
      if (res.success && res.found && res.product) {
        setFoundProduct(res.product);
        setAssignedBin(res.bin || null);
        setIsNewProduct(false);
      } else {
        setFoundProduct(null);
        setAssignedBin(null);
        setIsNewProduct(true);
        // Pre-populate suggested SKU
        setNewSku(`SKU-${cleanCode.slice(-4).toUpperCase()}`);
        setNewName('');
      }
    } catch (err: any) {
      alert('Error querying barcode: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInwardExisting = async () => {
    if (!foundProduct || !scannedBarcode || restockQty <= 0) return;

    setIsInwarding(true);
    setRestockSuccess(null);
    try {
      const res = await api.inwardStock({
        barcode: scannedBarcode,
        quantity: Number(restockQty),
      });

      if (res.success && res.product) {
        setFoundProduct(res.product);
        setRestockSuccess(
          `Successfully inwarded ${restockQty} units! New quantity is ${res.product.quantity} units.`
        );
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
        // refresh bin
        const scanRes = await api.scanBarcode(scannedBarcode);
        if (scanRes.bin) setAssignedBin(scanRes.bin);
      }
    } catch (err: any) {
      alert('Inward error: ' + err.message);
    } finally {
      setIsInwarding(false);
    }
  };

  const handleRegisterNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedBarcode || !newName.trim() || !newSku.trim()) return;

    setIsInwarding(true);
    try {
      const res = await api.createProduct({
        barcode: scannedBarcode,
        name: newName.trim(),
        sku: newSku.trim(),
        category: newCategory,
        quantity: Number(newQty),
        minimumStock: Number(newMinStock),
        unitPrice: Number(newPrice),
        description: newDesc,
      });

      if (res.success && res.product && res.allocation) {
        setFoundProduct(res.product);
        setAllocationSuccess(res.allocation);
        setIsNewProduct(false);
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
        });
        // refresh bin
        const scanRes = await api.scanBarcode(scannedBarcode);
        if (scanRes.bin) setAssignedBin(scanRes.bin);
      } else {
        alert(res.message || 'Product creation failed.');
      }
    } catch (err: any) {
      alert('Registration error: ' + err.message);
    } finally {
      setIsInwarding(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
            Intake & Receiving Bay
          </span>
          <span className="text-xs text-slate-500 font-medium">Barcode Scanning & Smart Slotting</span>
        </div>
        <h1 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          Scan & Inward Inventory
        </h1>
        <p className="text-xs text-slate-500 max-w-2xl mt-0.5 leading-relaxed">
          Scan a barcode or enter it manually to identify inventory and assign the optimal storage bin.
        </p>
      </div>

      {/* Main Barcode Intake Box */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-xs"
          >
            <Camera className="h-4 w-4" /> Launch Camera Scanner
          </button>

          <div className="relative flex-1">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLookupBarcode(barcodeInput);
              }}
              placeholder="Or enter barcode manually (e.g. 8901001001)..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {barcodeInput && (
              <button
                type="button"
                onClick={() => setBarcodeInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={!barcodeInput.trim() || isSearching}
            onClick={() => handleLookupBarcode(barcodeInput)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-xs"
          >
            {isSearching ? <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" /> : <Scan className="h-4 w-4" />}
            Lookup Barcode
          </button>
        </div>
      </div>

      {/* RESULT 1: Existing Product Identified */}
      {foundProduct && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Product Identified
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Barcode: {foundProduct.barcode}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{foundProduct.name}</h2>
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mt-0.5">
                  <span>SKU: <strong className="text-slate-800">{foundProduct.sku}</strong></span>
                  <span>•</span>
                  <span>Category: <strong className="text-slate-800">{foundProduct.category}</strong></span>
                  <span>•</span>
                  <span>Unit Price: <strong className="text-slate-800">${foundProduct.unitPrice.toFixed(2)}</strong></span>
                </div>
              </div>
            </div>

            {/* Visual Barcode */}
            <div className="shrink-0 flex flex-col items-center p-2 rounded border border-slate-200 bg-white">
              <BarcodeRenderer value={foundProduct.barcode} width={160} height={38} showText={true} />
            </div>
          </div>

          {/* Allocation & Location Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Storage Location Hero */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Assigned Storage Slot
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {foundProduct.location.row} → <span className="text-emerald-700">Bin {foundProduct.location.bin}</span>
                  </h3>
                </div>
              </div>

              {assignedBin && (
                <div className="mt-2.5 rounded-lg bg-white p-2.5 border border-emerald-100 text-xs space-y-1.5 shadow-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Bin Occupancy:</span>
                    <strong className="text-slate-900">
                      {assignedBin.currentOccupancy} / {assignedBin.capacity} units
                    </strong>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (assignedBin.currentOccupancy / assignedBin.capacity) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Remaining capacity in this bin:{' '}
                    <strong className="text-emerald-700">
                      {assignedBin.capacity - assignedBin.currentOccupancy} units
                    </strong>
                  </p>
                </div>
              )}
            </div>

            {/* Current Stock Metrics */}
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-xs font-semibold text-slate-500">Inventory Status</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-900">{foundProduct.quantity}</span>
                  <span className="text-xs text-slate-500">units available</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold border ${
                      foundProduct.quantity <= 0
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : foundProduct.quantity <= foundProduct.minimumStock
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {foundProduct.quantity <= 0
                      ? 'Out of Stock'
                      : foundProduct.quantity <= foundProduct.minimumStock
                      ? `Low Stock (Min: ${foundProduct.minimumStock})`
                      : 'Stock Optimal'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Every inward scan updates MongoDB, writes an immutable transaction log, and adjusts bin occupancy.
              </p>
            </div>
          </div>

          {/* Quick Restock / Inward Action */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Inward Stock (Add to Warehouse Inventory)
            </h3>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
                {[5, 10, 25, 50].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setRestockQty(qty)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                      restockQty === qty ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    +{qty}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Custom Qty:</span>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={isInwarding}
                onClick={handleInwardExisting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-xs"
              >
                <Plus className="h-4 w-4" />
                {isInwarding ? 'Processing Inward...' : `Inward +${restockQty} Units`}
              </button>
            </div>

            {restockSuccess && (
              <div className="mt-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 animate-in fade-in duration-150 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{restockSuccess}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESULT 2: Unregistered Product */}
      {isNewProduct && scannedBarcode && (
        <div className="rounded-xl border border-amber-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                  New Unregistered SKU
                </span>
                <span className="text-xs text-slate-500 font-mono">Scanned Barcode: {scannedBarcode}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">Register New Product with Smart Slotting</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                This barcode was not found in the database. Enter product details below and let StockPilot's
                algorithm automatically calculate the optimal warehouse aisle and bin!
              </p>
            </div>
          </div>

          <form onSubmit={handleRegisterNewProduct} className="mt-4 space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. 4K Ultra-Wide Monitor Arm"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Code *</label>
                <input
                  type="text"
                  required
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                  placeholder="e.g. ACC-ARM-99"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 uppercase placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Audio">Audio</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Office">Office</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Home">Home</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Inward Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newQty}
                  onChange={(e) => setNewQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Low Stock Threshold</label>
                <input
                  type="number"
                  min="1"
                  value={newMinStock}
                  onChange={(e) => setNewMinStock(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600 flex items-start gap-2">
              <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Smart Slotting Algorithm:</strong> StockPilot will evaluate Row A first (closest to intake bay).
                If Row A bins have sufficient capacity, it will assign the lowest index available bin. If Row A is full,
                it cascades to Row B or Row C, or automatically commissions a new aisle!
              </span>
            </div>

            <button
              type="submit"
              disabled={isInwarding}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Sparkles className="h-4 w-4" />
              {isInwarding ? 'Allocating Optimal Bin...' : 'Run Smart Bin Allocation & Inward'}
            </button>
          </form>
        </div>
      )}

      {/* Allocation Success Banner */}
      {allocationSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Smart Slot Allocation Complete!</h3>
              <p className="text-xs text-emerald-800">{allocationSuccess.reason}</p>
              <div className="mt-1.5 flex items-center gap-2 text-xs font-mono text-emerald-800">
                <span className="rounded bg-white px-2 py-0.5 border border-emerald-200 shadow-xs">
                  Assigned Location: {allocationSuccess.row} → Bin {allocationSuccess.bin}
                </span>
                <span className="rounded bg-white px-2 py-0.5 border border-emerald-200 shadow-xs">
                  New Bin Occupancy: {allocationSuccess.newOccupancy} / {allocationSuccess.capacity}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={(code) => {
          setBarcodeInput(code);
          handleLookupBarcode(code);
        }}
        title="Scan Barcode to Inward"
      />
    </div>
  );
};
