# Retail Scanner Pro

A browser-based barcode/QR scanner that actually feels like a retail scanner. Point camera → hear beep → see product info. No frame uploads, no nonsense.

## What this does

Opens your camera, scans barcodes in real-time using the browser's native `BarcodeDetector` (hardware accelerated on Chrome/Android) with a ZXing fallback for Safari/Firefox. When it finds a code, it plays a crisp beep, shows the barcode instantly, then fetches product details asynchronously.

**Desktop:** Camera left, product card right, history bottom  
**Mobile:** Camera first, product below, history below that

## The stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Native `BarcodeDetector` API → `@zxing/library` fallback
- Client-side only scanning (zero webcam frames leave your browser)
- Next.js API route for product lookup (serverless, edge-cached)

## Product data

Two sources, in priority order:

1. **Local inventory** (`web/src/services/productService.ts`) — has prices, expiry dates, batch numbers, images. This simulates your actual database.
2. **Open Food Facts** — public registry for EAN/UPC codes. Returns name, brand, category, image. No prices, no expiry, no batches — because those don't exist in a GTIN.

If a field isn't available, it says "Not available". I don't fake data.

## Quick start

```bash
cd web
npm install
npm run dev
```

Open localhost:3000, allow camera, point at a barcode.

**Test codes** (work without physical products):
- `1234567890128` — Milk (has expiry, batch, price)
- `0012345678905` — Ketchup
- `9780132350884` — Clean Code (ISBN)
- `QR_TEST_PRODUCT` — Dark chocolate (QR format)
- Any real EAN-13 from your pantry → hits Open Food Facts

## Project structure

```
qr-code-scanner/
├── qr_code.py              # Original OpenCV prototype (untouched)
└── web/                    # Production web app
    ├── src/
    │   ├── app/
    │   │   ├── api/lookup/[barcode]/route.ts
    │   │   ├── page.tsx            # Main dashboard
    │   │   └── layout.tsx
    │   ├── components/
    │   │   ├── BarcodeScanner.tsx  # Camera + reticle + controls
    │   │   ├── ProductCard.tsx     # Product display
    │   │   └── RecentScans.tsx     # History list
    │   ├── hooks/
    │   │   └── useBarcodeScanner.ts # Core scanning logic
    │   ├── services/
    │   │   └── productService.ts   # Data abstraction
    │   └── types/product.ts
    └── package.json
```

## How the scanner works (the important part)

`web/src/hooks/useBarcodeScanner.ts`:
- Requests rear camera (`facingMode: "environment"`) at 1280x720 — not 4K, fast enough
- Draws video frames to an offscreen canvas at ~8fps (throttled, not every frame)
- Tries native `BarcodeDetector` first → falls back to ZXing WASM
- On match: plays 1200Hz beep via Web Audio API, flashes reticle green
- Deduplicates: same barcode within 2.5s is ignored
- Calls `onScan(barcode, format)` → UI handles the rest

Camera starts on mount, stops cleanly on unmount. Handles permission denied, no camera, unsupported browser.

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel → **Root Directory: `web`**
3. Deploy

The API route becomes a serverless function. Frontend is static. Done.

## The Python prototype

```bash
pip install opencv-python pyzbar
python qr_code.py
```

Still works. Kept as reference.