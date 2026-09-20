# Retail Scanner Pro 🛒⚡

An ultra-fast, privacy-first, browser-based Barcode and QR code scanner engineered like a real retail POS terminal.

The application decodes standard barcodes (EAN-13, EAN-8, UPC-A, UPC-E, Code 128) and QR codes directly inside the user's browser in real-time, then performs asynchronous product lookups across local inventory databases and public registries like Open Food Facts.

---

## 🌟 Key Features

- **⚡ Hardware-Accelerated Browser Scanning**: Uses native browser `BarcodeDetector` when available, with a fallback to `@zxing/library` for universal browser compatibility (iOS Safari, Android Chrome, Firefox, Desktop).
- **🔒 Privacy First Architecture**: **Zero camera frames, video data, or raw pixels are sent to any backend**. All barcode detection runs 100% client-side in browser memory.
- **🔊 POS Audio & Visual Feedback**: Synthesizes a crisp electronic scanner beep via Web Audio API and briefly flashes the reticle green upon successful scan.
- **⏱️ Anti-Spam & Deduplication**: Smart frame throttling (8 scans/sec) with debounce cooldowns to prevent repetitive queries for the same product on consecutive frames.
- **📱 Responsive Retail UI**:
  - **Desktop**: Dual-column layout (`Camera Feed` on left, `Product Card` on right, `Session Log` below).
  - **Mobile**: Camera-first vertical layout with instant scrolling and flip-camera toggles.
- **📦 Clean Product Service Abstraction**: Modular architecture separating UI components from data fetching. Integrates both a local inventory store (for pricing, expiry dates, and batch numbers) and the public Open Food Facts registry.
- **🐍 Python Prototype Preserved**: The original `qr_code.py` OpenCV/pyzbar prototype remains intact in the repository root as a reference.

---

## 📐 System Architecture

```
[ Browser Camera Feed (WebRTC) ]
              ↓
  [ Client-Side Detection Engine ]
   (Native BarcodeDetector / ZXing WASM)
              ↓
      [ Decoded Barcode ]
              ↓
    [ Product Lookup API ]
 (Local Store → Open Food Facts API)
              ↓
     [ Modern Product UI ]
```

---

## 📁 Repository Structure

```
qr-code-scanner/
├── qr_code.py                  # Preserved OpenCV reference prototype
└── web/                        # Production Web Application (Next.js 15)
    ├── src/
    │   ├── app/
    │   │   ├── api/
    │   │   │   └── lookup/
    │   │   │       └── [barcode]/
    │   │   │           └── route.ts   # Next.js API route for product lookup
    │   │   ├── globals.css
    │   │   ├── layout.tsx
    │   │   └── page.tsx               # Main Dashboard UI
    │   ├── components/
    │   │   ├── BarcodeScanner.tsx     # Video feed, reticle & camera controls
    │   │   ├── ProductCard.tsx        # Product details display card
    │   │   └── RecentScans.tsx        # Scan history list
    │   ├── hooks/
    │   │   └── useBarcodeScanner.ts   # Custom React hook for scanning loop
    │   ├── services/
    │   │   └── productService.ts      # Data abstraction & API integration
    │   └── types/
    │       └── product.ts             # TypeScript interfaces
    ├── package.json
    ├── tailwind.config.ts
    └── tsconfig.json
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Installation & Execution

1. **Navigate to the web application directory**:
   ```bash
   cd web
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in Browser**:
   Open [http://localhost:3000](http://localhost:3000) in your web browser. Ensure you grant camera permissions when prompted.

---

## 🧪 Testing with Test Barcodes

When testing without physical products on hand, you can hold up these barcodes to your camera or point your mobile device:

| Barcode Value | Product Name | Source | Notes |
| :--- | :--- | :--- | :--- |
| `1234567890128` | Fresh Organic Whole Milk | Local Inventory | Includes Expiry & Batch Info |
| `0012345678905` | Classic Tomato Ketchup | Local Inventory | Includes Price & Category |
| `9780132350884` | Clean Code (Book) | Local Inventory | ISBN Format |
| `QR_TEST_PRODUCT` | Dark Chocolate (72%) | Local Inventory | QR Code Format |
| *Any Real EAN-13* | Real Groceries (e.g., Coke) | Open Food Facts | Fetches live public product data |

---

## ⚙️ Environment Variables

No environment variables are required for basic operation. However, if you add proprietary inventory APIs or database connections later, create a `.env.local` file inside `web/`:

```env
# Optional: Future PostgreSQL / Database strings or external API keys
PRODUCT_DATABASE_URL=
EXTERNAL_API_KEY=
```

---

## ☁️ Deployment to Vercel

The application is completely Vercel-native.

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Set the **Root Directory** to `web`.
4. Click **Deploy**. Vercel will automatically run `npm run build` and provision serverless functions for `/api/lookup/[barcode]`.

---

## ℹ️ Important Technical Note regarding Product Expiry Data

A standard retail barcode (EAN-13, UPC-A) **only encodes the GTIN (Global Trade Item Number)**. It does **not** contain the product's expiration date or batch number.

- **GS1 Digital Link / DataMatrix barcodes** used in pharmaceutical or advanced retail do contain batch/expiry numbers.
- For standard barcodes, expiry and batch information **must come from an inventory database (e.g. ERP or PostgreSQL)**.
- If an external public registry (like Open Food Facts) does not supply expiry date or batch number, the system displays **"Not available"** without making up fictitious dates.

---

## 🐍 Running the Reference Python Prototype

To run the original Python barcode scanner prototype:

```bash
# From repository root
pip install opencv-python pyzbar
python qr_code.py
```
