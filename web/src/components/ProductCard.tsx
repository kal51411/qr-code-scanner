import React from "react";
import { Product } from "@/types/product";
import { 
  Barcode, 
  Tag, 
  Calendar, 
  Layers, 
  DollarSign, 
  Database, 
  Loader2, 
  ShoppingBag, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface ProductCardProps {
  product: Product | null;
  barcode: string | null;
  loading: boolean;
  error: string | null;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  barcode,
  loading,
  error
}) => {
  // 1. Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8 text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-slate-200">Looking up Product</h3>
        <p className="text-slate-400 text-sm mt-2">
          Searching inventory database & public registries for <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-400 font-mono text-xs">{barcode}</code>...
        </p>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] bg-slate-900/50 backdrop-blur border border-red-900/30 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-950/40 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200">Product Not Found</h3>
        <p className="text-slate-400 text-sm mt-2 max-w-sm">
          Barcode: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-red-400 font-mono text-xs">{barcode}</code>
        </p>
        <p className="text-slate-500 text-xs mt-3 bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-500/10">
          Not found in local inventory or Open Food Facts. You can scan another product.
        </p>
      </div>
    );
  }

  // 3. Waiting / Empty State
  if (!product && !barcode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] bg-slate-900/50 backdrop-blur border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-400">
        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-slate-300">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-300">Ready to Scan</h3>
        <p className="text-slate-400 text-sm mt-2 max-w-xs">
          Position a product barcode or QR code in front of the camera.
        </p>
        <div className="mt-6 text-left text-xs text-slate-500 bg-slate-950/50 p-4 rounded-xl border border-slate-800 w-full max-w-xs">
          <p className="font-semibold text-slate-400 mb-1">Try these test codes:</p>
          <ul className="space-y-1 font-mono">
            <li>• <span className="text-blue-400">1234567890128</span> (Milk)</li>
            <li>• <span className="text-blue-400">0012345678905</span> (Ketchup)</li>
            <li>• <span className="text-blue-400">9780132350884</span> (Book)</li>
            <li>• <span className="text-blue-400">QR_TEST_PRODUCT</span> (Chocolate)</li>
          </ul>
        </div>
      </div>
    );
  }

  // 4. Barcode decoded but lookup returned nothing (fallback)
  const displayProduct = product || { barcode: barcode || "" };

  const formattedPrice = displayProduct.price !== undefined 
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: displayProduct.currency || "USD"
      }).format(displayProduct.price)
    : "Not available";

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-slate-700">
      {/* Product Image / Header banner */}
      <div className="relative h-48 bg-gradient-to-br from-slate-950 to-slate-800 flex items-center justify-center p-6 border-b border-slate-800">
        {displayProduct.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayProduct.imageUrl}
            alt={displayProduct.name || "Product Image"}
            className="h-full object-contain max-w-full rounded-lg transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center text-slate-600">
            <ShoppingBag className="w-16 h-16 mb-2" />
            <span className="text-xs uppercase tracking-wider font-semibold">No Image Available</span>
          </div>
        )}
        {displayProduct.source && (
          <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Database className="w-2.5 h-2.5" />
            {displayProduct.source}
          </span>
        )}
      </div>

      {/* Product Information */}
      <div className="p-6 space-y-5">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block mb-1">
            {displayProduct.brand || "Generic Brand"}
          </span>
          <h2 className="text-xl font-bold text-slate-100 line-clamp-2">
            {displayProduct.name || "Unidentified Product"}
          </h2>
          {displayProduct.description && (
            <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
              {displayProduct.description}
            </p>
          )}
        </div>

        <hr className="border-slate-800" />

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Barcode/GTIN */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
              <Barcode className="w-3.5 h-3.5" />
              <span>Barcode / GTIN</span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-200 truncate">
              {displayProduct.barcode}
            </span>
          </div>

          {/* Category */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
              <Tag className="w-3.5 h-3.5" />
              <span>Category</span>
            </div>
            <span className="text-xs font-bold text-slate-200 truncate">
              {displayProduct.category || "Not available"}
            </span>
          </div>

          {/* Price */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Retail Price</span>
            </div>
            <span className="text-xs font-bold text-slate-200">
              {formattedPrice}
            </span>
          </div>

          {/* Expiry Date */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Expiry Date</span>
            </div>
            <span className={`text-xs font-bold ${displayProduct.expiryDate && displayProduct.expiryDate !== "Not available" ? "text-amber-400" : "text-slate-200"}`}>
              {displayProduct.expiryDate || "Not available"}
            </span>
          </div>
        </div>

        {/* Batch & Additional metadata */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-slate-500 font-medium">Batch / Lot Number</p>
              <p className="font-mono font-bold text-slate-200 mt-0.5">
                {displayProduct.batchNumber || "Not available"}
              </p>
            </div>
          </div>
          {(!displayProduct.expiryDate || !displayProduct.batchNumber) && (
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-slate-600 cursor-help transition-colors hover:text-slate-400" />
              <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-48 bg-slate-950 text-slate-300 text-[10px] p-2.5 rounded-lg border border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 leading-normal z-10">
                A standard barcode only contains the GTIN identifier. Batch and Expiry information are pulled from inventory databases.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
