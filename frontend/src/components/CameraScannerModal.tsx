import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Check, AlertCircle, KeyRound } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  expectedBarcode?: string;
  expectedProductName?: string;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Product Barcode',
  expectedBarcode,
  expectedProductName,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerElementId = 'stockpilot-camera-reader';

  const stopCamera = async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      setIsCameraActive(false);
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (error) {
      console.warn('Camera stop error:', error);
    } finally {
      try {
        scanner.clear();
      } catch {
        // The scanner may already have cleared its DOM.
      }
      scannerRef.current = null;
      setIsCameraActive(false);
    }
  };

  const startCamera = async () => {
    if (isStarting || isCameraActive) return;

    setCameraError(null);
    setIsStarting(true);

    try {
      // The reader must remain visible while html5-qrcode initializes.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const scanner = new Html5Qrcode(scannerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.7777778,
        },
        async (decodedText) => {
          await stopCamera();
          onScan(decodedText.trim());
          onClose();
        },
        () => {
          // Ignore normal frame-by-frame decode misses.
        }
      );

      setIsCameraActive(true);
    } catch (error: any) {
      console.warn('Camera initialization failed:', error);
      await stopCamera();

      const message = String(error?.message || error || '');
      if (/permission|denied|notallowed/i.test(message)) {
        setCameraError('Camera permission was denied. Allow camera access in your browser and try again.');
      } else if (/secure|https|insecure/i.test(message)) {
        setCameraError('Camera access requires HTTPS. Open the deployed site over HTTPS.');
      } else {
        setCameraError('Unable to start the camera. Check browser permissions and use manual barcode entry if needed.');
      }
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      void stopCamera();
      setManualCode('');
      setCameraError(null);
    }

    return () => {
      void stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    void stopCamera();
    onScan(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">{title}</h3>
              <p className="text-xs text-slate-400">Use your device camera or enter a barcode manually.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              void stopCamera();
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close scanner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {expectedBarcode && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Target Item</span>
                <p className="text-sm font-medium text-slate-200">{expectedProductName || 'Product'}</p>
                <p className="text-xs text-amber-200 font-mono">Expected: {expectedBarcode}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-700 bg-black">
          {/* Keep this element visible. Hiding it during scanner.start() can produce a blank/black camera view. */}
          <div
            id={scannerElementId}
            className="w-full min-h-[240px] bg-black"
            style={{ minHeight: 240 }}
          />

          {!isCameraActive && (
            <div className="flex flex-col items-center justify-center p-7 text-center">
              <div className="rounded-full bg-slate-800 p-4 text-slate-400 mb-3 border border-slate-700">
                <Camera className="h-8 w-8" />
              </div>
              <p className="text-sm text-slate-300 font-medium">
                {isStarting ? 'Starting camera…' : 'Camera ready'}
              </p>
              {!isStarting && (
                <>
                  <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">
                    Allow camera access when your browser asks for permission.
                  </p>
                  <button
                    type="button"
                    onClick={() => void startCamera()}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    <Camera className="h-4 w-4" /> Start Camera
                  </button>
                </>
              )}
            </div>
          )}

          {isCameraActive && (
            <div className="flex items-center gap-2 border-t border-slate-800 bg-slate-950 px-3 py-2 text-xs text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Camera active — point it at the barcode.
            </div>
          )}

          {cameraError && (
            <div className="border-t border-rose-900/50 bg-rose-950/40 p-3 text-xs text-rose-300">
              {cameraError}
            </div>
          )}
        </div>

        <form onSubmit={handleManualSubmit} className="mt-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-300">
            <KeyRound className="h-3.5 w-3.5 text-slate-400" /> Manual barcode
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter barcode"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
            >
              <Check className="mr-1 inline h-4 w-4" /> Use Code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
