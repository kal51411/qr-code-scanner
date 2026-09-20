import { Product } from "@/types/product";

// A curated fallback/inventory database for common barcodes.
// This simulates a real inventory database (e.g., PostgreSQL)
// containing internal data like pricing, expiry dates, and batch numbers
// that are not usually stored in public barcode APIs.
const INVENTORY_DB: Record<string, Omit<Product, "barcode">> = {
  "1234567890128": {
    name: "Fresh Organic Whole Milk",
    brand: "Valley Farms",
    category: "Dairy & Eggs",
    price: 3.49,
    currency: "USD",
    expiryDate: "2026-10-15",
    batchNumber: "MILK-402-A",
    description: "Grade A pasteurized organic whole milk. Rich in calcium and Vitamin D.",
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=200",
    source: "Local Inventory DB"
  },
  "0012345678905": {
    name: "Classic Tomato Ketchup",
    brand: "Heinz",
    category: "Condiments",
    price: 2.99,
    currency: "USD",
    expiryDate: "2027-02-18",
    batchNumber: "KET-881-C",
    description: "Made from sweet, juicy, red ripe tomatoes for the signature thick Heinz taste.",
    imageUrl: "https://images.unsplash.com/photo-1607305387299-a3d9611cd46f?auto=format&fit=crop&q=80&w=200",
    source: "Local Inventory DB"
  },
  "5012345678900": {
    name: "Premium Sparkling Spring Water",
    brand: "AquaPure",
    category: "Beverages",
    price: 1.25,
    currency: "USD",
    expiryDate: "2028-05-30",
    batchNumber: "WTR-102-X",
    description: "Naturally filtered sparkling spring water from protected underground sources.",
    imageUrl: "https://images.unsplash.com/photo-1608885898957-a599fb1bfcf8?auto=format&fit=crop&q=80&w=200",
    source: "Local Inventory DB"
  },
  "9780132350884": {
    name: "Clean Code",
    brand: "Prentice Hall",
    category: "Books",
    price: 42.99,
    currency: "USD",
    expiryDate: "Not applicable",
    batchNumber: "ISBN-978-0132350884",
    description: "A Handbook of Agile Software Craftsmanship by Robert C. Martin. A must-read for any software engineer.",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200",
    source: "Local Inventory DB"
  },
  "QR_TEST_PRODUCT": {
    name: "Artisanal Dark Chocolate (72%)",
    brand: "ChocoDelight",
    category: "Snacks & Sweets",
    price: 4.50,
    currency: "EUR",
    expiryDate: "2026-12-25",
    batchNumber: "CHO-990-D",
    description: "Single-origin fair trade dark chocolate bar. Intensely rich with notes of dark berries.",
    imageUrl: "https://images.unsplash.com/photo-1548907040-4d42b52125ca?auto=format&fit=crop&q=80&w=200",
    source: "Local Inventory DB"
  }
};

/**
 * Looks up a barcode in the Open Food Facts API (public data)
 */
async function fetchFromOpenFoodFacts(barcode: string): Promise<Product | null> {
  // Normalize barcode to remove spaces
  const cleanBarcode = barcode.trim();
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`, {
      headers: {
        "User-Agent": "RetailScannerApp/1.0 (NextJS Web App)"
      },
      next: { revalidate: 3600 } // Cache results for 1 hour
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 1 || !data.product) {
      return null;
    }

    const p = data.product;
    return {
      barcode: cleanBarcode,
      name: p.product_name || p.product_name_en || p.generic_name || undefined,
      brand: p.brands || undefined,
      category: p.categories?.split(",")[0]?.trim() || undefined,
      imageUrl: p.image_front_url || p.image_url || undefined,
      description: p.generic_name || undefined,
      source: "Open Food Facts"
      // Note: Price, expiryDate, batchNumber are not in Open Food Facts.
      // They will remain undefined (displayed as "Not available" or fallback).
    };
  } catch (error) {
    console.error("Error looking up Open Food Facts API:", error);
    return null;
  }
}

/**
 * ProductService class containing the business logic for looking up products.
 * This separates lookup from the UI and makes database migrations easy.
 */
export class ProductService {
  /**
   * Looks up product details by barcode.
   * Priority:
   * 1. Check local inventory database (simulated PostgreSQL)
   * 2. Check Open Food Facts public API (if it's a numeric barcode)
   */
  static async lookupProduct(barcode: string): Promise<Product | null> {
    const cleanBarcode = barcode.trim();

    // 1. Check local inventory database
    if (INVENTORY_DB[cleanBarcode]) {
      return {
        barcode: cleanBarcode,
        ...INVENTORY_DB[cleanBarcode]
      };
    }

    // 2. Check Open Food Facts for standard numeric barcodes (e.g. EAN-13, EAN-8, UPC-A, UPC-E)
    const isNumeric = /^\d+$/.test(cleanBarcode);
    if (isNumeric) {
      const publicProduct = await fetchFromOpenFoodFacts(cleanBarcode);
      if (publicProduct) {
        return publicProduct;
      }
    }

    // 3. Not found anywhere
    return null;
  }
}
