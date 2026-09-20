import { useEffect, useRef, useState, useCallback } from "react";
import {
  MultiFormatReader,
  HTMLCanvasElementLuminanceSource,
  HybridBinarizer,
  BinaryBitmap,
  DecodeHintType,
  BarcodeFormat,
  NotFoundException
} from "@zxing/library";

export type ScannerStatus = "idle" | "requesting" | "ready" | "scanning" | "error";

interface UseBarcodeScannerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onScan: (barcode: string, format?: string) => void;
  active?: boolean;
  cooldownMs?: number;
}

export function playBeep() {
  try {
    const windowObj = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const AudioContextClass = windowObj.AudioContext || windowObj.webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = 1200;
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    oscillator.stop(audioCtx.currentTime + 0.08);
  } catch (err) {
    console.warn("Could not play barcode detection beep:", err);
  }
}

interface NativeBarcodeDetector {
  detect: (image: HTMLCanvasElement) => Promise<Array<{ rawValue: string; format?: string }>>;
}

export function useBarcodeScanner({
  videoRef,
  onScan,
  active = true,
  cooldownMs = 2500
}: UseBarcodeScannerProps) {
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isNative, setIsNative] = useState<boolean>(false);

  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const activeScannerRef = useRef<boolean>(active);
  const lastScannedBarcodeRef = useRef<{ barcode: string; timestamp: number } | null>(null);
  const zxingReaderRef = useRef<MultiFormatReader | null>(null);
  const nativeDetectorRef = useRef<NativeBarcodeDetector | null>(null);

  useEffect(() => {
    activeScannerRef.current = active;
  }, [active]);

  useEffect(() => {
    const checkNativeSupport = async () => {
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          const DetectorClass = (window as unknown as { BarcodeDetector: { getSupportedFormats: () => Promise<string[]>; new (options: { formats: string[] }): NativeBarcodeDetector } }).BarcodeDetector;
          const supportedFormats = await DetectorClass.getSupportedFormats();
          if (supportedFormats && supportedFormats.length > 0) {
            nativeDetectorRef.current = new DetectorClass({
              formats: supportedFormats.filter((f: string) =>
                ["qr_code", "ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"].includes(f)
              )
            });
            setIsNative(true);
            console.log("[Scanner] Native BarcodeDetector initialized with formats:", supportedFormats);
            return;
          }
        } catch (e) {
          console.warn("[Scanner] Native BarcodeDetector initialization failed, using ZXing fallback.", e);
        }
      }

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new MultiFormatReader();
      reader.setHints(hints);
      zxingReaderRef.current = reader;
      setIsNative(false);
      console.log("[Scanner] ZXing MultiFormatReader initialized");
    };

    checkNativeSupport();
  }, []);

  const startCamera = useCallback(async () => {
    setStatus("requesting");
    setErrorMsg(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setStatus("scanning");
        console.log("[Scanner] Camera started successfully");
      } else {
        setStatus("error");
        setErrorMsg("Video element reference is missing");
      }
    } catch (err) {
      console.error("[Scanner] Camera access failed:", err);
      setStatus("error");
      const error = err as { name?: string; message?: string };
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setErrorMsg("Camera permission denied. Please allow camera access in your settings.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setErrorMsg("No camera device was found on this device.");
      } else {
        setErrorMsg(`Camera access failed: ${error.message || "Unknown error"}`);
      }
    }
  }, [facingMode, videoRef]);

  const stopCamera = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus("idle");
    console.log("[Scanner] Camera stopped");
  }, [videoRef]);

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  useEffect(() => {
    let lastScanTime = 0;
    const scanIntervalMs = 120;

    const offscreenCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
    const offscreenCtx = offscreenCanvas ? offscreenCanvas.getContext("2d", { willReadFrequently: true }) : null;

    const processFrame = async (timestamp: number) => {
      if (status !== "scanning" || !activeScannerRef.current || !videoRef.current || !offscreenCanvas || !offscreenCtx) {
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      if (timestamp - lastScanTime < scanIntervalMs) {
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        lastScanTime = timestamp;

        if (offscreenCanvas.width !== video.videoWidth) {
          offscreenCanvas.width = video.videoWidth;
          offscreenCanvas.height = video.videoHeight;
        }

        offscreenCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

        let decodedValue: string | null = null;
        let decodedFormat: string | undefined = undefined;

        try {
          if (nativeDetectorRef.current) {
            const barcodes = await nativeDetectorRef.current.detect(offscreenCanvas);
            if (barcodes && barcodes.length > 0) {
              decodedValue = barcodes[0].rawValue;
              decodedFormat = barcodes[0].format?.toUpperCase();
              console.log("[Scanner] Native detector found:", decodedValue, decodedFormat);
            }
          } else if (zxingReaderRef.current) {
            const luminanceSource = new HTMLCanvasElementLuminanceSource(offscreenCanvas);
            const binarizer = new HybridBinarizer(luminanceSource);
            const binaryBitmap = new BinaryBitmap(binarizer);
            
            const result = zxingReaderRef.current.decodeWithState(binaryBitmap);
            decodedValue = result.getText();
            decodedFormat = result.getBarcodeFormat()?.toString()?.toUpperCase();
            console.log("[Scanner] ZXing found:", decodedValue, decodedFormat);
          }
        } catch (err) {
          if (!(err instanceof NotFoundException)) {
            console.warn("[Scanner] Frame decode error:", err);
          }
        }

        if (decodedValue) {
          const cleanBarcode = decodedValue.trim();
          const now = Date.now();

          const lastScanned = lastScannedBarcodeRef.current;
          const isIdentical = lastScanned && lastScanned.barcode === cleanBarcode;
          const isWithinCooldown = lastScanned && (now - lastScanned.timestamp < cooldownMs);

          if (!isIdentical || !isWithinCooldown) {
            playBeep();
            lastScannedBarcodeRef.current = { barcode: cleanBarcode, timestamp: now };
            onScan(cleanBarcode, decodedFormat);
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    if (status === "scanning") {
      animationFrameIdRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [status, onScan, cooldownMs, videoRef]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return {
    status,
    errorMsg,
    facingMode,
    toggleCamera,
    startCamera,
    stopCamera,
    isNative
  };
}