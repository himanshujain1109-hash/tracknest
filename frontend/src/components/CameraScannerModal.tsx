import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  X,
  Check,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from 'html5-qrcode';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  expectedBarcode?: string;
  expectedProductName?: string;
}

const READER_ID = 'stockpilot-camera-reader';

export const CameraScannerModal: React.FC<
  CameraScannerModalProps
> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Product Barcode',
  expectedBarcode,
  expectedProductName,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [starting, setStarting] = useState(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanHandledRef = useRef(false);

  const stopCamera = async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      setActive(false);
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (err) {
      console.warn('Unable to stop camera:', err);
    }

    try {
      scanner.clear();
    } catch {
      // Ignore cleanup errors.
    }

    scannerRef.current = null;
    setActive(false);
  };

  const startCamera = async () => {
    if (starting || active) {
      return;
    }

    setStarting(true);
    setError('');
    scanHandledRef.current = false;

    try {
      if (!window.isSecureContext) {
        throw new Error(
          'Camera access requires HTTPS.'
        );
      }

      const reader = document.getElementById(READER_ID);

      if (!reader) {
        throw new Error(
          'Camera container was not found.'
        );
      }

      reader.innerHTML = '';

      const scanner = new Html5Qrcode(READER_ID, {
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
        {
          facingMode: {
            ideal: 'environment',
          },
        },
        {
          fps: 10,
          qrbox: {
            width: 280,
            height: 160,
          },
          aspectRatio: 1.7777778,
          disableFlip: false,
        },
        async (decodedText) => {
          if (scanHandledRef.current) {
            return;
          }

          scanHandledRef.current = true;

          const code = decodedText.trim();

          if (!code) {
            scanHandledRef.current = false;
            return;
          }

          await stopCamera();

          onScan(code);
          onClose();
        },
        () => {
          // Normal barcode frame miss.
        }
      );

      const video =
        document.querySelector(
          `#${READER_ID} video`
        ) as HTMLVideoElement | null;

      if (video) {
        video.setAttribute(
          'playsinline',
          'true'
        );

        video.setAttribute(
          'autoplay',
          'true'
        );

        video.muted = true;

        video.style.display = 'block';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.minHeight = '280px';
        video.style.maxHeight = '420px';
        video.style.objectFit = 'cover';
        video.style.background = '#000';

        try {
          await video.play();
        } catch {
          // Browser may already be playing the stream.
        }
      }

      setActive(true);
    } catch (err: any) {
      console.error('Camera error:', err);

      await stopCamera();

      const message = String(
        err?.message || err || ''
      );

      if (
        /permission|denied|notallowed/i.test(
          message
        )
      ) {
        setError(
          'Camera permission was denied. Allow camera access in your browser settings and try again.'
        );
      } else if (
        /secure|https|insecure/i.test(message)
      ) {
        setError(
          'Camera access requires HTTPS. Open the Vercel website using HTTPS.'
        );
      } else {
        setError(
          'Unable to access the camera. Check browser permissions or use manual barcode entry.'
        );
      }
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      void stopCamera();
      setManualCode('');
      setError('');
      setStarting(false);
      return;
    }

    return () => {
      void stopCamera();
    };
  }, [isOpen]);

  const handleManualSubmit = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    const code = manualCode.trim();

    if (!code) {
      return;
    }

    void stopCamera();

    onScan(code);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
              <Camera className="h-5 w-5 text-emerald-400" />
            </div>

            <div>
              <h3 className="text-lg font-semibold">
                {title}
              </h3>

              <p className="text-xs text-slate-400">
                Scan a product barcode using your camera.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              void stopCamera();
              onClose();
            }}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Close scanner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Expected product */}
        {expectedBarcode && (
          <div className="mx-5 mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                  Target Item
                </p>

                <p className="text-sm font-medium text-slate-200">
                  {expectedProductName || 'Product'}
                </p>

                <p className="mt-1 font-mono text-xs text-amber-200">
                  Expected: {expectedBarcode}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Camera */}
        <div className="mx-5 mt-4 overflow-hidden rounded-xl border border-slate-700 bg-black">

          <div
            id={READER_ID}
            className="relative w-full overflow-hidden bg-black"
            style={{
              minHeight: '280px',
            }}
          />

          {!active && (
            <div className="flex min-h-[180px] flex-col items-center justify-center px-6 py-8 text-center">
              <div className="mb-4 rounded-full border border-slate-700 bg-slate-800 p-4">
                <Camera className="h-8 w-8 text-slate-400" />
              </div>

              <p className="font-medium text-slate-200">
                {starting
                  ? 'Starting camera...'
                  : 'Camera ready'}
              </p>

              <p className="mt-1 max-w-sm text-xs text-slate-400">
                Allow camera permission when your browser asks.
              </p>

              {!starting && (
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  <Camera className="h-4 w-4" />
                  Start Camera
                </button>
              )}
            </div>
          )}

          {active && (
            <div className="flex items-center gap-2 border-t border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Camera active — point it at the barcode.
            </div>
          )}

          {error && (
            <div className="border-t border-rose-900/50 bg-rose-950/40 px-4 py-3 text-xs text-rose-300">
              {error}
            </div>
          )}
        </div>

        {/* Manual barcode */}
        <form
          onSubmit={handleManualSubmit}
          className="px-5 pb-5 pt-4"
        >
          <label className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-300">
            <KeyRound className="h-3.5 w-3.5 text-slate-400" />
            Manual barcode
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(event) =>
                setManualCode(event.target.value)
              }
              placeholder="Enter barcode"
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2.5 font-mono text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
            />

            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="mr-1 inline h-4 w-4" />
              Use Code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
