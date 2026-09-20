export interface Product {
  barcode: string;
  name?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  expiryDate?: string;
  batchNumber?: string;
  description?: string;
  source?: string;
}

export interface ScanResult {
  barcode: string;
  format?: string;
  timestamp: number;
  product?: Product;
  error?: string;
}
