import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { bulkImportService, ImportError } from '../../services/bulkImportService';
import { BulkImportRowData } from '@infinityhub/validation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Boxes,
  FileText,
  FileCode,
  Sparkles
} from 'lucide-react';

const SAMPLE_CSV = `name,sku,barcode,category,brand,costPrice,sellingPrice,mrp,stockQuantity,unit,minimumStock
Fortune Sunlite Refined Sunflower Oil 1L,OIL-FS-1L,8906007281001,Cooking Oils,Fortune,115,140,150,45,l,10
Tata Sampann Unpolished Toor Dal 1kg,DAL-TT-1K,8901030389901,Pulses & Lentils,Tata,145,175,185,30,kg,8
Bru Instant Coffee 200g Pouch,COF-BR-200,8901030389902,Beverages,Bru,210,260,270,25,pack,5
Surf Excel Easy Wash Detergent Powder 1kg,DET-SE-1K,8901030389903,Household Cleaning,Surf Excel,130,165,175,40,pack,10`;

export const BulkImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant: currentTenant } = useTenant();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [csvContent, setCsvContent] = useState('');
  const [parsedRows, setParsedRows] = useState<BulkImportRowData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ImportError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const canImport = user?.role === 'TENANT_OWNER' || user?.role === 'MANAGER';

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'infinityhub_catalog_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded sample CSV template', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      showToast('Please upload a standard .csv file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      processCSV(text);
    };
    reader.readAsText(file);
  };

  const handlePasteProcess = () => {
    if (!csvContent.trim()) {
      showToast('Please paste CSV rows into the text area', 'info');
      return;
    }
    processCSV(csvContent);
  };

  const processCSV = (rawCsv: string) => {
    setImportSuccessCount(null);
    const rows = bulkImportService.parseCSV(rawCsv);
    if (rows.length === 0) {
      showToast('CSV file is empty or missing data rows', 'info');
      setParsedRows([]);
      setValidationErrors([]);
      return;
    }

    const { valid, errors } = bulkImportService.validateRows(rows);
    setParsedRows(valid);
    setValidationErrors(errors);

    if (errors.length === 0) {
      showToast(`Ready to import ${valid.length} valid product rows`, 'success');
    } else {
      showToast(`${valid.length} valid rows, but found ${errors.length} formatting errors`, 'info');
    }
  };

  const handleLoadSampleData = () => {
    setCsvContent(SAMPLE_CSV);
    processCSV(SAMPLE_CSV);
  };

  const handleCommit = async () => {
    if (!currentTenant || parsedRows.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await bulkImportService.commitImport(currentTenant.id, parsedRows);
      setImportSuccessCount(res.importedCount);
      showToast(`Successfully imported ${res.importedCount} products into your catalog!`, 'success');
      setParsedRows([]);
      setCsvContent('');
    } catch (err: any) {
      showToast(err.message || 'Bulk import failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-primary-600" />
            Bulk Catalog Import
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload CSV spreadsheets to rapidly ingest product catalogs, categories, brands, and opening stock balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleDownloadSample}
          >
            Download CSV Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Sparkles}
            onClick={handleLoadSampleData}
          >
            Load Sample Data
          </Button>
        </div>
      </div>

      {/* Success Banner if committed */}
      {importSuccessCount !== null && (
        <Card className="p-6 border-emerald-300 bg-emerald-50/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 text-base">
                Import Completed Successfully!
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                {importSuccessCount} products and initial stock adjustments have been saved to your catalog and stock ledger.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={ArrowRight}
            onClick={() => navigate('/inventory/products')}
          >
            View Products Catalog
          </Button>
        </Card>
      )}

      {/* Upload or Paste Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Provide CSV Data
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`text-xs px-2.5 py-1 rounded font-medium ${
                    inputMode === 'upload' ? 'bg-primary-50 text-primary-700 font-bold' : 'text-slate-500'
                  }`}
                >
                  File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`text-xs px-2.5 py-1 rounded font-medium ${
                    inputMode === 'paste' ? 'bg-primary-50 text-primary-700 font-bold' : 'text-slate-500'
                  }`}
                >
                  Paste Raw Text
                </button>
              </div>
            </div>

            {inputMode === 'upload' ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-primary-400 hover:bg-slate-50/50 transition-all relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud className="w-10 h-10 text-primary-500 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800">
                  Drag and drop your .csv file here
                </h4>
                <p className="text-xs text-slate-500 mt-1">or click to browse from your device</p>
                <span className="inline-block mt-3 text-[11px] text-slate-400 font-mono">
                  Supported format: UTF-8 Comma-separated (.csv)
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={8}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="name,sku,barcode,category,brand,costPrice,sellingPrice,mrp,stockQuantity,unit,minimumStock..."
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePasteProcess}
                  className="w-full"
                >
                  Parse & Validate Pasted Rows
                </Button>
              </div>
            )}

            {/* Template Column Guide */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <h5 className="text-xs font-bold text-slate-700 mb-2">Required Columns:</h5>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 font-mono">
                <div>• name (string)</div>
                <div>• sku (unique code)</div>
                <div>• category (text)</div>
                <div>• costPrice (number)</div>
                <div>• sellingPrice (number)</div>
                <div>• stockQuantity (units)</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Preview & Validation Results (Right Column) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-200 overflow-hidden bg-white">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">2. Pre-flight Validation Preview</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect data before committing to the database.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {parsedRows.length} Valid
                </span>
                {validationErrors.length > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    {validationErrors.length} Errors
                  </span>
                )}
              </div>
            </div>

            {/* Errors summary if any */}
            {validationErrors.length > 0 && (
              <div className="p-3 bg-rose-50 border-b border-rose-100 max-h-32 overflow-y-auto">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Validation Issues Found:
                </div>
                <div className="space-y-1">
                  {validationErrors.map((err, i) => (
                    <div key={i} className="text-[11px] text-rose-700 font-mono">
                      Row {err.row}: [{err.field}] {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview table */}
            {parsedRows.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                No parsed rows to display yet. Upload a CSV file or paste text to preview.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Cost Price</th>
                      <th className="py-2.5 px-3 text-right">Selling Price</th>
                      <th className="py-2.5 px-3 text-right">Opening Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-semibold text-slate-900">{row.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{row.sku}</td>
                        <td className="py-2 px-3 text-slate-600">{row.category}</td>
                        <td className="py-2 px-3 text-right text-slate-600">₹{row.costPrice}</td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-900">₹{row.sellingPrice}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600">
                          {row.stockQuantity} {row.unit || 'pcs'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Commit Action */}
            {parsedRows.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Ready to ingest <strong>{parsedRows.length}</strong> items into {currentTenant?.name}.
                </span>

                <Button
                  variant="primary"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={handleCommit}
                  isLoading={isProcessing}
                >
                  Commit Ingestion ({parsedRows.length} SKUs)
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
