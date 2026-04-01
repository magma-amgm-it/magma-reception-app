import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const SCANNER_ELEMENT_ID = 'magma-barcode-scanner';

export function useScanner() {
  const [lastScannedCode, setLastScannedCode] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = useCallback(async (elementId = SCANNER_ELEMENT_ID) => {
    try {
      setError(null);

      // Create scanner container if it doesn't exist yet
      if (!document.getElementById(elementId)) {
        const container = document.createElement('div');
        container.id = elementId;
        document.body.appendChild(container);
      }

      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // Prefer rear camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          setLastScannedCode(decodedText);
        },
        () => {
          // QR code not found in frame — ignore, keep scanning
        }
      );

      setIsScanning(true);
    } catch (err) {
      const message =
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access to scan barcodes.'
          : err.name === 'NotFoundError'
            ? 'No camera found on this device.'
            : `Scanner error: ${err.message}`;
      setError(message);
      setIsScanning(false);
      console.error('Scanner start failed:', err);
    }
  }, []);

  const stopScanning = useCallback(async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
    } catch (err) {
      console.error('Scanner stop failed:', err);
    } finally {
      setIsScanning(false);
    }
  }, []);

  return {
    startScanning,
    stopScanning,
    lastScannedCode,
    isScanning,
    error,
  };
}
