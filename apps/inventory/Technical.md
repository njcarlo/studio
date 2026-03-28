# Inventory System Technical Architecture

This document maps out the key source files utilized across the Inventory Management System and describes their main responsibilities. The project heavily relies on React for the frontend interface and Express.js + Prisma ORM for backend architecture.

## 📂 Backend (API & DB)

- **`server/index.ts`**
  The central backend Express API. Defines all RESTful endpoints needed to run the app. Handles:
  - Database CRUD logic for Items, Categories, and Locations.
  - Analytics algorithms providing dashboard stat aggregations (Overdue counts, Total Values).
  - Business logic handling checkout and return workflows.
  - Batching generation of QR codes dynamically using the `qrcode` library.
  - Lookup endpoints (`POST /api/scan`) processing incoming unique ID/Payload data.
- **`prisma/schema.prisma`**
  Defines the rigorous data typing, relations, schema bindings, and logic mapping for the SQLite Database. See `Database-structure.md` for extended details.
- **`prisma/seed.ts`**
  Data scaffolding scripts responsible for wiping or generating the initial default values for testing parameters (e.g. Standardizing standard locations: "Broadcast Room", "SVC").

## 📂 Frontend (React Ecosystem)

### 🚀 Core Framework
- **`src/main.tsx`** & **`src/App.tsx`**
  The root React bootstrapping sequence. Uses `react-router-dom` to weave different views (Dashboard, Borrowings, Categories) under unified UI shells.
- **`src/App.css`** & **`src/index.css`**
  The global styling design systems applying atomic CSS methods, CSS variables (Color palettes, spacing, z-index patterns), and responsive behaviors (mobile breakpoints and CSS Grid overrides).
- **`src/hooks/useInventory.ts`**
  Consolidated `React custom hook` responsible for retrieving data from the Backend. Keeps components clean by abstracting away `fetch` requests while syncing logs, items, and total count stats securely within React's lifecycle states.

### 🍱 Main Interface Layout
- **`src/components/Layout.tsx`**
  The wrapper defining the permanent page skeleton—organizes the UI globally ensuring standard Sidebars and Headers wrap dynamically changing inner content.
- **`src/components/Header.tsx`**
  The permanent upper action bar. Holds global functions such as the Global Actions Scanner button, recent log notification bells, and automated contextual alerts (e.g., dynamically popping a red banner if overdue items are sensed by the backend).
- **`src/components/Sidebar.tsx`**
  The persistent vertical menu facilitating standard routing between major views. 

### ⚙️ Engine Pages & Modals
- **`src/components/InventoryTable.tsx`**
  The focal-point table view. Highly complex component containing grid vs table toggling logic, advanced search & filtering loops, category paginations, bulk selections (Mass export, Mass Update), and immediate quick-actions.
- **`src/components/ItemModal.tsx`** 
  The "Add / Edit" dynamic form for handling the nuanced properties of an inventory item schema.
- **`src/components/Dashboard.tsx`** 
  Constructs statistical overview UI integrating `.stat-card` wrappers that visually inform Admin on total, low, active items, and historical activity feeds natively tied to `StockLogs.tsx`.
- **`src/components/Categories.tsx` & `src/components/Settings.tsx` & `src/components/Reports.tsx`**
  Secondary functional domains providing UI tooling for managing item classification types or producing standard data breakdowns.

### 🛡️ Phase 3 Features (Scanning, QR, & Borrowings)
- **`src/components/BorrowingsPage.tsx`**
  Houses the complete workflow state regarding the handover of gear to end-users. Includes logic for due date assignment, physical condition validations (`Damaged` vs `Good`), and explicit checkout/return checklist checklists.
- **`src/components/QRModal.tsx`**
  Transforms textual item payloads into visually accurate QR tags. Capable of single-item extraction or printing advanced multi-label batch grids format optimized for standard sticker/paper outputs.
- **`src/components/ScannerModal.tsx`**
  An advanced reusable Hybrid-Scanner component. Capable of interpreting device deployment paths intelligently—switching over to Native `@capacitor-mlkit/barcode-scanning` bindings for maximum performance if running compiled on iOS/Android, OR spinning up an interactive `navigator.mediaDevices` web-video feed if accessed via computer browser.
- **`src/components/StockScanModal.tsx`**
  The dedicated "Scan to Action" implementation specifically linked from the Dashboard header. Captures arbitrary QR inputs or native scans directly applying `Stock IN (+1)` or `Stock OUT (-1)` modifiers quickly.
