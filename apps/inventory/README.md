# Inventory Management System

This application is responsible for tracking physical assets, stock levels, and equipment movements within the Studio ecosystem.

## 🛠 Tech Stack
- **Frontend**: React (Vite)
- **Mobile**: Capacitor (Android/iOS)
- **Scanning**: @capacitor-mlkit/barcode-scanning
- **QR Generation**: qrcode (npm)
- **Backend/ORM**: Prisma + PostgreSQL (Shared)

---

## 🗺 Implementation Roadmap

### Phase 1: Database & Data Layer (✅ Schema Updated)
- [x] **1.1 Update Prisma Schema**: Added inventory models with:
    - **Item Segregation**: Support for `Equipments` (unique assets) and `Consumables` (bulk stock).
    - **Equipments**: Unique Inventory Codes, Maintenance Status, Assignment tracking.
    - **Consumables**: Reorder levels, Expiry dates, Batch quantity management.
    - **Customizable Categories**: Name, Color, Icon, and Group mapping.
    - **Status Tracking**: 1-5 Status Codes with history logs.
- [ ] **1.2 Database Sync**: Run migrations and generate Prisma client.
- [ ] **1.3 Infrastructure**: Setup core CRUD actions (Server Actions or API routes).

### Phase 2: Dashboard & Core UI
- [ ] **2.1 Main Dashboard**:
    - [ ] **Stock Stats**: Total items, low stock alerts, value overview.
    - [ ] **Activity Feed**: Real-time list of recent inventory logs (In/Out/Adjust).
- [ ] **2.2 Master Inventory Table**:
    - [ ] **High-Performance Grid**: View all Equipments and Consumables with smart filtering.
    - [ ] **Bulk Actions**: Select multiple rows to Update Status, Assign Location, or Export.
    - [ ] **Quick Actions**: Inline buttons for "Quick Stock In/Out" and "View QR Label".
    - [ ] **Item Browser**: Searchable grid/list with filters by Category, Type, or Status.

### Phase 3: QR & Mobile Scanning
- [ ] **3.1 QR Generation**: 
    - [ ] Auto-generate unique QR codes for every item SKU/ID.
    - [ ] Print-friendly QR labels view.
- [ ] **3.2 Mobile Scanner**:
    - [ ] Integrate Capacitor MLKit for high-performance mobile scanning.
    - [ ] "Scan to Action": Scan an item to immediately prompt for "In" or "Out".
- [ ] **3.3 Equipment Borrowing & Checklist**:
    - [ ] **Borrowing Workflow**: Assign equipment to workers with due dates.
    - [ ] **Checkout Checklist**: Customizable digital forms (e.g., "Full Battery", "No Scratches") before item leaves.
    - [ ] **Return Checklist**: Verification checklist during return to identify damages.
    - [ ] **Status Automated Alerts**: Notify when items are overdue or returned DAMAGED.

### Phase 4: Reporting & Security
- [ ] **4.1 Import/Export System**: 
    - [ ] **Excel Import**: Batch upload items and categories from existing Excel files.
    - [ ] **Export to CSV/Excel**: Generate stock lists matching your spreadsheet format.
    - [ ] **PDF Summaries**: Professional reports for audits and maintenance checks.
- [ ] **4.2 Advanced Audit & Analytics**: 
    - [ ] **Consumable Analytics**: Track consumption rates, predictable depletion dates, and low-stock trends.
    - [ ] **Detailed Audit Trail**: Chronological history for every item (Who, When, What).
- [ ] **4.3 Media & Polish**:
    - [ ] **Item Photos**: Supabase Storage integration for visual asset management.
    - [ ] **Permissions**: RBAC (Read-only vs Manager vs Admin).
    - [ ] **Mobile optimization**: Touch-friendly buttons and haptic feedback for scanning.

### Phase 5: Advanced Automation & Future-Proofing
- [ ] **5.1 Maintenance (PMS) Scheduling**: 
    - [ ] automated alerts for items marked "For PMS" based on the `nextMaintenanceDate`.
- [ ] **5.2 Kits & Item Bundles**: 
    - [ ] Create parent-child relationships for equipment sets (e.g., Camera Kits).
    - [ ] "One-Scan Checkout" for whole bundles.
- [ ] **5.3 Visual Damage Proof**: 
    - [ ] Integrated camera feature for capturing and attaching return photos to borrowings.
- [ ] **5.4 High-Value Approval Workflow**: 
    - [ ] Enforce "Ministry Head" approval for borrowing items marked as high-value/restricted.
- [ ] **5.5 Granular Location Tracking**: 
    - [ ] Sub-location details: Aisle, Shelf, and Bin IDs for high-density storage areas.

---

## 🚀 Getting Started

### Development
```bash
npm run dev
```

### Mobile Development (Android)
```bash
npm run mobile:dev
```
