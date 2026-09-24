// /src/presentation/components/fullscreen/QrCameraScanner.tsx
// Real camera QR capture (backend lane). Thin wrapper over html5-qrcode:
// rear camera, QR format only, 10 fps, stop after first valid read,
// stream always released on unmount. All parse/match logic lives outside
// (domain parseQrString + backend resolve) — this component only delivers
// the raw scanned string once, then stops.
// NOTE: getUserMedia needs a secure context (https/localhost). On plain-LAN
// http the start fails — the parent must keep manual paste as fallback.

import React, { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrCameraScannerProps {
  onScanned: (text: string) => void;
  onScanError: (message: string) => void;
}

export const QrCameraScanner: React.FC<QrCameraScannerProps> = ({ onScanned, onScanError }) => {
  const elementId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const onScannedRef = useRef(onScanned);
  const onScanErrorRef = useRef(onScanError);
  onScannedRef.current = onScanned;
  onScanErrorRef.current = onScanError;
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;
    (async () => {
      try {
        scanner = new Html5Qrcode(elementId, false);
        // Low-level start: fps + qrbox + rear camera. Format filtering is a
        // Html5QrcodeScanner (UI wrapper) feature — here every decoded text
        // goes through domain parseQrString, which rejects non-QR payloads
        // with operator-friendly errors.
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (cancelled) return;
            cancelled = true; // stop after first valid read
            onScannedRef.current(decodedText);
            scanner?.stop().catch(() => undefined);
          },
          undefined,
        );
        if (!cancelled) setStarting(false);
      } catch (err) {
        if (!cancelled) {
          onScanErrorRef.current(
            err instanceof Error && /permission|denied|NotAllowed/i.test(err.message)
              ? 'Akses kamera ditolak — gunakan tempel manual di bawah.'
              : 'Kamera tidak tersedia di perangkat ini — gunakan tempel manual di bawah.',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
      try {
        scanner?.clear();
      } catch {
        // ignore teardown errors
      }
    };
  }, [elementId]);

  return (
    <div>
      <div id={elementId} className="w-full overflow-hidden rounded-xl" />
      {starting && <p className="mt-1 text-[11px] font-mono opacity-70">Membuka kamera…</p>}
    </div>
  );
};
