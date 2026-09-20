import React from "react";
import { ScanResult } from "@/types/product";
import { 
  History, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  ChevronRight
} from "lucide-react";

interface RecentScansProps {
  scans: ScanResult[];
  onSelectScan: (scan: ScanResult) => void;
  onClearScans: () => void;
  activeBarcode: string | null;
}

export const RecentScans: React.FC<RecentScansProps> = ({
  scans,
  onSelectScan,
  onClearScans,
  activeBarcode
}) => {
  if (scans.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
        <History className="w-8 h-8 mx-auto text-slate-600 mb-3" />
        <h4 className="text-sm font-semibold text-slate-400">No recent scans</h4>
        <p className="text-xs mt-1 max-w-xs mx-auto text-slate-500">
          Products you scan will be listed here for quick review during your session.
        </p>
      </div>
    );
  }

  // Format timestamp to user-friendly "HH:MM:SS"
  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase">Recent Scans</h3>
          <span className="text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
            {scans.length}
          </span>
        </div>
        <button
          onClick={onClearScans}
          className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1.5"
          title="Clear scan history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear All
        </button>
      </div>

      {/* List */}
      <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
        {scans.map((scan, index) => {
          const isActive = activeBarcode === scan.barcode;
          const product = scan.product;
          const hasProduct = !!product;

          return (
            <button
              key={`${scan.barcode}-${scan.timestamp}-${index}`}
              onClick={() => onSelectScan(scan)}
              className={`w-full text-left px-5 py-3.5 flex items-center justify-between gap-4 transition-all hover:bg-slate-800/30 active:bg-slate-800/50 ${
                isActive ? "bg-slate-800/40 border-l-2 border-blue-500 pl-[18px]" : ""
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-grow">
                {/* Thumbnail Preview */}
                <div className="w-10 h-10 bg-slate-950 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-800/60">
                  {product?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={product.name || "Product"}
                      className="object-contain w-full h-full p-0.5"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                      {scan.format?.slice(0, 3) || "BAR"}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={`text-sm font-bold truncate ${isActive ? "text-blue-400" : "text-slate-200"}`}>
                      {product?.name || "Unidentified Product"}
                    </p>
                    {product?.brand && (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded-full truncate max-w-[100px]">
                        {product.brand}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
                    <span className="font-bold">{scan.barcode}</span>
                    <span>•</span>
                    <span>{formatTime(scan.timestamp)}</span>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {hasProduct ? (
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    FOUND
                  </span>
                ) : scan.error ? (
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    FAILED
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    UNKNOWN
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
