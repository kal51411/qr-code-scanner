"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { ProductCard } from "@/components/ProductCard";
import { RecentScans } from "@/components/RecentScans";
import { Product, ScanResult } from "@/types/product";
import { 
  ShoppingBag, 
  Sparkles, 
  Clock,
  Code2
} from "lucide-react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // States
  const [activeBarcode, setActiveBarcode] = useState<string | null>(null);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  
  // Fast client-side lookup cache to prevent redundant API calls
  const [cache, setCache] = useState<Record<string, Product>>({});

  // Clean-up and initialize history from localStorage (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHistory = localStorage.getItem("scanner_history");
      if (savedHistory) {
        try {
          setRecentScans(JSON.parse(savedHistory));
        } catch (e) {
          console.warn("Failed to parse saved scanning history:", e);
        }
      }
    }
  }, []);

  // Save history to localStorage whenever it updates
  const saveHistory = (updatedHistory: ScanResult[]) => {
    setRecentScans(updatedHistory);
    if (typeof window !== "undefined") {
      localStorage.setItem("scanner_history", JSON.stringify(updatedHistory));
    }
  };

  // Barcode Scan Handler
  const handleScan = useCallback(
    async (barcode: string, format?: string) => {
      setActiveBarcode(barcode);
      setLookupLoading(true);
      setLookupError(null);

      const timestamp = Date.now();

      // 1. Check local client-side memory cache first (instant response)
      if (cache[barcode]) {
        const cachedProduct = cache[barcode];
        setCurrentProduct(cachedProduct);
        setLookupLoading(false);

        // Prepend to history, filtering out duplicate barcodes from history list
        const filteredHistory = recentScans.filter((s) => s.barcode !== barcode);
        const newScan: ScanResult = {
          barcode,
          format,
          timestamp,
          product: cachedProduct
        };
        saveHistory([newScan, ...filteredHistory]);
        return;
      }

      // 2. Not cached - perform asynchronous API lookup
      try {
        const response = await fetch(`/api/lookup/${encodeURIComponent(barcode)}`);
        
        if (response.ok) {
          const product: Product = await response.json();
          
          // Store in client-side cache & set state
          setCache((prev) => ({ ...prev, [barcode]: product }));
          setCurrentProduct(product);

          const filteredHistory = recentScans.filter((s) => s.barcode !== barcode);
          const newScan: ScanResult = {
            barcode,
            format,
            timestamp,
            product
          };
          saveHistory([newScan, ...filteredHistory]);
        } else {
          // Product not found or server error
          const errData = await response.json().catch(() => ({}));
          const errorMsg = errData.error || "Product lookup failed";
          
          setLookupError(errorMsg);
          setCurrentProduct(null);

          const filteredHistory = recentScans.filter((s) => s.barcode !== barcode);
          const newScan: ScanResult = {
            barcode,
            format,
            timestamp,
            error: errorMsg
          };
          saveHistory([newScan, ...filteredHistory]);
        }
      } catch (err) {
        console.error("Lookup request failed:", err);
        const errorMsg = "Network error during product lookup";
        setLookupError(errorMsg);
        setCurrentProduct(null);

        const filteredHistory = recentScans.filter((s) => s.barcode !== barcode);
        const newScan: ScanResult = {
          barcode,
          format,
          timestamp,
          error: errorMsg
        };
        saveHistory([newScan, ...filteredHistory]);
      } finally {
        setLookupLoading(false);
      }
    },
    [cache, recentScans]
  );

  // Hook activation
  const {
    status,
    errorMsg,
    facingMode,
    toggleCamera,
    startCamera,
    stopCamera,
    isNative
  } = useBarcodeScanner({
    videoRef,
    onScan: handleScan,
    active: true, // Scanner remains continuous
    cooldownMs: 2500 // Prevents frame spamming
  });

  // Handler to inspect past scan in details view
  const handleSelectScan = (scan: ScanResult) => {
    setActiveBarcode(scan.barcode);
    if (scan.product) {
      setCurrentProduct(scan.product);
      setLookupError(null);
    } else {
      setCurrentProduct(null);
      setLookupError(scan.error || "Product details unavailable");
    }
  };

  // Handler to clear history
  const handleClearScans = () => {
    saveHistory([]);
    setActiveBarcode(null);
    setCurrentProduct(null);
    setLookupError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600/30 selection:text-blue-200">
      {/* Top Header */}
      <header className="border-b border-slate-900 bg-slate-950/75 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-md font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                RETAIL SCANNER Pro
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded-full">
                  v1.0
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Ultra-fast, secure client-side camera barcode engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/kal51411/qr-code-scanner"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-200 transition-colors hidden sm:flex items-center gap-2 text-xs font-semibold"
            >
              <Code2 className="w-4 h-4 text-blue-400" />
              Source Code
            </a>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Barcode Camera (takes 7 cols on lg screens) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              Real-Time Scan Terminal
            </h2>
            <p className="text-slate-400 text-xs">
              Supports standard retail codes (EAN-13, EAN-8, UPC-A, UPC-E, Code 128) and QR codes.
            </p>
          </div>

          <div className="h-[400px] md:h-[450px]">
            <BarcodeScanner
              videoRef={videoRef}
              status={status}
              errorMsg={errorMsg}
              facingMode={facingMode}
              toggleCamera={toggleCamera}
              startCamera={startCamera}
              stopCamera={stopCamera}
              isNative={isNative}
              lastScannedBarcode={activeBarcode}
            />
          </div>

          {/* Tips block */}
          <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 leading-normal">
              <span className="font-semibold text-slate-200 block mb-0.5">Privacy First</span>
              All barcode analysis is processed strictly on your local browser. Zero webcam frames, pixel arrays, or video data are uploaded to external APIs or backends, ensuring complete scanning speed and privacy.
            </div>
          </div>
        </div>

        {/* Right Column: Product Card Display (takes 5 cols on lg screens) */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-200">
              Product Registry
            </h2>
            <p className="text-slate-400 text-xs">
              Instant local lookup with real-time public registry fallbacks.
            </p>
          </div>

          <ProductCard
            product={currentProduct}
            barcode={activeBarcode}
            loading={lookupLoading}
            error={lookupError}
          />
        </div>

        {/* Bottom Full-width section: Recent Scans */}
        <div className="col-span-1 lg:col-span-12 mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Session Log
              </h2>
              <p className="text-slate-400 text-xs">
                Review and inspect scans from your current active browser session.
              </p>
            </div>
          </div>

          <RecentScans
            scans={recentScans}
            onSelectScan={handleSelectScan}
            onClearScans={handleClearScans}
            activeBarcode={activeBarcode}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Retail Scanner Pro. Built alongside python OpenCV reference.</p>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span>Serverless API Lookup</span>
            <span>•</span>
            <span>Hardware Accelerated WebRTC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
