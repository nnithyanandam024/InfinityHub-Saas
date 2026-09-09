import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  optimizeImage,
  OptimizedImageResult,
  PRODUCT_IMAGE_PRESETS,
  PresetImage
} from '../../utils/imageOptimizer';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Sparkles,
  Link as LinkIcon,
  Loader2,
  Smartphone,
  ShoppingBag,
  Layers,
  Eye
} from 'lucide-react';

interface ProductImageUploaderProps {
  imagePath?: string;
  thumbnailPath?: string;
  onChange: (paths: { imagePath: string; thumbnailPath: string }) => void;
  productName?: string;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  imagePath = '',
  thumbnailPath = '',
  onChange,
  productName = 'Product'
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [presetCategory, setPresetCategory] = useState<'all' | 'mobile' | 'grocery'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [optimizationStats, setOptimizationStats] = useState<{
    originalKb: number;
    mainKb: number;
    thumbKb: number;
    savedPct: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    try {
      const result = await optimizeImage(file);
      setOptimizationStats({
        originalKb: result.originalSizeKb,
        mainKb: result.mainSizeKb,
        thumbKb: result.thumbSizeKb,
        savedPct: result.savedPercentage
      });
      onChange({
        imagePath: result.mainDataUrl,
        thumbnailPath: result.thumbnailDataUrl
      });
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setError(null);
    setOptimizationStats(null);
    onChange({
      imagePath: urlInput.trim(),
      thumbnailPath: urlInput.trim()
    });
  };

  const handleSelectPreset = (preset: PresetImage) => {
    setError(null);
    setOptimizationStats(null);
    onChange({
      imagePath: preset.imagePath,
      thumbnailPath: preset.thumbnailPath
    });
  };

  const handleRemoveImage = () => {
    setOptimizationStats(null);
    setError(null);
    setUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onChange({ imagePath: '', thumbnailPath: '' });
  };

  const currentImg = imagePath || thumbnailPath;

  const filteredPresets = PRODUCT_IMAGE_PRESETS.filter(p => {
    if (presetCategory === 'all') return true;
    return p.category === presetCategory;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              Product Photography & Visuals
            </CardTitle>
            <CardDescription>
              Add high-resolution product photos. Images are automatically optimized into lightweight WebP format.
            </CardDescription>
          </div>
          {currentImg && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveImage}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 flex items-center gap-1 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Photo
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Real-time Client-Side Optimization Feedback Banner */}
        {optimizationStats && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Client-Side WebP Compression:</strong> {optimizationStats.originalKb} KB &rarr;{' '}
                <span className="font-semibold text-emerald-700">{optimizationStats.mainKb} KB</span> main (1200px) +{' '}
                <span className="font-semibold text-emerald-700">{optimizationStats.thumbKb} KB</span> thumb (300px).
              </span>
            </div>
            <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] shrink-0 ml-2">
              {optimizationStats.savedPct}% Bandwidth Saved
            </span>
          </div>
        )}

        {/* Active Image Dual-Preview (Grid Card + List Thumbnail) */}
        {currentImg ? (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                Live Preview in Catalog Views
              </span>
              <span className="text-[11px] text-slate-400">Ready for storage & catalog display</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Grid View Card Preview */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-2xs space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  1. Grid View Card Display (160px)
                </span>
                <div className="w-full h-36 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden relative group">
                  <img
                    src={thumbnailPath || imagePath}
                    alt={productName}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                      Normal Stock
                    </span>
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {productName || 'Product Title'}
                </div>
              </div>

              {/* 2. List View Thumbnail Preview */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-2xs space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  2. List View Table Thumbnail (44×44px)
                </span>
                <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80">
                  <div className="w-11 h-11 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600 shadow-2xs">
                    <img
                      src={thumbnailPath || imagePath}
                      alt={productName}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {productName || 'Product Title'}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">SKU: PROD-1001 · 300px WebP</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Tab Navigation: Upload vs Presets vs URL */}
        <div>
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Upload & Optimize Photo
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preset')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'preset'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Mobile & Retail Presets
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'url'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Direct Image URL
            </button>
          </div>

          <div className="pt-4">
            {/* TAB 1: FILE UPLOAD / DRAG & DROP */}
            {activeTab === 'upload' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="product-photo-upload"
                />

                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isProcessing
                      ? 'border-blue-400 bg-blue-50/40 pointer-events-none'
                      : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Resizing to 1200px & generating 300px WebP thumbnail...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Click to upload or drag and drop photo
                        </p>
                        <p className="text-xs text-slate-500">
                          Supports PNG, JPG, WebP up to 10 MB. In-browser client downscaling to WebP.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MOBILE & RETAIL PRESETS */}
            {activeTab === 'preset' && (
              <div className="space-y-3">
                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPresetCategory('all')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                      presetCategory === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    All Presets ({PRODUCT_IMAGE_PRESETS.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setPresetCategory('mobile')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                      presetCategory === 'mobile'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    Mobile & Tech
                  </button>

                  <button
                    type="button"
                    onClick={() => setPresetCategory('grocery')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                      presetCategory === 'grocery'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <ShoppingBag className="w-3 h-3" />
                    Supermarket & Staples
                  </button>
                </div>

                {/* Presets Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                  {filteredPresets.map(preset => (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className="group border border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-xl p-2 cursor-pointer transition-all bg-white dark:bg-slate-800/80 hover:shadow-md flex flex-col justify-between"
                    >
                      <div className="aspect-square w-full rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden mb-2 relative">
                        <img
                          src={preset.thumbnailPath}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-blue-600">
                          {preset.name}
                        </div>
                        <div className="text-[9px] text-slate-400 capitalize">{preset.category}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: DIRECT URL */}
            {activeTab === 'url' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="https://example.com/images/product.webp"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    icon={LinkIcon}
                  />
                  <Button type="button" onClick={handleApplyUrl} size="sm" className="h-10 shrink-0">
                    Apply URL
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Provide a direct public image link (e.g. from Unsplash, supplier CDN, or cloud bucket).
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
