import React, { useState, useEffect } from "react";
import { 
  Camera, 
  CameraOff, 
  RotateCw, 
  Zap, 
  AlertTriangle
} from "lucide-react";
import { ScannerStatus } from "@/hooks/useBarcodeScanner";

interface BarcodeScannerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: ScannerStatus;
  errorMsg: string | null;
  facingMode: "environment" | "user";
  toggleCamera: () => void;
  startCamera: () => void;
  stopCamera: () => void;
  isNative: boolean;
  lastScannedBarcode: string | null;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  videoRef,
  status,
  errorMsg,
  facingMode,
  toggleCamera,
  startCamera,
  stopCamera,
  isNative,
  lastScannedBarcode
}) => {
  const [showFlash, setShowFlash] = useState(false);

  // Trigger flash effect when a new barcode is scanned
  useEffect(() => {
    if (lastScannedBarcode) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 300);
      return () => clearTimeout(timer);
    }
  }, [lastScannedBarcode]);

  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full min-h-[400px]">
      {/* Video Stream & Scanning Overlay */}
      <div className="relative flex-grow flex items-center justify-center bg-black overflow-hidden group min-h-[300px]">
        {/* Camera Feed */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
        />

        {/* Successful scan flash overlay */}
        <div
          className={`absolute inset-0 bg-emerald-500/30 transition-opacity duration-300 pointer-events-none z-10 ${
            showFlash ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Reticle / Bounding Scanning Box */}
        {status === "scanning" && (
          <div className="absolute z-20 pointer-events-none flex flex-col items-center justify-center w-full h-full">
            <div className="relative w-64 h-64 md:w-72 md:h-72 border-2 border-slate-400/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />

              {/* Laser sweeping line */}
              <div className="absolute left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_12px_#3b82f6] animate-pulse" 
                   style={{
                     animation: "scanLine 2.2s ease-in-out infinite",
                     top: "0%"
                   }}
              />
            </div>
            <p className="text-blue-400 text-xs font-bold tracking-widest uppercase mt-4 px-3 py-1 bg-slate-950/80 rounded-full border border-blue-500/20 backdrop-blur animate-pulse">
              Align Code In Reticle
            </p>
          </div>
        )}

        {/* Laser Animation Keyframe definition */}
        <style>{`
          @keyframes scanLine {
            0% { top: 4%; }
            50% { top: 94%; }
            100% { top: 4%; }
          }
        `}</style>

        {/* State Overlays */}
        {status === "requesting" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
            <RotateCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-200 font-semibold text-base">Requesting Camera Access</p>
            <p className="text-slate-500 text-xs mt-2 max-w-xs leading-relaxed">
              Please click &ldquo;Allow&rdquo; on the browser prompt to start the real-time scanning feed.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center border border-red-500/20">
            <div className="w-16 h-16 bg-red-950/40 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-slate-200 font-bold text-base">Camera Initialization Failed</p>
            <p className="text-red-400/90 text-sm mt-2 max-w-sm font-medium">
              {errorMsg}
            </p>
            <button
              onClick={startCamera}
              className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {status === "idle" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-slate-800/35 rounded-full flex items-center justify-center mb-4 border border-slate-800">
              <CameraOff className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-300 font-semibold text-base">Camera is Stopped</p>
            <p className="text-slate-500 text-xs mt-1.5 max-w-xs leading-relaxed">
              Scanning has been paused to save battery and system resources.
            </p>
            <button
              onClick={startCamera}
              className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Start Scanner
            </button>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-5 py-4 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-3">
          {/* Status Indicator Dot */}
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              status === "scanning" 
                ? "bg-emerald-500 animate-pulse" 
                : status === "requesting"
                ? "bg-blue-500 animate-spin"
                : "bg-slate-600"
            }`} />
            <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
              {status === "scanning" ? "Scanning..." : status === "requesting" ? "Connecting..." : "Camera Off"}
            </span>
          </div>

          {/* Engine Indicator Pill */}
          {status === "scanning" && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-amber-500" />
                {isNative ? "NATIVE HW" : "ZXING WASM"}
              </span>
              <span className="text-[10px] font-semibold bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 uppercase">
                {facingMode === "environment" ? "Back" : "Front"}
              </span>
            </div>
          )}
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-2">
          {status === "scanning" ? (
            <button
              onClick={stopCamera}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 rounded-xl transition-colors border border-slate-700/50 flex items-center gap-1.5 text-xs font-bold"
              title="Pause Scanner"
            >
              <CameraOff className="w-4 h-4" />
              Pause
            </button>
          ) : (
            <button
              onClick={startCamera}
              disabled={status === "requesting"}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-colors shadow-md flex items-center gap-1.5 text-xs font-bold"
              title="Start Scanner"
            >
              <Camera className="w-4 h-4" />
              Start
            </button>
          )}

          <button
            onClick={toggleCamera}
            disabled={status !== "scanning"}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 rounded-xl transition-colors border border-slate-700/50 flex items-center gap-1.5 text-xs font-bold"
            title="Swap Front/Rear Camera"
          >
            <RotateCw className="w-4 h-4" />
            Flip
          </button>
        </div>
      </div>
    </div>
  );
};
