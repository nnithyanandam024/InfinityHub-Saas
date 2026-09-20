# InfinityHub — Multi-Tenant Business SaaS Platform & Standalone Applications

InfinityHub is an enterprise-grade multi-tenant business SaaS platform designed to host, provision, and operate independent business software applications on top of a shared, high-performance cloud infrastructure.

Rather than bundling every capability into an overwhelming single monolithic application, InfinityHub operates as a **Multi-Product SaaS Platform** where clients subscribe to dedicated, standalone business applications tailored to their industry.

```text
                         INFINITYHUB
                    Multi-Product SaaS Platform
                               │
       ┌───────────────┬───────┴───────┬───────────────┐
       │               │               │               │
  Inventory App     POS App     Restaurant App    HR & Payroll
       │               │               │               │
   Tenant A        Tenant B        Tenant C        Tenant D
 (ABC Supermarket) (City Retail)  (XYZ Bistro)    (Apex Corp)
```

---

## 1. Security Architecture & Zero-Trust Access Boundaries

InfinityHub enforces **strict cryptographic and logical segregation between the SaaS Platform Operator (Super Admin) and Customer Business Data (Tenant Admin / Store Staff)**.

```text
                         SaaS PLATFORM
                               │
                        ┌──────┴──────┐
                        │ SUPER ADMIN │
                        └──────┬──────┘
                               │
               ┌───────────────┼────────────────┐
               │               │                │
           Tenants         Subscriptions      Plans
           Status          Billing status     Products Catalog
           Users count     Expiry             Audit Logs
           Usage quotas
```

### Access Boundary Rules

| Domain | Scope | Accessible Resources | Restricted Resources |
|---|---|---|---|
| **Platform Scope** | `SUPER_ADMIN` | Tenants directory, account status (Active/Suspended), plan configurations, applications catalog, subscription expiration dates, usage/quota telemetry | [Restricted] Customer products<br>[Restricted] Inventory stock records<br>[Restricted] Purchases & invoices<br>[Restricted] Suppliers & contacts<br>[Restricted] Financial & valuation reports<br>[Restricted] Customer store files |
| **Tenant Scope** | `TENANT_OWNER`<br>`MANAGER`<br>`STAFF` | Tenant private catalog, SKU definitions, real-time on-hand stock, suppliers, purchase receipts, store settings, team accounts, and valuation reports | [Restricted] Platform admin console<br>[Restricted] Cross-tenant accounts<br>[Restricted] Global billing & application catalogs |

---

## 2. Standalone SaaS Products Catalog

1. **Inventory Management (Phase 1 Live & Production-Ready):**
   - Precision Stock Control & Supply Chain.
   - Products catalog, multi-unit stock, reorder levels, categories, suppliers, purchase invoices, and live stock valuation ledger.
   - Dedicated customer navigation: `Dashboard` · `Products` · `Categories` · `Suppliers` · `Purchases` · `Stock Ledger` · `Reports` · `Store Settings` · `Team`.
2. **Billing & POS (Standalone Suite):**
   - High-Speed Retail Checkout & Invoicing. Barcode checkout, split payments, cash drawers, and daily sales closing.
3. **Restaurant Management (Standalone Suite):**
   - Dine-In, Kitchen Display & Table Operations. Table reservations, KDS, digital menus, and recipe costings.
4. **Employee Management (Standalone Suite):**
   - Workforce Attendance, Shifts & Payroll. Shift rosters, clock-in attendance, leave tracking, and salary slips.
5. **Appointment Management (Standalone Suite):**
   - Customer Booking & Service Calendars. Online booking links, calendar scheduling, and staff allocation.

---

## 3. Monorepo Architecture

```text
SaaSProject/
│
├── apps/
│   ├── web/                     # React 18 / 19 + Vite + Tailwind CSS + Lucide React + TanStack Table
│   └── mobile/                  # Pure React Native CLI Application (Native android/ and ios/)
│
├── packages/
│   ├── types/                   # Unified TypeScript interfaces (Scoped Auth, Product, Tenant, User)
│   ├── validation/              # Shared Zod validation schemas
│   ├── constants/               # Roles, scoped permissions, modules, statuses
│   ├── ui/                      # Shared design tokens (InfinityTech aesthetic) & formatters
│   └── config/                  # Shared environment & TypeScript configurations
│
├── package.json                 # Monorepo workspaces definition
├── tsconfig.json                # TypeScript solution references
└── README.md
```

---

## 4. Key Web Workflows & Routes

| Route | Purpose | Target Audience |
|---|---|---|
| `http://localhost:3000/platform` | Public SaaS Storefront showcasing all 5 products | Public / Prospective Clients |
| `http://localhost:3000/login` | Split-screen login page with 1-click evaluation persona testing drawer | All Users |
| `http://localhost:3000/inventory/products` | Dedicated standalone Inventory Management workspace | Inventory Customers (e.g. ABC Supermarket) |
| `http://localhost:3000/admin/dashboard` | Super Admin Platform Overview with application breakdowns | Super Admin (Platform Scope) |
| `http://localhost:3000/admin/tenants` | Multi-Tenant directory with application filters and quotas | Super Admin (Platform Scope) |
| `http://localhost:3000/admin/modules` | Platform Applications Catalog with customer counts & provisioning triggers | Super Admin (Platform Scope) |

---

## 5. Web Application Setup & Execution

From the workspace root:

```bash
# 1. Install all dependencies across monorepo
npm install

# 2. Start the web application in dev mode
npm run dev:web

# 3. Verify production build
npm run build --workspace=apps/web
```

The application runs at `http://localhost:3000`.

---

## 6. Mobile Application (Pure React Native CLI)

> **Expo is not used.** The mobile application is structured with native `android/` and `ios/` projects.

To run on Android:

```bash
# Ensure an Android emulator or USB debug device is connected
npm run android --workspace=@infinityhub/mobile
```

To run on iOS (macOS required):

```bash
cd apps/mobile/ios && pod install && cd ../../..
npm run ios --workspace=@infinityhub/mobile
```

---

## 7. Development Credentials & Identities

| Role | Email | Password | Scope | Boundaries |
|---|---|---|---|---|
| **Super Admin** | `admin@infinityhub.io` | `admin123` | `platform` | SaaS platform management, plan quotas, module catalog. Blocked from customer records. |
| **Tenant Owner** | `rajesh@abcsupermarket.in` | `password` | `tenant` | Full store configuration, catalog CRUD, stock adjustments, purchases, reports. |
| **Store Manager** | `kavitha.mgr@abcsupermarket.in` | `password` | `tenant` | Catalog updates, purchases receipt, stock adjustments, reports. |
| **Store Staff** | `manoj.staff@abcsupermarket.in` | `password` | `tenant` | Read-only catalog and stock inquiry (restricted mutations). |
