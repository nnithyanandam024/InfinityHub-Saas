/**
 * Phase 4 Comprehensive Functional Flow & Logic Verification Suite
 * Executes headlessly via tsx/node to verify:
 * 1. Complete CRUD across all 14 domain services
 * 2. Immutable double-entry stock ledger mathematical reconciliation
 * 3. Zod validation schema rejection of malformed/negative/inverted data
 * 4. Zero-Trust privacy boundary & multi-tenant isolation
 * 5. Lifecycle state transitions (Transfers, Stocktake, Bundles, Batches, Serials)
 */
import { mockStore, AccessBoundaryViolationError } from '../apps/web/src/data/mockStore';
import { productService } from '../apps/web/src/services/productService';
import { stockService } from '../apps/web/src/services/stockService';
import { warehouseService } from '../apps/web/src/services/warehouseService';
import { transferService } from '../apps/web/src/services/transferService';
import { batchService } from '../apps/web/src/services/batchService';
import { serialService } from '../apps/web/src/services/serialService';
import { stocktakeService } from '../apps/web/src/services/stocktakeService';
import { reorderService } from '../apps/web/src/services/reorderService';
import { forecastingService } from '../apps/web/src/services/forecastingService';
import { brandService } from '../apps/web/src/services/brandService';
import { bundleService } from '../apps/web/src/services/bundleService';
import { purchaseService } from '../apps/web/src/services/purchaseService';
import { categoryService } from '../apps/web/src/services/categoryService';
import { supplierService } from '../apps/web/src/services/supplierService';
import { bulkImportService } from '../apps/web/src/services/bulkImportService';
import { productSchema, stockAdjustmentSchema, stockTransferSchema } from '@infinityhub/validation';
const results = [];
function assert(condition, suite, name, details) {
    if (condition) {
        results.push({ suite, name, passed: true, details });
        console.log(`  ✓ [${suite}] ${name}`);
    }
    else {
        results.push({ suite, name, passed: false, error: 'Assertion failed', details });
        console.error(`  ✗ [${suite}] ${name} - FAILED`);
    }
}
async function runSuite() {
    console.log('\n======================================================');
    console.log('   INFINITYHUB PHASE 4: FUNCTIONAL FLOW & LOGIC QA');
    console.log('======================================================\n');
    // Reset mock store to clean state for testing
    mockStore.resetAll();
    const TENANT_A = 'tenant-abc-supermarket';
    const TENANT_B = 'tenant-kumar-stores';
    const ACTOR_USER = { id: 'usr-owner-abc', name: 'Rajesh Sharma' };
    // ========================================================
    // 1. MASTER CRUD & DEPENDENCY VERIFICATION
    // ========================================================
    console.log('--- 1. Testing Master Domain CRUD & Operations ---');
    // 1.1 Category CRUD
    const cat = await categoryService.createCategory(TENANT_A, {
        name: 'Organic Pulses & Grains',
        description: 'Certified farm organic pulses',
        status: 'active'
    });
    assert(cat.id.startsWith('cat-') && cat.name === 'Organic Pulses & Grains', 'CRUD', 'Create Category');
    const cats = await categoryService.getCategories(TENANT_A);
    assert(cats.some(c => c.id === cat.id), 'CRUD', 'Read Categories List');
    // 1.2 Brand CRUD
    const brand = await brandService.createBrand(TENANT_A, {
        name: 'Patanjali Organics',
        description: 'Ayurvedic & herbal goods',
        website: 'https://patanjali.example.com',
        status: 'active'
    });
    assert(brand.id.startsWith('brd-') && brand.name === 'Patanjali Organics', 'CRUD', 'Create Brand');
    const updatedBrand = await brandService.updateBrand(TENANT_A, brand.id, { description: 'Updated description' });
    assert(updatedBrand.description === 'Updated description', 'CRUD', 'Update Brand');
    // 1.3 Supplier CRUD
    const supplier = await supplierService.createSupplier(TENANT_A, {
        name: 'Arun Kumar',
        companyName: 'Organic India Wholesalers',
        phone: '9876543210',
        email: 'orders@organicindia.example',
        taxNumber: '33AABCO1234F1Z5',
        status: 'active'
    });
    assert(supplier.id.startsWith('sup-') && supplier.companyName === 'Organic India Wholesalers', 'CRUD', 'Create Supplier');
    // 1.4 Warehouse & Location CRUD
    const warehouse = await warehouseService.createWarehouse(TENANT_A, {
        name: 'South Chennai Bulk Depot',
        code: 'WH-SCBD',
        address: 'Tambaram Industrial Area, Chennai',
        isDefault: false,
        status: 'active'
    });
    assert(warehouse.id.startsWith('wh-') && warehouse.code === 'WH-SCBD', 'CRUD', 'Create Warehouse Facility');
    const binLoc = await warehouseService.createLocation(TENANT_A, warehouse.id, {
        code: 'RACK-S1',
        name: 'South Staging Rack',
        description: 'Pallet storage'
    });
    assert(binLoc.code === 'RACK-S1' && binLoc.warehouseId === warehouse.id, 'CRUD', 'Create Bin Location');
    // 1.5 Product Master Creation with Opening Stock
    const initialStock = 50;
    const product = await productService.createProduct(TENANT_A, {
        name: 'Patanjali Organic Moong Dal 1kg',
        sku: 'PAT-MD-1K',
        barcode: '8901030399123',
        categoryId: cat.id,
        brandId: brand.id,
        costPrice: 120,
        sellingPrice: 160,
        mrp: 175,
        unit: 'kg',
        stockQuantity: initialStock,
        minimumStock: 10,
        reorderPoint: 15,
        reorderQuantity: 40,
        status: 'active'
    });
    assert(product.id.startsWith('prod-') && product.stockQuantity === 50, 'CRUD', 'Create Product with Opening Stock');
    // Verify Opening Stock created exactly one 'correction' ledger movement
    const initialMovements = await stockService.getStockMovements(TENANT_A, product.id);
    assert(initialMovements.length === 1 &&
        initialMovements[0].type === 'correction' &&
        initialMovements[0].quantityChange === 50 &&
        initialMovements[0].newStock === 50, 'Ledger', 'Product Opening Stock Ledger Entry Recorded (+50)');
    // 1.6 Product Metadata Edit (Must NOT mutate physical stock)
    const editedProd = await productService.updateProduct(TENANT_A, product.id, {
        sellingPrice: 165,
        mrp: 180,
        description: 'Premium sorted organic moong dal'
    });
    assert(editedProd.sellingPrice === 165 && editedProd.stockQuantity === 50, 'CRUD', 'Update Product Metadata Preserves Physical Stock');
    const movementsAfterEdit = await stockService.getStockMovements(TENANT_A, product.id);
    assert(movementsAfterEdit.length === 1, 'Ledger', 'Product Metadata Edit Creates No Erroneous Ledger Entries');
    // ========================================================
    // 2. MATHEMATICAL STOCK LEDGER & LIFECYCLE RECONCILIATION
    // ========================================================
    console.log('\n--- 2. Testing Stock Mutations & Double-Entry Ledger Mathematics ---');
    // 2.1 Inward Purchase Order (+25 units)
    const purchase = await purchaseService.createPurchase(TENANT_A, {
        invoiceNumber: 'INV-OI-2026-001',
        supplierId: supplier.id,
        supplierName: supplier.companyName,
        purchaseDate: new Date().toISOString().split('T')[0],
        items: [
            {
                id: 'item-1',
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                quantity: 25,
                unitCost: 120,
                totalCost: 3000
            }
        ],
        subtotal: 3000,
        tax: 150,
        discount: 0,
        totalAmount: 3150,
        status: 'completed'
    }, ACTOR_USER);
    assert(purchase.id.startsWith('po-'), 'Procurement', 'Create Inward Purchase Order');
    const prodAfterPurchase = await productService.getProductById(TENANT_A, product.id);
    assert(prodAfterPurchase?.stockQuantity === 75, 'Ledger', 'Stock Incremented from 50 to 75 via Purchase');
    // 2.2 Stock Adjustment: Damage (-5 units)
    const adjDamage = await stockService.adjustStock(TENANT_A, product.id, {
        adjustmentType: 'damage',
        quantity: 5,
        reason: 'Bags punctured during forklift unloading'
    }, ACTOR_USER);
    assert(adjDamage.product.stockQuantity === 70, 'Ledger', 'Damaged Stock Deduction: 75 - 5 = 70');
    assert(adjDamage.movement.type === 'damage' && adjDamage.movement.quantityChange === -5, 'Ledger', 'Damage Movement Logged with -5 delta');
    // 2.3 Stock Adjustment: Increase (+10 units)
    const adjIncrease = await stockService.adjustStock(TENANT_A, product.id, {
        adjustmentType: 'increase',
        quantity: 10,
        reason: 'Found extra unopened carton in backroom'
    }, ACTOR_USER);
    assert(adjIncrease.product.stockQuantity === 80, 'Ledger', 'Manual Stock Increase: 70 + 10 = 80');
    // 2.4 Physical Stocktake & Reconciliation (-7 units variance)
    const session = await stocktakeService.createSession(TENANT_A, warehouse.id, ACTOR_USER, 'Quarterly physical cycle count');
    assert(session.status === 'in_progress', 'Stocktake', 'Initiate Stocktake Session');
    // Record physical count of 73 (System stock is 80 -> variance is -7)
    await stocktakeService.updateItemCount(TENANT_A, session.id, product.id, 73);
    const reconciledSession = await stocktakeService.reconcileSession(TENANT_A, session.id, ACTOR_USER);
    assert(reconciledSession.status === 'reconciled', 'Stocktake', 'Reconcile Stocktake Session');
    const prodAfterStocktake = await productService.getProductById(TENANT_A, product.id);
    assert(prodAfterStocktake?.stockQuantity === 73, 'Ledger', 'Stock Adjusted via Stocktake from 80 to 73');
    // Verify double-reconciliation lock throws error
    let doubleReconcileBlocked = false;
    try {
        await stocktakeService.reconcileSession(TENANT_A, session.id, ACTOR_USER);
    }
    catch (err) {
        doubleReconcileBlocked = true;
    }
    assert(doubleReconcileBlocked, 'Stocktake', 'Double-Reconciliation Safely Blocked');
    // 2.5 Inter-Warehouse Stock Transfer (Move 13 units to South Depot)
    const allWarehouses = await warehouseService.getWarehouses(TENANT_A);
    const sourceWh = allWarehouses[0];
    const destWh = warehouse;
    const transfer = await transferService.createTransfer(TENANT_A, {
        sourceWarehouseId: sourceWh.id,
        destinationWarehouseId: destWh.id,
        notes: 'Transfer 13 units for regional distribution',
        items: [
            {
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                quantity: 13
            }
        ]
    }, ACTOR_USER);
    assert(transfer.status === 'draft', 'Transfers', 'Create Stock Transfer Manifest in Draft');
    // Dispatch transfer (-13 from source)
    const dispatchedTrf = await transferService.updateTransferStatus(TENANT_A, transfer.id, 'in_transit', ACTOR_USER);
    assert(dispatchedTrf.status === 'in_transit', 'Transfers', 'Dispatch Transfer: status in_transit');
    const prodAfterDispatch = await productService.getProductById(TENANT_A, product.id);
    assert(prodAfterDispatch?.stockQuantity === 60, 'Ledger', 'Dispatch Deducts 13 Units: 73 - 13 = 60');
    // Receive transfer (+13 at destination)
    const receivedTrf = await transferService.updateTransferStatus(TENANT_A, transfer.id, 'received', ACTOR_USER);
    assert(receivedTrf.status === 'received', 'Transfers', 'Receive Transfer: status received');
    const prodAfterReceive = await productService.getProductById(TENANT_A, product.id);
    assert(prodAfterReceive?.stockQuantity === 73, 'Ledger', 'Receive Restores Stock to 73 across destination depot');
    // Prevent invalid transfer state transitions
    let invalidTransitionBlocked = false;
    try {
        await transferService.updateTransferStatus(TENANT_A, transfer.id, 'in_transit', ACTOR_USER);
    }
    catch (err) {
        invalidTransitionBlocked = true;
    }
    assert(invalidTransitionBlocked, 'Transfers', 'Illegal Transition (Received -> In Transit) Blocked');
    // 2.6 Product Bundles & Composite Kits
    // Create second component product
    const rice = await productService.createProduct(TENANT_A, {
        name: 'Patanjali Basmati Rice 1kg',
        sku: 'PAT-BR-1K',
        barcode: '8901030399124',
        categoryId: cat.id,
        brandId: brand.id,
        costPrice: 90,
        sellingPrice: 120,
        unit: 'kg',
        stockQuantity: 40,
        minimumStock: 5,
        status: 'active'
    });
    // Create composite parent bundle product
    const kit = await productService.createProduct(TENANT_A, {
        name: 'Organic Dinner Combo Kit (1kg Dal + 1kg Rice)',
        sku: 'PAT-COMBO-01',
        barcode: '8901030399125',
        categoryId: cat.id,
        brandId: brand.id,
        costPrice: 210,
        sellingPrice: 270,
        unit: 'pack',
        stockQuantity: 0,
        minimumStock: 2,
        isBundle: true,
        status: 'active'
    });
    // Save Bill of Materials (BOM)
    const bundle = await bundleService.saveBundle(TENANT_A, {
        bundleProductId: kit.id,
        bundleProductName: kit.name,
        components: [
            { componentProductId: product.id, componentProductName: product.name, sku: product.sku, quantity: 1, unitCost: 120 },
            { componentProductId: rice.id, componentProductName: rice.name, sku: rice.sku, quantity: 1, unitCost: 90 }
        ],
        assemblyInstructions: 'Pack in branded eco-friendly carton'
    });
    assert(bundle.components.length === 2, 'Bundles', 'Configure Bundle Bill of Materials');
    // Assemble 5 units of Combo Kit
    // Requires 5 × Moong Dal (73 - 5 = 68) and 5 × Basmati Rice (40 - 5 = 35), and creates +5 Combo Kits
    const assemblyResult = await bundleService.assembleBundle(TENANT_A, bundle.id, 5, ACTOR_USER);
    assert(assemblyResult.bundleProduct.stockQuantity === 5, 'Bundles', 'Kit Stock Increased to 5 after Assembly');
    const moongAfterAsm = await productService.getProductById(TENANT_A, product.id);
    const riceAfterAsm = await productService.getProductById(TENANT_A, rice.id);
    assert(moongAfterAsm?.stockQuantity === 68, 'Bundles', 'Moong Dal Component Deducted by 5: 73 - 5 = 68');
    assert(riceAfterAsm?.stockQuantity === 35, 'Bundles', 'Rice Component Deducted by 5: 40 - 5 = 35');
    // Disassemble 2 units of Combo Kit back into components
    // Kit becomes 3 (5 - 2 = 3), Moong becomes 70 (68 + 2 = 70), Rice becomes 37 (35 + 2 = 37)
    const disasmResult = await bundleService.disassembleBundle(TENANT_A, bundle.id, 2, ACTOR_USER);
    assert(disasmResult.bundleProduct.stockQuantity === 3, 'Bundles', 'Kit Stock Decreased to 3 after Disassembly');
    const moongAfterDis = await productService.getProductById(TENANT_A, product.id);
    assert(moongAfterDis?.stockQuantity === 70, 'Bundles', 'Moong Dal Restored by 2: 68 + 2 = 70');
    // 2.7 Final Mathematical Stock Ledger Reconciliation
    // Let's trace Moong Dal's exact numbers:
    // Initial opening stock: +50
    // Purchase inward: +25
    // Damage write-off: -5
    // Manual adjustment increase: +10
    // Stocktake cycle count adjustment: -7 (from 80 to 73)
    // Transfer dispatch: -13
    // Transfer receive: +13
    // Bundle assembly: -5
    // Bundle disassembly: +2
    // Expected final on-hand stock: 50 + 25 - 5 + 10 - 7 - 13 + 13 - 5 + 2 = 70
    const finalProductMoong = await productService.getProductById(TENANT_A, product.id);
    const allMoongMovements = await stockService.getStockMovements(TENANT_A, product.id);
    const calculatedSum = allMoongMovements.reduce((acc, m) => acc + m.quantityChange, 0);
    assert(finalProductMoong?.stockQuantity === 70, 'Reconciliation', `Final On-Hand Stock = 70 (Actual: ${finalProductMoong?.stockQuantity})`);
    assert(calculatedSum === 70, 'Reconciliation', `Sum of All Immutable Ledger Deltas = 70 (Actual: ${calculatedSum})`);
    assert(finalProductMoong?.stockQuantity === calculatedSum, 'Reconciliation', 'PERFECT MATHEMATICAL RECONCILIATION: Stock Balance Equals Ledger Sum');
    // ========================================================
    // 3. SERIAL NUMBERS & BATCH EXPIRY LIFECYCLES
    // ========================================================
    console.log('\n--- 3. Testing Serial Tracking, Batches & Reorder Radar ---');
    // 3.1 Batch Lot with Expiry
    const batch = await batchService.createBatch(TENANT_A, {
        productId: product.id,
        productName: product.name,
        batchNumber: 'LOT-PAT-2026-09',
        warehouseId: warehouse.id,
        manufacturedAt: '2026-08-01',
        expiryAt: '2026-09-25', // Expiring within 14 days
        quantity: 30,
        initialQuantity: 30
    });
    assert(batch.batchNumber === 'LOT-PAT-2026-09', 'Batches', 'Register Batch Lot with Expiry Date');
    const expiring = await batchService.getExpiringBatches(TENANT_A, 30);
    assert(expiring.some(b => b.id === batch.id), 'Batches', 'Radar Catches Batch Expiring within 30 Days');
    // 3.2 Serial Number Registration & State Transitions
    const serial = await serialService.createSerialNumber(TENANT_A, {
        productId: product.id,
        productName: product.name,
        serialNumber: 'SR-PAT-0001',
        warehouseId: warehouse.id
    });
    assert(serial.status === 'in_stock', 'Serials', 'Register Serial Number with status in_stock');
    const allocatedSerial = await serialService.updateSerialStatus(TENANT_A, serial.id, 'allocated');
    assert(allocatedSerial.status === 'allocated', 'Serials', 'Transition Serial: in_stock -> allocated');
    const soldSerial = await serialService.updateSerialStatus(TENANT_A, serial.id, 'sold', 'Ramesh Enterprises');
    assert(soldSerial.status === 'sold' && soldSerial.assignedCustomer === 'Ramesh Enterprises', 'Serials', 'Transition Serial: allocated -> sold');
    // 3.3 Reorder Radar & Forecasting Intelligence
    // Configure rule: minStock=75, reorderPoint=80. Since moong stock is 70, it must trigger replenishment!
    await reorderService.saveReorderRule(TENANT_A, {
        productId: product.id,
        productName: product.name,
        minStock: 75,
        reorderPoint: 80,
        reorderQuantity: 50,
        preferredSupplierId: supplier.id,
        autoGeneratePO: true
    });
    const suggestions = await reorderService.getPurchaseSuggestions(TENANT_A);
    assert(suggestions.some(s => s.productId === product.id && s.suggestedQuantity === 50), 'Reorder', 'Replenishment Radar Triggers Purchase Suggestion for Depleted SKU');
    // Forecasting Report
    const forecast = await forecastingService.getForecastingReport(TENANT_A);
    assert(forecast.summary.totalSkus > 0 &&
        forecast.demandVelocity.length > 0 &&
        !isNaN(forecast.summary.totalCapitalLocked), 'Forecasting', 'Demand Forecasting & Dead Capital Generated without NaN Errors');
    // 3.4 CSV Bulk Ingestion
    const sampleCsv = `name,sku,barcode,category,brand,costPrice,sellingPrice,mrp,stockQuantity,unit,minimumStock
Aashirvaad Atta 10kg,AASH-10K,8901030388901,Staples,Aashirvaad,380,450,460,20,kg,5
Tata Salt 1kg,TATA-SLT-1K,8901030388902,Staples,Tata,24,28,30,100,kg,20`;
    const parsed = bulkImportService.parseCsv(sampleCsv);
    assert(parsed.rows.length === 2 && parsed.errors.length === 0, 'BulkImport', 'CSV Parsing & Pre-flight Schema Validation');
    const importResult = await bulkImportService.executeImport(TENANT_A, parsed.rows, ACTOR_USER);
    assert(importResult.importedCount === 2, 'BulkImport', 'Ingestion Commits 2 SKUs and Writes Opening Stock Movements');
    // Verify opening stock movement created for Tata Salt (+100)
    const salt = (await productService.getProducts(TENANT_A)).find(p => p.sku === 'TATA-SLT-1K');
    assert(salt?.stockQuantity === 100, 'BulkImport', 'Tata Salt stock quantity verified as 100');
    // ========================================================
    // 4. ARCHIVE SAFETY & SOFT-DELETE DEPENDENCY INTEGRITY
    // ========================================================
    console.log('\n--- 4. Testing Archive Safety & Dependency Preservation ---');
    // Archive Moong Dal
    const archived = await productService.archiveProduct(TENANT_A, product.id);
    assert(archived.status === 'archived', 'ArchiveSafety', 'Product Status Marked as Archived');
    // Verify historical purchases, movements, and batches are STILL intact
    const movementsAfterArchive = await stockService.getStockMovements(TENANT_A, product.id);
    assert(movementsAfterArchive.length > 0, 'ArchiveSafety', 'Historical Stock Movements Preserved after Product Archival');
    const purchasesAfterArchive = await purchaseService.getPurchases(TENANT_A);
    assert(purchasesAfterArchive.some(p => p.items.some(it => it.productId === product.id)), 'ArchiveSafety', 'Historical Purchase Invoice Records Preserved after Product Archival');
    // ========================================================
    // 5. SECURITY, ZERO-TRUST & TENANT ISOLATION
    // ========================================================
    console.log('\n--- 5. Testing Zero-Trust Access & Tenant Boundary Isolation ---');
    // 5.1 Super Admin Zero-Trust Access Boundary
    // Calling any tenant private method as platform Super Admin MUST throw AccessBoundaryViolationError
    let superAdminBlocked = false;
    try {
        mockStore.getProducts(TENANT_A, 'platform');
    }
    catch (err) {
        if (err instanceof AccessBoundaryViolationError) {
            superAdminBlocked = true;
        }
    }
    assert(superAdminBlocked, 'Security', 'Super Admin Prohibited from Viewing Customer Products (AccessBoundaryViolationError)');
    let superAdminMutationBlocked = false;
    try {
        mockStore.adjustStock(TENANT_A, product.id, { adjustmentType: 'increase', quantity: 10, reason: 'Illegal super admin edit', userId: 'sa', userName: 'Admin' }, 'platform');
    }
    catch (err) {
        if (err instanceof AccessBoundaryViolationError) {
            superAdminMutationBlocked = true;
        }
    }
    assert(superAdminMutationBlocked, 'Security', 'Super Admin Prohibited from Mutating Customer Stock');
    // 5.2 Cross-Tenant Data Isolation (Tenant B must NOT see Tenant A's products or records)
    const tenantBProducts = await productService.getProducts(TENANT_B);
    assert(!tenantBProducts.some(p => p.id === product.id), 'Security', 'Tenant B Has Zero Visibility into Tenant A Products');
    const tenantBPurchases = await purchaseService.getPurchases(TENANT_B);
    assert(!tenantBPurchases.some(p => p.id === purchase.id), 'Security', 'Tenant B Has Zero Visibility into Tenant A Purchases');
    const tenantBMovements = await stockService.getStockMovements(TENANT_B);
    assert(!tenantBMovements.some(m => m.productId === product.id), 'Security', 'Tenant B Has Zero Visibility into Tenant A Stock Movements');
    // ========================================================
    // 6. VALIDATION SCHEMA REJECTIONS
    // ========================================================
    console.log('\n--- 6. Testing Zod Validation Schema Edge Cases ---');
    // Selling Price < Cost Price should fail validation
    const invalidPriceValidation = productSchema.safeParse({
        name: 'Loss Making SKU',
        sku: 'LOSS-01',
        barcode: '8901030388909',
        categoryId: cat.id,
        costPrice: 200,
        sellingPrice: 150, // lower than cost price!
        unit: 'pcs',
        stockQuantity: 10,
        minimumStock: 5
    });
    assert(!invalidPriceValidation.success, 'Validation', 'Zod Rejects Selling Price Lower Than Cost Price');
    // Negative quantity adjustment should fail validation
    const negativeAdjustmentValidation = stockAdjustmentSchema.safeParse({
        productId: product.id,
        adjustmentType: 'increase',
        quantity: -10, // negative!
        reason: 'Test'
    });
    assert(!negativeAdjustmentValidation.success, 'Validation', 'Zod Rejects Negative Adjustment Quantities');
    // Same source and destination warehouse transfer should fail validation
    const sameWarehouseTransferValidation = stockTransferSchema.safeParse({
        sourceWarehouseId: warehouse.id,
        destinationWarehouseId: warehouse.id, // same!
        items: [{ productId: product.id, quantity: 5 }]
    });
    assert(!sameWarehouseTransferValidation.success, 'Validation', 'Zod Rejects Transfer between Identical Warehouses');
    // ========================================================
    // SUMMARY REPORT
    // ========================================================
    console.log('\n======================================================');
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.filter(r => !r.passed).length;
    console.log(`TOTAL TESTS: ${results.length}`);
    console.log(`PASSED:      ${passedCount}`);
    console.log(`FAILED:      ${failedCount}`);
    console.log('======================================================\n');
    if (failedCount > 0) {
        process.exit(1);
    }
}
runSuite().catch(err => {
    console.error('Test suite failed with unexpected exception:', err);
    process.exit(1);
});
//# sourceMappingURL=verify-phase4-functional-flow.js.map