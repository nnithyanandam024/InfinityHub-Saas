import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApkBuilderService } from './services/apkBuilderService.js';
import type {
  Product,
  Category,
  Supplier,
  Purchase,
  StockMovement,
  Tenant,
  PosOrder,
  PosOrderItem,
  Invoice,
  RegisterShift,
  CashDrawerMovement,
  PosCustomer,
  CustomerCreditTransaction,
  PosReturn,
  PosAuditLog,
  HsnSummaryLine
} from '@infinityhub/types';

export interface TenantData {
  tenant: Tenant;
  users?: any[];
  brands?: any[];
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  variants?: any[];
  bundles?: any[];
  purchases: Purchase[];
  stockMovements: StockMovement[];
  posOrders?: PosOrder[];
  invoices?: Invoice[];
  shifts?: RegisterShift[];
  cashMovements?: CashDrawerMovement[];
  posCustomers?: PosCustomer[];
  creditTransactions?: CustomerCreditTransaction[];
  posAuditLogs?: PosAuditLog[];
  posReturns?: PosReturn[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4000;
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.resolve(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-Memory Database with Disk Persistence
let tenantsState: Record<string, TenantData> = {};

function loadData(): Record<string, TenantData> {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch (err) {
      console.error('Error reading store.json, using defaults:', err);
    }
  }
  return {};
}

function persistData(data: Record<string, TenantData>) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist to store.json:', err);
  }
}

function numberToIndianWords(num: number): string {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'Zero Rupees Only';

  function formatSegment(val: number): string {
    let str = '';
    if (val > 99) {
      str += a[Math.floor(val / 100)] + ' Hundred ';
      val %= 100;
    }
    if (val > 19) {
      str += b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '') + ' ';
    } else if (val > 0) {
      str += a[val] + ' ';
    }
    return str.trim();
  }

  let str = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remainder = n % 1000;

  if (crore > 0) str += formatSegment(crore) + ' Crore ';
  if (lakh > 0) str += formatSegment(lakh) + ' Lakh ';
  if (thousand > 0) str += formatSegment(thousand) + ' Thousand ';
  if (remainder > 0) str += formatSegment(remainder) + ' ';

  return (str.trim() + ' Rupees Only');
}

function initTenantPosData(store: TenantData) {
  if (!store.posOrders) store.posOrders = [];
  if (!store.invoices) store.invoices = [];
  if (!store.shifts) store.shifts = [];
  if (!store.cashMovements) store.cashMovements = [];
  if (!store.posCustomers) store.posCustomers = [];
  if (!store.creditTransactions) store.creditTransactions = [];
  if (!store.posAuditLogs) store.posAuditLogs = [];
  if (!store.posReturns) store.posReturns = [];

  // Seed standard customers if empty
  if (store.posCustomers.length === 0) {
    store.posCustomers = [
      {
        id: 'cust-1',
        tenantId: store.tenant.id,
        name: 'Ramesh Kumar',
        phone: '98401 11223',
        address: '12 Gandhi Road, T. Nagar, Chennai',
        stateCode: '33',
        creditLimit: 15000,
        currentBalance: 1250,
        totalPurchases: 28400,
        createdAt: '2026-02-01T10:00:00Z',
        updatedAt: '2026-09-10T11:00:00Z'
      },
      {
        id: 'cust-2',
        tenantId: store.tenant.id,
        name: 'Sri Balaji Traders',
        phone: '98840 22334',
        email: 'balaji.traders@gmail.com',
        address: '45 Cross Cut Road, Coimbatore',
        gstin: '33AAECB4512E1Z8',
        stateCode: '33',
        creditLimit: 50000,
        currentBalance: 8400,
        totalPurchases: 145000,
        createdAt: '2026-01-15T09:00:00Z',
        updatedAt: '2026-09-08T15:30:00Z'
      },
      {
        id: 'cust-3',
        tenantId: store.tenant.id,
        name: 'Muthu Construction & Interiors',
        phone: '97900 33445',
        address: '88 Avinashi Road, Coimbatore',
        stateCode: '33',
        creditLimit: 30000,
        currentBalance: 0,
        totalPurchases: 62100,
        createdAt: '2026-03-10T12:00:00Z',
        updatedAt: '2026-09-01T16:00:00Z'
      }
    ];
  }

  // Seed City Retail products if empty
  if (store.tenant.id === 'tenant-city-retail' && store.products.length === 0) {
    const catPower = 'cat-pow-1';
    const catHand = 'cat-hnd-2';
    const catElec = 'cat-elc-3';
    const catFast = 'cat-fst-4';

    store.categories = [
      { id: catPower, tenantId: store.tenant.id, name: 'Power Tools', description: 'Electric drills, grinders, saws', productCount: 2, status: 'active', createdAt: '2026-01-20T08:00:00Z', updatedAt: '2026-01-20T08:00:00Z' },
      { id: catHand, tenantId: store.tenant.id, name: 'Hand Tools', description: 'Wrenches, pliers, screwdrivers', productCount: 1, status: 'active', createdAt: '2026-01-20T08:00:00Z', updatedAt: '2026-01-20T08:00:00Z' },
      { id: catElec, tenantId: store.tenant.id, name: 'Electrical & Lighting', description: 'Cables, batten lights, multimeters', productCount: 2, status: 'active', createdAt: '2026-01-20T08:00:00Z', updatedAt: '2026-01-20T08:00:00Z' },
      { id: catFast, tenantId: store.tenant.id, name: 'Fasteners & Hardware', description: 'Anchor fasteners, screws, bolts', productCount: 1, status: 'active', createdAt: '2026-01-20T08:00:00Z', updatedAt: '2026-01-20T08:00:00Z' }
    ];

    store.products = [
      {
        id: 'prod-cr-1',
        tenantId: store.tenant.id,
        name: 'Heavy-Duty Impact Drill 650W',
        sku: 'DRL-650W',
        barcode: '890455500201',
        hsnCode: '8467',
        categoryId: catPower,
        categoryName: 'Power Tools',
        costPrice: 1650,
        sellingPrice: 2499,
        mrp: 3199,
        taxRate: 18,
        stockQuantity: 15,
        minimumStock: 4,
        unit: 'pcs',
        status: 'active',
        imagePath: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
        createdAt: '2026-01-20T08:00:00Z',
        updatedAt: '2026-09-08T10:00:00Z'
      },
      {
        id: 'prod-cr-2',
        tenantId: store.tenant.id,
        name: 'Professional Rotary Angle Grinder 850W',
        sku: 'AG-850W',
        barcode: '890455500202',
        hsnCode: '8467',
        categoryId: catPower,
        categoryName: 'Power Tools',
        costPrice: 1200,
        sellingPrice: 1850,
        mrp: 2400,
        taxRate: 18,
        stockQuantity: 22,
        minimumStock: 5,
        unit: 'pcs',
        status: 'active',
        imagePath: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&auto=format&fit=crop&q=80',
        createdAt: '2026-01-20T08:00:00Z',
        updatedAt: '2026-09-08T10:00:00Z'
      },
      {
        id: 'prod-cr-3',
        tenantId: store.tenant.id,
        name: 'Copper Submersible Cable 3-Core 100M',
        sku: 'CBL-SUB-100M',
        barcode: '890455500203',
        hsnCode: '8544',
        categoryId: catElec,
        categoryName: 'Electrical & Lighting',
        costPrice: 2800,
        sellingPrice: 3750,
        mrp: 4500,
        taxRate: 18,
        stockQuantity: 10,
        minimumStock: 3,
        unit: 'meter',
        status: 'active',
        imagePath: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80',
        createdAt: '2026-01-20T08:00:00Z',
        updatedAt: '2026-09-08T10:00:00Z'
      },
      {
        id: 'prod-cr-4',
        tenantId: store.tenant.id,
        name: 'LED Batten Light 20W Cool Daylight',
        sku: 'LED-20W-CDL',
        barcode: '890455500204',
        hsnCode: '9405',
        categoryId: catElec,
        categoryName: 'Electrical & Lighting',
        costPrice: 140,
        sellingPrice: 220,
        mrp: 350,
        taxRate: 12,
        stockQuantity: 65,
        minimumStock: 15,
        unit: 'pcs',
        status: 'active',
        imagePath: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&auto=format&fit=crop&q=80',
        createdAt: '2026-01-20T08:00:00Z',
        updatedAt: '2026-09-08T10:00:00Z'
      },
      {
        id: 'prod-cr-5',
        tenantId: store.tenant.id,
        name: 'Stainless Steel Anchor Fastener Box 50pcs',
        sku: 'FST-SS-50P',
        barcode: '890455500205',
        hsnCode: '7318',
        categoryId: catFast,
        categoryName: 'Fasteners & Hardware',
        costPrice: 310,
        sellingPrice: 450,
        mrp: 600,
        taxRate: 18,
        stockQuantity: 40,
        minimumStock: 10,
        unit: 'box',
        status: 'active',
        imagePath: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=80',
        createdAt: '2026-01-20T08:00:00Z',
        updatedAt: '2026-09-08T10:00:00Z'
      },
      {
        id: 'prod-cr-6',
        tenantId: store.tenant.id,
        name: 'Digital Multimeter with Probe',
        sku: 'DMM-PRO-01',
        barcode: '890455500206',
        hsnCode: '9030',
        categoryId: catHand,
        categoryName: 'Hand Tools',
        costPrice: 450,
        sellingPrice: 680,
        mrp: 999,
        taxRate: 18,
        stockQuantity: 18,
        minimumStock: 4,
        unit: 'pcs',
        status: 'active',
        imagePath: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
        createdAt: '2026-01-20T08:00:00Z',
        updatedAt: '2026-09-08T10:00:00Z'
      }
    ];
  }

  // Ensure products have hsnCode & taxRate
  for (const prod of store.products) {
    if (!prod.hsnCode) prod.hsnCode = '8504';
    if (prod.taxRate === undefined) prod.taxRate = 18;
  }
}

tenantsState = loadData();
for (const store of Object.values(tenantsState)) {
  initTenantPosData(store);
}
persistData(tenantsState);

// Real-Time Event Hub (SSE & Recent Event Log)
export interface ServerSyncEvent {
  type: string;
  domain: string;
  tenantId: string;
  action: string;
  entityId?: string;
  data?: any;
  timestamp: string;
}

const sseClients = new Map<string, Set<http.ServerResponse>>();
const recentEvents: ServerSyncEvent[] = [];

function broadcastEvent(event: ServerSyncEvent) {
  recentEvents.push(event);
  if (recentEvents.length > 200) {
    recentEvents.shift();
  }

  const clients = sseClients.get(event.tenantId);
  if (clients && clients.size > 0) {
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const res of clients) {
      try {
        res.write(payload);
      } catch (err) {
        clients.delete(res);
      }
    }
  }
}

// Helper to read JSON request body
function parseJsonBody<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : ({} as T));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function sendError(res: http.ServerResponse, statusCode: number, message: string) {
  sendJson(res, statusCode, { error: true, message });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  try {
    // -------------------------------------------------------------
    // Health Check
    // -------------------------------------------------------------
    if (pathname === '/api/v1/health' && req.method === 'GET') {
      return sendJson(res, 200, {
        status: 'online',
        port: PORT,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      });
    }

    // -------------------------------------------------------------
    // Real-Time SSE Stream: /api/v1/sync/events?tenantId=...
    // -------------------------------------------------------------
    if (pathname === '/api/v1/sync/events' && req.method === 'GET') {
      const tenantId = searchParams.get('tenantId') || 'tenant-kumar-stores';

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      if (!sseClients.has(tenantId)) {
        sseClients.set(tenantId, new Set());
      }
      const clientSet = sseClients.get(tenantId)!;
      clientSet.add(res);

      res.write(`data: ${JSON.stringify({ type: 'sync:connected', tenantId, timestamp: new Date().toISOString() })}\n\n`);

      const keepAlive = setInterval(() => {
        try {
          res.write(': keep-alive\n\n');
        } catch {
          clearInterval(keepAlive);
        }
      }, 15000);

      req.on('close', () => {
        clearInterval(keepAlive);
        clientSet.delete(res);
        if (clientSet.size === 0) {
          sseClients.delete(tenantId);
        }
      });
      return;
    }

    // -------------------------------------------------------------
    // Real-Time Poll Fallback: /api/v1/sync/poll?tenantId=...&since=...
    // -------------------------------------------------------------
    if (pathname === '/api/v1/sync/poll' && req.method === 'GET') {
      const tenantId = searchParams.get('tenantId') || '';
      const since = searchParams.get('since') || '';

      const filtered = recentEvents.filter(
        e => (!tenantId || e.tenantId === tenantId) && (!since || e.timestamp > since)
      );
      return sendJson(res, 200, filtered);
    }

    // -------------------------------------------------------------
    // Tenant Store Data: GET /api/v1/inventory/data?tenantId=...
    // -------------------------------------------------------------
    if (pathname === '/api/v1/inventory/data' && req.method === 'GET') {
      const tenantId = searchParams.get('tenantId') || 'tenant-kumar-stores';
      const store = tenantsState[tenantId] || Object.values(tenantsState)[0];
      if (!store) {
        return sendError(res, 404, 'Store workspace not found');
      }
      return sendJson(res, 200, {
        tenant: store.tenant,
        products: store.products || [],
        categories: store.categories || [],
        brands: store.brands || [],
        suppliers: store.suppliers || [],
        purchases: store.purchases || [],
        stockMovements: store.stockMovements || []
      });
    }

    // -------------------------------------------------------------
    // Products Endpoints
    // -------------------------------------------------------------
    if (pathname === '/api/v1/inventory/products') {
      if (req.method === 'GET') {
        const tenantId = searchParams.get('tenantId') || 'tenant-kumar-stores';
        const store = tenantsState[tenantId];
        return sendJson(res, 200, store?.products || []);
      }

      if (req.method === 'POST') {
        const body = await parseJsonBody<any>(req);
        const tenantId = body.tenantId || 'tenant-kumar-stores';
        const store = tenantsState[tenantId];
        if (!store) return sendError(res, 404, 'Store not found');

        const newProd: Product = {
          id: `prod-${Date.now()}`,
          tenantId,
          name: body.name || 'New Product',
          sku: body.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          barcode: body.barcode || `890${Math.floor(100000000 + Math.random() * 900000000)}`,
          categoryId: body.categoryId || store.categories[0]?.id || 'cat-1',
          categoryName: body.categoryName || 'General',
          brandId: body.brandId,
          brandName: body.brandName,
          costPrice: Number(body.costPrice) || 0,
          sellingPrice: Number(body.sellingPrice) || 0,
          stockQuantity: Number(body.stockQuantity) || 0,
          minimumStock: Number(body.minimumStock) || 5,
          reorderQuantity: Number(body.reorderQuantity) || 20,
          unit: body.unit || 'pcs',
          status: 'active',
          imagePath: body.imagePath,
          thumbnailPath: body.thumbnailPath || body.imagePath,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        store.products.unshift(newProd);

        // Update category product count
        const cat = store.categories.find(c => c.id === newProd.categoryId);
        if (cat) {
          cat.productCount = (cat.productCount || 0) + 1;
        }

        persistData(tenantsState);

        broadcastEvent({
          type: 'product:created',
          domain: 'inventory',
          tenantId,
          action: 'create',
          entityId: newProd.id,
          data: newProd,
          timestamp: new Date().toISOString()
        });

        return sendJson(res, 201, newProd);
      }
    }

    // Product by ID: PUT, DELETE
    if (pathname.startsWith('/api/v1/inventory/products/')) {
      const productId = decodeURIComponent(pathname.replace('/api/v1/inventory/products/', ''));

      if (req.method === 'PUT') {
        const body = await parseJsonBody<any>(req);
        const tenantId = body.tenantId || 'tenant-kumar-stores';
        const store = tenantsState[tenantId];
        if (!store) return sendError(res, 404, 'Store not found');

        const index = store.products.findIndex(p => p.id === productId);
        if (index === -1) return sendError(res, 404, 'Product not found');

        const updated: Product = {
          ...store.products[index],
          ...body,
          updatedAt: new Date().toISOString()
        };
        store.products[index] = updated;
        persistData(tenantsState);

        broadcastEvent({
          type: 'product:updated',
          domain: 'inventory',
          tenantId,
          action: 'update',
          entityId: productId,
          data: updated,
          timestamp: new Date().toISOString()
        });

        return sendJson(res, 200, updated);
      }

      if (req.method === 'DELETE') {
        const tenantId = searchParams.get('tenantId') || 'tenant-kumar-stores';
        const store = tenantsState[tenantId];
        if (!store) return sendError(res, 404, 'Store not found');

        const target = store.products.find(p => p.id === productId);
        store.products = store.products.filter(p => p.id !== productId);

        if (target) {
          const cat = store.categories.find(c => c.id === target.categoryId);
          if (cat && cat.productCount > 0) {
            cat.productCount--;
          }
        }

        persistData(tenantsState);

        broadcastEvent({
          type: 'product:deleted',
          domain: 'inventory',
          tenantId,
          action: 'delete',
          entityId: productId,
          timestamp: new Date().toISOString()
        });

        return sendJson(res, 200, { success: true, id: productId });
      }
    }

    // -------------------------------------------------------------
    // Categories Endpoints
    // -------------------------------------------------------------
    if (pathname === '/api/v1/inventory/categories') {
      if (req.method === 'GET') {
        const tenantId = searchParams.get('tenantId') || 'tenant-kumar-stores';
        return sendJson(res, 200, tenantsState[tenantId]?.categories || []);
      }

      if (req.method === 'POST') {
        const body = await parseJsonBody<any>(req);
        const tenantId = body.tenantId || 'tenant-kumar-stores';
        const store = tenantsState[tenantId];
        if (!store) return sendError(res, 404, 'Store not found');

        const newCat: Category = {
          id: `cat-${Date.now()}`,
          tenantId,
          name: body.name || 'New Category',
          description: body.description || '',
          productCount: 0,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        store.categories.push(newCat);
        persistData(tenantsState);

        broadcastEvent({
          type: 'category:created',
          domain: 'inventory',
          tenantId,
          action: 'create',
          entityId: newCat.id,
          data: newCat,
          timestamp: new Date().toISOString()
        });

        return sendJson(res, 201, newCat);
      }
    }

    if (pathname.startsWith('/api/v1/inventory/categories/')) {
      const catId = decodeURIComponent(pathname.replace('/api/v1/inventory/categories/', ''));

      if (req.method === 'PUT') {
        const body = await parseJsonBody<any>(req);
        const tenantId = body.tenantId || 'tenant-kumar-stores';
        const store = tenantsState[tenantId];
        if (!store) return sendError(res, 404, 'Store not found');

        const index = store.categories.findIndex(c => c.id === catId);
        if (index === -1) return sendError(res, 404, 'Category not found');

        const updated: Category = {
          ...store.categories[index],
          ...body,
          updatedAt: new Date().toISOString()
        };
        store.categories[index] = updated;
        persistData(tenantsState);

        broadcastEvent({
          type: 'category:updated',
          domain: 'inventory',
          tenantId,
          action: 'update',
          entityId: catId,
          data: updated,
          timestamp: new Date().toISOString()
        });

        return sendJson(res, 200, updated);
      }

      if (req.method === 'DELETE') {
        const tenantId = searchParams.get('tenantId') || 'tenant-kumar-stores';
        const store = tenantsState[tenantId];
        if (!store) return sendError(res, 404, 'Store not found');

        const hasProducts = store.products.some(p => p.categoryId === catId);
        if (hasProducts) {
          return sendError(res, 400, 'Cannot delete category that contains assigned products');
        }

        store.categories = store.categories.filter(c => c.id !== catId);
        persistData(tenantsState);

        broadcastEvent({
          type: 'category:deleted',
          domain: 'inventory',
          tenantId,
          action: 'delete',
          entityId: catId,
          timestamp: new Date().toISOString()
        });

        return sendJson(res, 200, { success: true, id: catId });
      }
    }

    // -------------------------------------------------------------
    // Suppliers Endpoints
    // -------------------------------------------------------------
    if (pathname === '/api/v1/inventory/suppliers') {
      if (req.method === 'GET') {
        const tenantId = searchParams.get('tenantId') || 'tenant-kumar-stores';
        return sendJson(res, 200, tenantsState[tenantId]?.suppliers || []);
      }

      if (req.method === 'POST') {
        const body = await parseJsonBody<any>(req);
        const tenantId = body.tenantId || 'tenant-kumar-stores';
        const store = tenantsState[tenantId];
        if (!store) return sendError(res, 404, 'Store not found');

        const newSup: Supplier = {
          id: `sup-${Date.now()}`,
          tenantId,
          name: body.name,
          companyName: body.companyName || body.name,
          phone: body.phone || '',
          email: body.email || '',
          address: body.address || '',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        store.suppliers.push(newSup);
        persistData(tenantsState);

        broadcastEvent({
          type: 'supplier:created',
          domain: 'inventory',
          tenantId,
          action: 'create',
          entityId: newSup.id,
          data: newSup,
          timestamp: new Date().toISOString()
        });

        return sendJson(res, 201, newSup);
      }
    }

    if (pathname.startsWith('/api/v1/inventory/suppliers/')) {
      const supId = decodeURIComponent(pathname.replace('/api/v1/inventory/suppliers/', ''));

      if (req.method === 'PUT') {
        const body = await parseJsonBody<any>(req);
        const tenantId = body.tenantId || 'tenant-kumar-stores';
        const store = tenantsState[tenantId];
        if (!store) return sendError(res, 404, 'Store not found');

        const index = store.suppliers.findIndex(s => s.id === supId);
        if (index === -1) return sendError(res, 404, 'Supplier not found');

        const updated: Supplier = {
          ...store.suppliers[index],
          ...body,
          updatedAt: new Date().toISOString()
        };
        store.suppliers[index] = updated;
        persistData(tenantsState);

        broadcastEvent({
          type: 'supplier:updated',
          domain: 'inventory',
          tenantId,
          action: 'update',
          entityId: supId,
          data: updated,
          timestamp: new Date().toISOString()
        });

        return sendJson(res, 200, updated);
      }

      if (req.method === 'DELETE') {
        const tenantId = searchParams.get('tenantId') || 'tenant-kumar-stores';
        const store = tenantsState[tenantId];
        if (!store) return sendError(res, 404, 'Store not found');

        const hasPurchases = store.purchases.some(p => p.supplierId === supId);
        if (hasPurchases) {
          return sendError(res, 400, 'Cannot delete supplier with active purchase orders');
        }

        store.suppliers = store.suppliers.filter(s => s.id !== supId);
        persistData(tenantsState);

        broadcastEvent({
          type: 'supplier:deleted',
          domain: 'inventory',
          tenantId,
          action: 'delete',
          entityId: supId,
          timestamp: new Date().toISOString()
        });

        return sendJson(res, 200, { success: true, id: supId });
      }
    }

    // -------------------------------------------------------------
    // Purchases & Stock Inwarding Endpoints
    // -------------------------------------------------------------
    if (pathname === '/api/v1/inventory/purchases') {
      if (req.method === 'GET') {
        const tenantId = searchParams.get('tenantId') || 'tenant-kumar-stores';
        return sendJson(res, 200, tenantsState[tenantId]?.purchases || []);
      }

      if (req.method === 'POST') {
        const body = await parseJsonBody<any>(req);
        const tenantId = body.tenantId || 'tenant-kumar-stores';
        const store = tenantsState[tenantId];
        if (!store) return sendError(res, 404, 'Store not found');

        const newPo: Purchase = {
          id: `po-${Date.now()}`,
          tenantId,
          invoiceNumber: body.invoiceNumber || `PO-${Math.floor(1000 + Math.random() * 9000)}`,
          supplierId: body.supplierId,
          supplierName: body.supplierName || 'Wholesale Supplier',
          purchaseDate: body.purchaseDate || new Date().toISOString().split('T')[0],
          items: body.items || [],
          subtotal: Number(body.subtotal) || 0,
          tax: Number(body.tax) || 0,
          discount: Number(body.discount) || 0,
          totalAmount: Number(body.totalAmount) || 0,
          status: 'completed',
          notes: body.notes || '',
          createdAt: new Date().toISOString()
        };

        store.purchases.unshift(newPo);

        // Automatic Inward Stock Increment & Stock Movement Logging
        for (const item of newPo.items) {
          const product = store.products.find(p => p.id === item.productId);
          if (product) {
            const oldStock = product.stockQuantity;
            product.stockQuantity += item.quantity;
            product.updatedAt = new Date().toISOString();

            const movement: StockMovement = {
              id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              tenantId,
              productId: product.id,
              productName: product.name,
              type: 'purchase',
              quantityChange: item.quantity,
              previousStock: oldStock,
              newStock: product.stockQuantity,
              reason: `PO ${newPo.invoiceNumber} Inward Goods`,
              referenceId: newPo.id,
              createdAt: new Date().toISOString()
            };
            store.stockMovements.unshift(movement);
          }
        }

        persistData(tenantsState);

        broadcastEvent({
          type: 'purchase:created',
          domain: 'inventory',
          tenantId,
          action: 'create',
          entityId: newPo.id,
          data: newPo,
          timestamp: new Date().toISOString()
        });

        broadcastEvent({
          type: 'stock:adjusted',
          domain: 'inventory',
          tenantId,
          action: 'adjust',
          timestamp: new Date().toISOString()
        });

        return sendJson(res, 201, newPo);
      }
    }

    if (pathname.startsWith('/api/v1/inventory/purchases/')) {
      const poId = decodeURIComponent(pathname.replace('/api/v1/inventory/purchases/', ''));

      if (req.method === 'DELETE') {
        const tenantId = searchParams.get('tenantId') || 'tenant-kumar-stores';
        const store = tenantsState[tenantId];
        if (!store) return sendError(res, 404, 'Store not found');

        const po = store.purchases.find(p => p.id === poId);
        if (!po) return sendError(res, 404, 'Purchase order not found');

        // Roll back inwarded stock
        for (const item of po.items) {
          const product = store.products.find(p => p.id === item.productId);
          if (product) {
            const oldStock = product.stockQuantity;
            product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
            product.updatedAt = new Date().toISOString();

            const movement: StockMovement = {
              id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              tenantId,
              productId: product.id,
              productName: product.name,
              type: 'adjustment_decrease',
              quantityChange: -item.quantity,
              previousStock: oldStock,
              newStock: product.stockQuantity,
              reason: `Void PO ${po.invoiceNumber} Inventory Reversal`,
              referenceId: po.id,
              createdAt: new Date().toISOString()
            };
            store.stockMovements.unshift(movement);
          }
        }

        store.purchases = store.purchases.filter(p => p.id !== poId);
        persistData(tenantsState);

        broadcastEvent({
          type: 'purchase:deleted',
          domain: 'inventory',
          tenantId,
          action: 'delete',
          entityId: poId,
          timestamp: new Date().toISOString()
        });

        broadcastEvent({
          type: 'stock:adjusted',
          domain: 'inventory',
          tenantId,
          action: 'adjust',
          timestamp: new Date().toISOString()
        });

        return sendJson(res, 200, { success: true, id: poId });
      }
    }

    // -------------------------------------------------------------
    // Stock Adjustments Endpoint: POST /api/v1/inventory/stock/adjust
    // -------------------------------------------------------------
    if (pathname === '/api/v1/inventory/stock/adjust' && req.method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const tenantId = body.tenantId || 'tenant-kumar-stores';
      const productId = body.productId;
      const newStock = Number(body.newStock);
      const reason = body.reason || 'Manual Adjustment';

      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store not found');

      const product = store.products.find(p => p.id === productId);
      if (!product) return sendError(res, 404, 'Product not found');

      const oldStock = product.stockQuantity;
      let calculatedStock = oldStock;
      if (body.newStock !== undefined) {
        calculatedStock = Number(body.newStock);
      } else if (body.delta !== undefined) {
        calculatedStock = oldStock + Number(body.delta);
      }
      product.stockQuantity = Math.max(0, calculatedStock);
      product.updatedAt = new Date().toISOString();

      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        tenantId,
        productId: product.id,
        productName: product.name,
        type: newStock > oldStock ? 'adjustment_increase' : 'adjustment_decrease',
        quantityChange: newStock - oldStock,
        previousStock: oldStock,
        newStock: product.stockQuantity,
        reason,
        createdAt: new Date().toISOString()
      };
      store.stockMovements.unshift(movement);
      persistData(tenantsState);

      broadcastEvent({
        type: 'stock:adjusted',
        domain: 'inventory',
        tenantId,
        action: 'adjust',
        entityId: product.id,
        data: { product, movement },
        timestamp: new Date().toISOString()
      });

      return sendJson(res, 200, { product, movement });
    }

    // Stock movements list
    if (pathname === '/api/v1/inventory/stock/movements' && req.method === 'GET') {
      const tenantId = searchParams.get('tenantId') || 'tenant-kumar-stores';
      return sendJson(res, 200, tenantsState[tenantId]?.stockMovements || []);
    }

    // =============================================================
    // BILLING & POS DOMAIN (India Retail & GST Rule 46 Compliant)
    // =============================================================

    // -------------------------------------------------------------
    // POS Init / Catalog & Terminal State: GET /api/v1/pos/init?tenantId=...
    // -------------------------------------------------------------
    if (pathname === '/api/v1/pos/init' && req.method === 'GET') {
      const tenantId = searchParams.get('tenantId') || 'tenant-city-retail';
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store not found');
      initTenantPosData(store);

      const activeShift = store.shifts?.find(s => s.status === 'open') || null;

      const taxConfig = {
        gstin: store.tenant.settings?.taxNumber || (store.tenant.id === 'tenant-kumar-stores' ? '33AAECK1234F1Z5' : '33AABCC7890D1Z2'),
        pan: 'AABCC7890D',
        state: 'Tamil Nadu',
        stateCode: '33',
        legalName: store.tenant.name,
        tradeName: store.tenant.name,
        address: store.tenant.address || 'Chennai, Tamil Nadu',
        phone: store.tenant.phone || '+91 98401 23456',
        upiId: `${store.tenant.slug || 'store'}@upi`,
        currency: 'INR',
        currencySymbol: '₹'
      };

      return sendJson(res, 200, {
        products: store.products || [],
        categories: store.categories || [],
        currentShift: activeShift,
        recentInvoices: (store.invoices || []).slice(0, 25),
        customers: store.posCustomers || [],
        taxConfig
      });
    }

    // -------------------------------------------------------------
    // Active Shift Status: GET /api/v1/pos/shifts/current?tenantId=...
    // -------------------------------------------------------------
    if (pathname === '/api/v1/pos/shifts/current' && req.method === 'GET') {
      const tenantId = searchParams.get('tenantId') || 'tenant-city-retail';
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store not found');
      initTenantPosData(store);

      const shift = store.shifts?.find(s => s.status === 'open') || null;
      return sendJson(res, 200, { shift });
    }

    // -------------------------------------------------------------
    // Open Register Shift: POST /api/v1/pos/shifts/open
    // -------------------------------------------------------------
    if (pathname === '/api/v1/pos/shifts/open' && req.method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const tenantId = body.tenantId || 'tenant-city-retail';
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store not found');
      initTenantPosData(store);

      const existing = store.shifts?.find(s => s.status === 'open');
      if (existing) {
        return sendError(res, 400, 'A shift is already currently open on this register');
      }

      const startingFloat = Number(body.startingFloat) || 0;
      const newShift: RegisterShift = {
        id: `shift-${Date.now()}`,
        tenantId,
        registerId: body.registerId || 'REG-01',
        cashierId: body.cashierId || 'usr-1',
        cashierName: body.cashierName || 'Cashier',
        startTime: new Date().toISOString(),
        status: 'open',
        startingFloat,
        cashSales: 0,
        upiSales: 0,
        cardSales: 0,
        creditKhataSales: 0,
        cashIn: 0,
        cashOut: 0,
        expectedCashInDrawer: startingFloat,
        totalTransactions: 0,
        voidCount: 0,
        noSaleDrawerPopCount: 0,
        notes: body.notes
      };

      store.shifts?.unshift(newShift);

      const floatMovement: CashDrawerMovement = {
        id: `mov-float-${Date.now()}`,
        shiftId: newShift.id,
        tenantId,
        cashierId: newShift.cashierId,
        cashierName: newShift.cashierName,
        type: 'float_in',
        amount: startingFloat,
        reason: 'Initial Shift Cash Float',
        timestamp: new Date().toISOString()
      };
      store.cashMovements?.unshift(floatMovement);

      persistData(tenantsState);

      broadcastEvent({
        type: 'pos:shift_opened',
        domain: 'pos',
        tenantId,
        action: 'open_shift',
        entityId: newShift.id,
        data: newShift,
        timestamp: new Date().toISOString()
      });

      return sendJson(res, 201, { shift: newShift });
    }

    // -------------------------------------------------------------
    // Cash Drawer Movement / No-Sale Drawer Pop: POST /api/v1/pos/shifts/movement
    // -------------------------------------------------------------
    if (pathname === '/api/v1/pos/shifts/movement' && req.method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const tenantId = body.tenantId || 'tenant-city-retail';
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store not found');
      initTenantPosData(store);

      const shift = store.shifts?.find(s => s.status === 'open');
      if (!shift) return sendError(res, 400, 'No active open shift found');

      const amount = Number(body.amount) || 0;
      const type = body.type as 'cash_in' | 'cash_out' | 'drawer_pop_no_sale';

      if (type === 'cash_in') {
        shift.cashIn += amount;
        shift.expectedCashInDrawer += amount;
      } else if (type === 'cash_out') {
        shift.cashOut += amount;
        shift.expectedCashInDrawer = Math.max(0, shift.expectedCashInDrawer - amount);
      } else if (type === 'drawer_pop_no_sale') {
        shift.noSaleDrawerPopCount++;
      }

      const movement: CashDrawerMovement = {
        id: `mov-${Date.now()}`,
        shiftId: shift.id,
        tenantId,
        cashierId: body.cashierId || shift.cashierId,
        cashierName: body.cashierName || shift.cashierName,
        type,
        amount,
        reason: body.reason || 'Manual Drawer Action',
        managerApprovedBy: body.managerApprovedBy,
        timestamp: new Date().toISOString()
      };
      store.cashMovements?.unshift(movement);

      if (type === 'drawer_pop_no_sale') {
        store.posAuditLogs?.unshift({
          id: `audit-${Date.now()}`,
          tenantId,
          cashierId: shift.cashierId,
          cashierName: shift.cashierName,
          action: 'drawer_pop',
          managerApprovedBy: body.managerApprovedBy,
          reason: body.reason,
          details: { shiftId: shift.id },
          timestamp: new Date().toISOString()
        });
      }

      persistData(tenantsState);

      broadcastEvent({
        type: 'pos:drawer_moved',
        domain: 'pos',
        tenantId,
        action: 'drawer_movement',
        entityId: movement.id,
        data: { shift, movement },
        timestamp: new Date().toISOString()
      });

      return sendJson(res, 200, { shift, movement });
    }

    // -------------------------------------------------------------
    // Close Register Shift (Z-Report): POST /api/v1/pos/shifts/close
    // -------------------------------------------------------------
    if (pathname === '/api/v1/pos/shifts/close' && req.method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const tenantId = body.tenantId || 'tenant-city-retail';
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store not found');
      initTenantPosData(store);

      const shift = store.shifts?.find(s => s.status === 'open');
      if (!shift) return sendError(res, 400, 'No active open shift found to close');

      const actualCashCounted = Number(body.actualCashCounted) || 0;
      shift.status = 'closed';
      shift.endTime = new Date().toISOString();
      (shift as any).closedAt = shift.endTime;
      shift.actualCashCounted = actualCashCounted;
      shift.cashVariance = actualCashCounted - shift.expectedCashInDrawer;
      shift.closedBy = body.closedBy || shift.cashierName;
      if (body.notes) shift.notes = (shift.notes ? shift.notes + ' | ' : '') + body.notes;

      store.posAuditLogs?.unshift({
        id: `audit-${Date.now()}`,
        tenantId,
        cashierId: shift.cashierId,
        cashierName: shift.cashierName,
        action: 'shift_close',
        details: {
          shiftId: shift.id,
          expectedCash: shift.expectedCashInDrawer,
          actualCash: actualCashCounted,
          variance: shift.cashVariance
        },
        timestamp: new Date().toISOString()
      });

      persistData(tenantsState);

      broadcastEvent({
        type: 'pos:shift_closed',
        domain: 'pos',
        tenantId,
        action: 'close_shift',
        entityId: shift.id,
        data: shift,
        timestamp: new Date().toISOString()
      });

      return sendJson(res, 200, { shift });
    }

    // -------------------------------------------------------------
    // Shift History: GET /api/v1/pos/shifts?tenantId=...
    // -------------------------------------------------------------
    if (pathname === '/api/v1/pos/shifts' && req.method === 'GET') {
      const tenantId = searchParams.get('tenantId') || 'tenant-city-retail';
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store not found');
      initTenantPosData(store);

      return sendJson(res, 200, store.shifts || []);
    }

    // -------------------------------------------------------------
    // High-Speed POS Checkout & Rule 46 GST Invoicing: POST /api/v1/pos/checkout
    // -------------------------------------------------------------
    if (pathname === '/api/v1/pos/checkout' && req.method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const tenantId = body.tenantId || 'tenant-city-retail';
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store not found');
      initTenantPosData(store);

      const itemsPayload: any[] = body.items || [];
      if (itemsPayload.length === 0) {
        return sendError(res, 400, 'Cannot checkout an empty cart');
      }

      // 1. Generate Rule 46 Alphanumeric Invoice Number (e.g. INV/2026-27/0001)
      const fy = '2026-27';
      const invoiceSeq = (store.invoices?.length || 0) + 1;
      const invoiceNumber = `INV/${fy}/${String(invoiceSeq).padStart(4, '0')}`;
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const orderId = `pos-ord-${Date.now()}`;
      const invoiceId = `inv-${Date.now()}`;

      // 2. Tax Determination (Intra-state vs Inter-state)
      const tenantStateCode = '33'; // Tamil Nadu default
      const customerStateCode = body.customerStateCode || tenantStateCode;
      const isInterState = customerStateCode !== tenantStateCode;

      // 3. Process Line Items and Calculate Taxes
      let subtotal = 0;
      let totalDiscount = 0;
      let taxableAmount = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;

      const processedItems: PosOrderItem[] = [];
      const hsnMap: Record<string, HsnSummaryLine> = {};

      for (const item of itemsPayload) {
        const product = store.products.find(p => p.id === item.productId);
        const qty = Number(item.quantity) || 1;
        const unitPrice = Number(item.unitPrice) || product?.sellingPrice || 0;
        const mrp = Number(item.mrp) || product?.mrp || unitPrice;
        const discountPercent = Number(item.discountPercent) || 0;
        const discountAmount = Math.round(((unitPrice * discountPercent) / 100) * 100) / 100;
        const netPrice = Math.max(0, unitPrice - discountAmount);
        const lineTotal = Math.round(netPrice * qty * 100) / 100;
        const taxRate = Number(item.taxRate) || product?.taxRate || 18;
        const hsnCode = item.hsnCode || product?.hsnCode || '8504';

        // Retail pricing in India is tax-inclusive:
        // Taxable Value = Line Total / (1 + Rate/100)
        const lineTaxable = Math.round((lineTotal / (1 + taxRate / 100)) * 100) / 100;
        const lineTax = Math.round((lineTotal - lineTaxable) * 100) / 100;

        let cgstRate = 0, cgstAmount = 0, sgstRate = 0, sgstAmount = 0, igstRate = 0, igstAmount = 0;
        if (!isInterState) {
          cgstRate = taxRate / 2;
          sgstRate = taxRate / 2;
          cgstAmount = Math.round((lineTax / 2) * 100) / 100;
          sgstAmount = Math.round((lineTax - cgstAmount) * 100) / 100;
          totalCgst += cgstAmount;
          totalSgst += sgstAmount;
        } else {
          igstRate = taxRate;
          igstAmount = lineTax;
          totalIgst += igstAmount;
        }

        subtotal += unitPrice * qty;
        totalDiscount += discountAmount * qty;
        taxableAmount += lineTaxable;

        const lineItemObj: PosOrderItem = {
          productId: item.productId,
          productName: item.productName || product?.name || 'Product',
          sku: item.sku || product?.sku || 'SKU',
          barcode: item.barcode || product?.barcode,
          hsnCode,
          unitPrice,
          mrp,
          quantity: qty,
          unit: item.unit || product?.unit || 'pcs',
          discountPercent,
          discountAmount: discountAmount * qty,
          taxRate,
          cgstRate,
          cgstAmount,
          sgstRate,
          sgstAmount,
          igstRate,
          igstAmount,
          taxableAmount: lineTaxable,
          total: lineTotal
        };
        processedItems.push(lineItemObj);

        // Aggregate into HSN summary
        if (!hsnMap[hsnCode]) {
          hsnMap[hsnCode] = {
            hsnCode,
            taxableValue: 0,
            cgstRate,
            cgstAmount: 0,
            sgstRate,
            sgstAmount: 0,
            igstRate,
            igstAmount: 0,
            totalTax: 0
          };
        }
        hsnMap[hsnCode].taxableValue = Math.round((hsnMap[hsnCode].taxableValue + lineTaxable) * 100) / 100;
        hsnMap[hsnCode].cgstAmount = Math.round((hsnMap[hsnCode].cgstAmount + cgstAmount) * 100) / 100;
        hsnMap[hsnCode].sgstAmount = Math.round((hsnMap[hsnCode].sgstAmount + sgstAmount) * 100) / 100;
        hsnMap[hsnCode].igstAmount = Math.round((hsnMap[hsnCode].igstAmount + igstAmount) * 100) / 100;
        hsnMap[hsnCode].totalTax = Math.round((hsnMap[hsnCode].totalTax + lineTax) * 100) / 100;

        // Deduct inventory stock in real-time
        if (product) {
          const oldStock = product.stockQuantity;
          product.stockQuantity = Math.max(0, product.stockQuantity - qty);
          product.updatedAt = new Date().toISOString();

          store.stockMovements.unshift({
            id: `mov-pos-${Date.now()}-${product.id}`,
            tenantId,
            productId: product.id,
            productName: product.name,
            type: 'sale',
            quantityChange: -qty,
            previousStock: oldStock,
            newStock: product.stockQuantity,
            reason: `POS Sale: ${invoiceNumber}`,
            createdAt: new Date().toISOString()
          });
        }
      }

      const totalTax = totalCgst + totalSgst + totalIgst;
      const rawGrandTotal = taxableAmount + totalTax;
      const grandTotal = Math.round(rawGrandTotal);
      const roundingAdjustment = Math.round((grandTotal - rawGrandTotal) * 100) / 100;

      // 4. Payments Handling & Validation
      const payments: any[] = body.payments && body.payments.length > 0 ? body.payments : [
        { method: 'cash', amount: grandTotal }
      ];

      let cashTendered = 0;
      let upiTendered = 0;
      let cardTendered = 0;
      let creditKhataTendered = 0;

      for (const p of payments) {
        if (p.method === 'cash') cashTendered += Number(p.amount) || 0;
        else if (p.method === 'upi') upiTendered += Number(p.amount) || 0;
        else if (p.method === 'card') cardTendered += Number(p.amount) || 0;
        else if (p.method === 'credit_khata') creditKhataTendered += Number(p.amount) || 0;
      }

      const totalTendered = Number(body.tenderedAmount) || (cashTendered + upiTendered + cardTendered + creditKhataTendered);
      const changeDue = Math.max(0, totalTendered - grandTotal);

      // Handle Customer Credit / Khata
      if (creditKhataTendered > 0 && body.customerId) {
        const cust = store.posCustomers?.find(c => c.id === body.customerId);
        if (cust) {
          cust.currentBalance += creditKhataTendered;
          cust.totalPurchases += grandTotal;
          cust.updatedAt = new Date().toISOString();

          store.creditTransactions?.unshift({
            id: `khata-tx-${Date.now()}`,
            customerId: cust.id,
            tenantId,
            invoiceId,
            type: 'credit_sale',
            amount: creditKhataTendered,
            balanceAfter: cust.currentBalance,
            reference: invoiceNumber,
            notes: `Store Credit Purchase: ${invoiceNumber}`,
            createdAt: new Date().toISOString()
          });
        }
      }

      // Update Active Shift Registers
      const activeShift = store.shifts?.find(s => s.status === 'open');
      if (activeShift) {
        activeShift.cashSales += Math.max(0, cashTendered - changeDue);
        activeShift.upiSales += upiTendered;
        activeShift.cardSales += cardTendered;
        activeShift.creditKhataSales += creditKhataTendered;
        activeShift.expectedCashInDrawer += Math.max(0, cashTendered - changeDue);
        activeShift.totalTransactions++;
      }

      // Dynamic UPI Payment QR Code string
      const upiId = `${store.tenant.slug || 'store'}@upi`;
      const upiQrString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(store.tenant.name)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Invoice ' + invoiceNumber)}`;

      const posOrder: PosOrder = {
        id: orderId,
        orderNumber,
        invoiceNumber,
        tenantId,
        cashierId: body.cashierId || 'usr-1',
        cashierName: body.cashierName || 'Cashier',
        customerId: body.customerId,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerGstin: body.customerGstin,
        customerStateCode,
        items: processedItems,
        subtotal,
        totalDiscount,
        taxableAmount,
        totalCgst,
        totalSgst,
        totalIgst,
        totalTax,
        roundingAdjustment,
        grandTotal,
        tenderedAmount: totalTendered,
        changeDue,
        payments,
        paymentStatus: 'paid',
        orderStatus: 'completed',
        upiQrString,
        notes: body.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const invoice: Invoice = {
        id: invoiceId,
        invoiceNumber,
        orderId,
        tenantId,
        tenantName: store.tenant.name,
        tenantAddress: store.tenant.address || 'Chennai, Tamil Nadu',
        tenantGstin: store.tenant.settings?.taxNumber || '33AABCC7890D1Z2',
        tenantPan: 'AABCC7890D',
        tenantState: 'Tamil Nadu',
        tenantStateCode,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerGstin: body.customerGstin,
        customerAddress: body.customerAddress,
        customerStateCode,
        invoiceDate: new Date().toISOString(),
        isInterState,
        items: processedItems,
        hsnSummary: Object.values(hsnMap),
        subtotal,
        totalDiscount,
        taxableAmount,
        totalCgst,
        totalSgst,
        totalIgst,
        totalTax,
        roundingAdjustment,
        grandTotal,
        grandTotalInWords: numberToIndianWords(grandTotal),
        payments,
        qrPayload: upiQrString,
        createdAt: new Date().toISOString()
      };

      store.posOrders?.unshift(posOrder);
      store.invoices?.unshift(invoice);

      persistData(tenantsState);

      // Real-time Event Broadcaster
      broadcastEvent({
        type: 'pos:order_created',
        domain: 'pos',
        tenantId,
        action: 'checkout',
        entityId: orderId,
        data: { order: posOrder, invoice },
        timestamp: new Date().toISOString()
      });

      broadcastEvent({
        type: 'stock:adjusted',
        domain: 'inventory',
        tenantId,
        action: 'pos_sale',
        timestamp: new Date().toISOString()
      });

      return sendJson(res, 201, { order: posOrder, invoice });
    }

    // -------------------------------------------------------------
    // Invoices List: GET /api/v1/pos/invoices?tenantId=...
    // -------------------------------------------------------------
    if (pathname === '/api/v1/pos/invoices' && req.method === 'GET') {
      const tenantId = searchParams.get('tenantId') || 'tenant-city-retail';
      const search = (searchParams.get('search') || '').toLowerCase();
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store not found');
      initTenantPosData(store);

      let list = store.invoices || [];
      if (search) {
        list = list.filter(inv =>
          inv.invoiceNumber.toLowerCase().includes(search) ||
          inv.customerName?.toLowerCase().includes(search) ||
          inv.customerPhone?.includes(search)
        );
      }

      return sendJson(res, 200, list);
    }

    // -------------------------------------------------------------
    // Single Invoice Details: GET /api/v1/pos/invoices/:id
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/v1/pos/invoices/') && req.method === 'GET') {
      const parts = pathname.split('/');
      const invoiceId = parts[parts.length - 1];
      const tenantId = searchParams.get('tenantId') || 'tenant-city-retail';
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store not found');
      initTenantPosData(store);

      const inv = store.invoices?.find(i => i.id === invoiceId || i.invoiceNumber === invoiceId);
      if (!inv) return sendError(res, 404, 'Invoice not found');

      return sendJson(res, 200, inv);
    }

    // -------------------------------------------------------------
    // Verified Return & Credit Note: POST /api/v1/pos/invoices/:id/return
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/v1/pos/invoices/') && pathname.endsWith('/return') && req.method === 'POST') {
      const parts = pathname.split('/');
      const invoiceId = parts[parts.length - 2];
      const body = await parseJsonBody<any>(req);
      const tenantId = body.tenantId || 'tenant-city-retail';
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store not found');
      initTenantPosData(store);

      const inv = store.invoices?.find(i => i.id === invoiceId || i.invoiceNumber === invoiceId);
      if (!inv) return sendError(res, 404, 'Original invoice not found');

      const returnedItemsPayload: any[] = body.returnedItems || body.items || [];
      if (returnedItemsPayload.length === 0) {
        return sendError(res, 400, 'No return items specified');
      }

      let totalRefund = 0;
      for (const ret of returnedItemsPayload) {
        totalRefund += Number(ret.refundAmount) || 0;

        // Restore stock
        const prod = store.products.find(p => p.id === ret.productId);
        if (prod) {
          const oldStock = prod.stockQuantity;
          prod.stockQuantity += Number(ret.quantity) || 1;
          prod.updatedAt = new Date().toISOString();

          store.stockMovements.unshift({
            id: `mov-ret-${Date.now()}-${prod.id}`,
            tenantId,
            productId: prod.id,
            productName: prod.name,
            type: 'adjustment_increase',
            quantityChange: Number(ret.quantity) || 1,
            previousStock: oldStock,
            newStock: prod.stockQuantity,
            reason: `Sales Return (CN): ${inv.invoiceNumber}`,
            createdAt: new Date().toISOString()
          });
        }
      }

      const cnNumber = `CN/2026-27/${String((store.posReturns?.length || 0) + 1).padStart(4, '0')}`;
      const posReturn: PosReturn = {
        id: `ret-${Date.now()}`,
        originalInvoiceId: inv.id,
        originalInvoiceNumber: inv.invoiceNumber,
        creditNoteNumber: cnNumber,
        tenantId,
        cashierId: body.cashierId || 'usr-1',
        cashierName: body.cashierName || 'Cashier',
        managerApprovedBy: body.managerApprovedBy,
        returnedItems: returnedItemsPayload,
        totalRefundAmount: totalRefund,
        refundMethod: body.refundMethod || 'cash',
        createdAt: new Date().toISOString()
      };

      store.posReturns?.unshift(posReturn);

      // Handle Cash Drawer payout
      const activeShift = store.shifts?.find(s => s.status === 'open');
      if (activeShift && posReturn.refundMethod === 'cash') {
        activeShift.cashOut += totalRefund;
        activeShift.expectedCashInDrawer = Math.max(0, activeShift.expectedCashInDrawer - totalRefund);

        store.cashMovements?.unshift({
          id: `mov-refund-${Date.now()}`,
          shiftId: activeShift.id,
          tenantId,
          cashierId: posReturn.cashierId,
          cashierName: posReturn.cashierName,
          type: 'refund_cash',
          amount: totalRefund,
          reason: `Cash Refund: ${cnNumber}`,
          timestamp: new Date().toISOString()
        });
      }

      persistData(tenantsState);

      broadcastEvent({
        type: 'pos:return_created',
        domain: 'pos',
        tenantId,
        action: 'return',
        entityId: posReturn.id,
        data: posReturn,
        timestamp: new Date().toISOString()
      });

      broadcastEvent({
        type: 'stock:adjusted',
        domain: 'inventory',
        tenantId,
        action: 'return_restock',
        timestamp: new Date().toISOString()
      });

      return sendJson(res, 201, { creditNoteNumber: cnNumber, posReturn });
    }

    // -------------------------------------------------------------
    // Manager Void Invoice (Audited): POST /api/v1/pos/invoices/:id/void
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/v1/pos/invoices/') && pathname.endsWith('/void') && req.method === 'POST') {
      const parts = pathname.split('/');
      const invoiceId = parts[parts.length - 2];
      const body = await parseJsonBody<any>(req);
      const tenantId = body.tenantId || 'tenant-city-retail';
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store not found');
      initTenantPosData(store);

      const inv = store.invoices?.find(i => i.id === invoiceId || i.invoiceNumber === invoiceId);
      if (!inv) return sendError(res, 404, 'Invoice not found');

      // Security PIN check: '1234' or 'password123'
      const pin = body.managerPin || '';
      if (pin !== '1234' && pin !== 'password123' && !body.managerApprovedBy) {
        return sendError(res, 403, 'Invalid Manager Security PIN');
      }

      (inv as any).status = 'voided';
      const order = store.posOrders?.find(o => o.id === inv.orderId || o.invoiceNumber === inv.invoiceNumber);
      if (order) {
        order.orderStatus = 'voided';
        order.updatedAt = new Date().toISOString();
      }

      // Revert stock deductions
      for (const item of inv.items) {
        const prod = store.products.find(p => p.id === item.productId);
        if (prod) {
          const oldStock = prod.stockQuantity;
          prod.stockQuantity += item.quantity;
          prod.updatedAt = new Date().toISOString();

          store.stockMovements.unshift({
            id: `mov-void-${Date.now()}-${prod.id}`,
            tenantId,
            productId: prod.id,
            productName: prod.name,
            type: 'correction',
            quantityChange: item.quantity,
            previousStock: oldStock,
            newStock: prod.stockQuantity,
            reason: `Invoice Voided: ${inv.invoiceNumber} (${body.reason || 'Manager Void'})`,
            createdAt: new Date().toISOString()
          });
        }
      }

      // Update active shift void count
      const activeShift = store.shifts?.find(s => s.status === 'open');
      if (activeShift) {
        activeShift.voidCount++;
      }

      // Mandatory immutable audit trail entry
      store.posAuditLogs?.unshift({
        id: `audit-void-${Date.now()}`,
        tenantId,
        cashierId: body.cashierId || 'usr-1',
        cashierName: body.cashierName || 'Cashier',
        action: 'ticket_void',
        entityId: inv.invoiceNumber,
        managerApprovedBy: body.managerApprovedBy || 'Manager (PIN)',
        reason: body.reason || 'Customer canceled / Incorrect tender',
        details: { grandTotal: inv.grandTotal },
        timestamp: new Date().toISOString()
      });

      persistData(tenantsState);

      broadcastEvent({
        type: 'pos:invoice_voided',
        domain: 'pos',
        tenantId,
        action: 'void',
        entityId: inv.id,
        timestamp: new Date().toISOString()
      });

      broadcastEvent({
        type: 'stock:adjusted',
        domain: 'inventory',
        tenantId,
        action: 'void_restock',
        timestamp: new Date().toISOString()
      });

      return sendJson(res, 200, { success: true, invoiceNumber: inv.invoiceNumber });
    }

    // -------------------------------------------------------------
    // Customers & Khata Ledger: GET /api/v1/pos/customers?tenantId=...
    // -------------------------------------------------------------
    if (pathname === '/api/v1/pos/customers' && req.method === 'GET') {
      const tenantId = searchParams.get('tenantId') || 'tenant-city-retail';
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store not found');
      initTenantPosData(store);

      return sendJson(res, 200, store.posCustomers || []);
    }

    // -------------------------------------------------------------
    // Create / Update Customer: POST /api/v1/pos/customers
    // -------------------------------------------------------------
    if (pathname === '/api/v1/pos/customers' && req.method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const tenantId = body.tenantId || 'tenant-city-retail';
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store not found');
      initTenantPosData(store);

      const newCust: PosCustomer = {
        id: body.id || `cust-${Date.now()}`,
        tenantId,
        name: body.name || 'Walk-in Customer',
        phone: body.phone || '',
        email: body.email,
        address: body.address,
        gstin: body.gstin,
        stateCode: body.stateCode || '33',
        creditLimit: Number(body.creditLimit) || 10000,
        currentBalance: Number(body.currentBalance) || 0,
        totalPurchases: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const existingIndex = store.posCustomers?.findIndex(c => c.id === newCust.id || (newCust.phone && c.phone === newCust.phone));
      if (existingIndex !== undefined && existingIndex >= 0 && store.posCustomers) {
        store.posCustomers[existingIndex] = { ...store.posCustomers[existingIndex], ...newCust };
      } else {
        store.posCustomers?.unshift(newCust);
      }

      persistData(tenantsState);
      return sendJson(res, 201, newCust);
    }

    // -------------------------------------------------------------
    // Record Khata Payment Received: POST /api/v1/pos/customers/:id/payment
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/v1/pos/customers/') && pathname.endsWith('/payment') && req.method === 'POST') {
      const parts = pathname.split('/');
      const customerId = parts[parts.length - 2];
      const body = await parseJsonBody<any>(req);
      const tenantId = body.tenantId || 'tenant-city-retail';
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store not found');
      initTenantPosData(store);

      const cust = store.posCustomers?.find(c => c.id === customerId);
      if (!cust) return sendError(res, 404, 'Customer not found');

      const paymentAmount = Number(body.amount) || 0;
      cust.currentBalance = Math.max(0, cust.currentBalance - paymentAmount);
      cust.updatedAt = new Date().toISOString();

      const tx: CustomerCreditTransaction = {
        id: `khata-pay-${Date.now()}`,
        customerId: cust.id,
        tenantId,
        type: 'payment_received',
        amount: paymentAmount,
        balanceAfter: cust.currentBalance,
        paymentMethod: body.paymentMethod || 'cash',
        reference: body.reference || 'Khata Settlement',
        notes: body.notes,
        createdAt: new Date().toISOString()
      };
      store.creditTransactions?.unshift(tx);

      // If paid by cash, add to active shift
      const activeShift = store.shifts?.find(s => s.status === 'open');
      if (activeShift && tx.paymentMethod === 'cash') {
        activeShift.cashIn += paymentAmount;
        activeShift.expectedCashInDrawer += paymentAmount;
      }

      persistData(tenantsState);
      return sendJson(res, 200, { customer: cust, transaction: tx });
    }

    // -------------------------------------------------------------
    // White-Label Branded APK: GET /api/v1/tenants/app-branding?tenantId=...
    // -------------------------------------------------------------
    if (pathname === '/api/v1/tenants/app-branding' && req.method === 'GET') {
      const tenantId = searchParams.get('tenantId') || 'tenant-abc-supermarket';
      const store = tenantsState[tenantId] || Object.values(tenantsState)[0];
      if (!store) return sendError(res, 404, 'Store workspace not found');

      const branding = store.tenant.branding || ApkBuilderService.getDefaultBranding(store.tenant);
      return sendJson(res, 200, branding);
    }

    // -------------------------------------------------------------
    // Save App Branding: POST /api/v1/tenants/app-branding
    // -------------------------------------------------------------
    if (pathname === '/api/v1/tenants/app-branding' && req.method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const tenantId = body.tenantId || 'tenant-abc-supermarket';
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store workspace not found');

      const existing = store.tenant.branding || ApkBuilderService.getDefaultBranding(store.tenant);
      const updatedBranding = {
        ...existing,
        appName: body.appName || existing.appName,
        shortName: body.shortName || existing.shortName,
        logoUrl: body.logoUrl !== undefined ? body.logoUrl : existing.logoUrl,
        primaryColor: body.primaryColor || existing.primaryColor,
        accentColor: body.accentColor || existing.accentColor,
        appSuite: body.appSuite || existing.appSuite
      };

      store.tenant.branding = updatedBranding;
      persistData(tenantsState);

      return sendJson(res, 200, updatedBranding);
    }

    // -------------------------------------------------------------
    // Generate / Re-generate Branded APK: POST /api/v1/tenants/build-apk
    // -------------------------------------------------------------
    if (pathname === '/api/v1/tenants/build-apk' && req.method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const tenantId = body.tenantId || 'tenant-abc-supermarket';
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store workspace not found');

      const updatedBranding = await ApkBuilderService.buildBrandedApk(store.tenant, body);
      store.tenant.branding = updatedBranding;
      persistData(tenantsState);

      broadcastEvent({
        type: 'tenant:apk_generated',
        domain: 'tenant',
        tenantId,
        action: 'build_apk',
        data: updatedBranding,
        timestamp: new Date().toISOString()
      });

      return sendJson(res, 200, updatedBranding);
    }

    // -------------------------------------------------------------
    // Download Branded APK: GET /api/v1/tenants/download-apk?tenantId=...
    // -------------------------------------------------------------
    if (pathname === '/api/v1/tenants/download-apk' && req.method === 'GET') {
      const tenantId = searchParams.get('tenantId') || 'tenant-abc-supermarket';
      const store = tenantsState[tenantId];
      if (!store) return sendError(res, 404, 'Store workspace not found');

      let apkPath = ApkBuilderService.getApkFilePath(tenantId);
      if (!apkPath || !fs.existsSync(apkPath)) {
        // Automatically compile on first download request if not present
        const brand = await ApkBuilderService.buildBrandedApk(store.tenant, {});
        store.tenant.branding = brand;
        persistData(tenantsState);
        apkPath = ApkBuilderService.getApkFilePath(tenantId);
      }

      if (!apkPath || !fs.existsSync(apkPath)) {
        return sendError(res, 404, 'APK package not available');
      }

      const stat = fs.statSync(apkPath);
      const safeStoreName = (store.tenant.branding?.appName || store.tenant.name)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .toLowerCase();
      const downloadFilename = `${safeStoreName}-release.apk`;

      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Access-Control-Allow-Origin': '*'
      });

      const readStream = fs.createReadStream(apkPath);
      readStream.pipe(res);
      return;
    }

    // 404 Not Found
    return sendError(res, 404, `Endpoint not found: ${req.method} ${pathname}`);
  } catch (err: any) {
    console.error('Server execution error:', err);
    return sendError(res, 500, err.message || 'Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[InfinityHub API Server] listening on http://0.0.0.0:${PORT}`);
  console.log(`- REST API: http://localhost:${PORT}/api/v1/...`);
  console.log(`- SSE Stream: http://localhost:${PORT}/api/v1/sync/events`);
});
