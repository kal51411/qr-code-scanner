import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/services/productService";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ barcode: string }> }
) {
  try {
    const params = await context.params;
    const barcode = params.barcode;

    if (!barcode) {
      return NextResponse.json(
        { error: "Barcode parameter is required" },
        { status: 400 }
      );
    }

    const product = await ProductService.lookupProduct(barcode);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found in local inventory or public databases", barcode },
        { status: 404 }
      );
    }

    // Set Cache-Control header to enable edge caching in Vercel/CDNs
    return NextResponse.json(product, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600"
      }
    });
  } catch (error) {
    console.error("Error in product lookup API route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
