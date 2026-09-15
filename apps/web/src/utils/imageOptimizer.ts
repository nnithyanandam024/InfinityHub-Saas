/**
 * Client-Side Image Optimization & Storage Engine
 * 
 * Implements the unified image processing pipeline:
 * 1. Validates file format & enforces <= 10MB limit.
 * 2. Downscales & compresses in-browser using HTML5 Canvas:
 *    - Main Image: max dimension 1200px, WebP quality 0.78 (~100-300 KB)
 *    - Thumbnail:  max dimension 300px, WebP quality 0.72 (~20-60 KB)
 * 3. Formats into standardized Supabase Storage paths:
 *    product-images/{productId}/main.webp and thumb.webp
 */

export interface OptimizedImageResult {
  mainDataUrl: string;
  thumbnailDataUrl: string;
  mainBlob: Blob;
  thumbnailBlob: Blob;
  originalName: string;
  originalSizeKb: number;
  mainSizeKb: number;
  thumbSizeKb: number;
  savedPercentage: number;
  width: number;
  height: number;
}

export interface PresetImage {
  id: string;
  name: string;
  category: 'mobile' | 'grocery' | 'general';
  imagePath: string;
  thumbnailPath: string;
  description?: string;
}

/**
 * Validates and optimizes an image file entirely on the client before upload
 */
export async function optimizeImage(file: File): Promise<OptimizedImageResult> {
  // 1. Validate MIME type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (PNG, JPG, WebP, etc.)');
  }

  // 2. Validate max 10MB limit
  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('Image file exceeds the 10MB maximum limit. Please choose a smaller file.');
  }

  // 3. Load image into memory
  const img = await loadImageFromFile(file);
  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;

  // 4. Generate Main Image (max 1200px, WebP 0.78)
  const { dataUrl: mainDataUrl, blob: mainBlob, width: mainW, height: mainH } =
    await resizeAndCompress(img, 1200, 0.78);

  // 5. Generate Thumbnail Image (max 300px, WebP 0.72)
  const { dataUrl: thumbnailDataUrl, blob: thumbnailBlob } =
    await resizeAndCompress(img, 300, 0.72);

  const originalSizeKb = Math.round(file.size / 1024);
  const mainSizeKb = Math.round(mainBlob.size / 1024);
  const thumbSizeKb = Math.round(thumbnailBlob.size / 1024);
  const savedPercentage = Math.max(0, Math.round(((file.size - mainBlob.size) / file.size) * 100));

  return {
    mainDataUrl,
    thumbnailDataUrl,
    mainBlob,
    thumbnailBlob,
    originalName: file.name,
    originalSizeKb,
    mainSizeKb,
    thumbSizeKb,
    savedPercentage,
    width: mainW,
    height: mainH
  };
}

/**
 * Helper: Load File into HTMLImageElement
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode image data'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Helper: Canvas resize & WebP export
 */
function resizeAndCompress(
  img: HTMLImageElement,
  maxDimension: number,
  quality: number
): Promise<{ dataUrl: string; blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    // Calculate proportional aspect ratio
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to initialize 2D canvas rendering context'));
      return;
    }

    // High quality bicubic-like interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Try WebP first, fallback gracefully to JPEG if browser does not support WebP canvas export
    let mimeType = 'image/webp';
    let dataUrl = canvas.toDataURL(mimeType, quality);
    if (!dataUrl.startsWith('data:image/webp')) {
      mimeType = 'image/jpeg';
      dataUrl = canvas.toDataURL(mimeType, quality);
    }

    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error('Failed to compress image into blob'));
          return;
        }
        resolve({ dataUrl, blob, width, height });
      },
      mimeType,
      quality
    );
  });
}

/**
 * Storage Service: Generates standardized Supabase paths and persists images
 */
export const storageService = {
  getStandardPaths(productId: string) {
    const cleanId = productId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return {
      mainStoragePath: `product-images/${cleanId}/main.webp`,
      thumbnailStoragePath: `product-images/${cleanId}/thumb.webp`
    };
  },

  async uploadProductImage(
    tenantId: string,
    productId: string,
    optimized: OptimizedImageResult
  ): Promise<{ imagePath: string; thumbnailPath: string }> {
    // If Supabase environment variables exist in the future, upload blobs here:
    // const { data, error } = await supabase.storage.from('product-images').upload(...)
    // Standard Supabase URL format: `${supabaseUrl}/storage/v1/object/public/${path}`

    // In client-first offline/mock architecture:
    // Persist optimized WebP data URLs directly into the isolated tenant data store
    return {
      imagePath: optimized.mainDataUrl,
      thumbnailPath: optimized.thumbnailDataUrl
    };
  }
};

/**
 * Curated Preset Library tailored for Mobile Shops & Retail Supermarkets
 */
export const PRODUCT_IMAGE_PRESETS: PresetImage[] = [
  // --- Mobile & Electronics Store ---
  {
    id: 'preset-phone-flagship',
    name: 'Flagship Smartphone',
    category: 'mobile',
    imagePath: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1000&auto=format&fit=crop&q=80',
    thumbnailPath: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&auto=format&fit=crop&q=80',
    description: 'Modern smartphone with triple camera system'
  },
  {
    id: 'preset-charger-gan',
    name: 'GaN Fast Charger 65W',
    category: 'mobile',
    imagePath: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1000&auto=format&fit=crop&q=80',
    thumbnailPath: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&auto=format&fit=crop&q=80',
    description: 'Compact dual-port fast charging power adapter'
  },
  {
    id: 'preset-cable-braided',
    name: 'Braided USB-C Cable',
    category: 'mobile',
    imagePath: 'https://images.unsplash.com/photo-1608248597359-25339d671ec4?w=1000&auto=format&fit=crop&q=80',
    thumbnailPath: 'https://images.unsplash.com/photo-1608248597359-25339d671ec4?w=300&auto=format&fit=crop&q=80',
    description: 'Heavy duty nylon braided high-speed sync cable'
  },
  {
    id: 'preset-audio-tws',
    name: 'Wireless ANC Earbuds',
    category: 'mobile',
    imagePath: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1000&auto=format&fit=crop&q=80',
    thumbnailPath: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=80',
    description: 'Noise cancelling TWS earbuds with charging case'
  },
  {
    id: 'preset-powerbank-mag',
    name: 'Magnetic Power Bank',
    category: 'mobile',
    imagePath: 'https://images.unsplash.com/photo-1609592424040-5e5898d975db?w=1000&auto=format&fit=crop&q=80',
    thumbnailPath: 'https://images.unsplash.com/photo-1609592424040-5e5898d975db?w=300&auto=format&fit=crop&q=80',
    description: '10,000mAh slim portable wireless battery pack'
  },
  {
    id: 'preset-smartwatch',
    name: 'Smart Fitness Watch',
    category: 'mobile',
    imagePath: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=1000&auto=format&fit=crop&q=80',
    thumbnailPath: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=300&auto=format&fit=crop&q=80',
    description: 'AMOLED fitness tracker with heart rate monitor'
  },
  {
    id: 'preset-case-protection',
    name: 'Protective Matte Case',
    category: 'mobile',
    imagePath: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1000&auto=format&fit=crop&q=80',
    thumbnailPath: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&auto=format&fit=crop&q=80',
    description: 'Shockproof slim bumper case with matte finish'
  },

  // --- Supermarket & Grocery Store ---
  {
    id: 'preset-grocery-rice',
    name: 'Premium Basmati Rice',
    category: 'grocery',
    imagePath: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1000&auto=format&fit=crop&q=80',
    thumbnailPath: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
    description: 'Long grain aged basmati rice package'
  },
  {
    id: 'preset-grocery-oil',
    name: 'Refined Sunflower Cooking Oil',
    category: 'grocery',
    imagePath: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=1000&auto=format&fit=crop&q=80',
    thumbnailPath: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=80',
    description: 'Pure cooking oil bottle for kitchen essentials'
  },
  {
    id: 'preset-grocery-atta',
    name: 'Chakki Whole Wheat Flour',
    category: 'grocery',
    imagePath: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1000&auto=format&fit=crop&q=80',
    thumbnailPath: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80',
    description: 'Stone ground 100% whole wheat grain flour'
  },
  {
    id: 'preset-grocery-tea',
    name: 'Premium Assam Black Tea',
    category: 'grocery',
    imagePath: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=1000&auto=format&fit=crop&q=80',
    thumbnailPath: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=80',
    description: 'Aromatic rich gold blend tea leaves'
  }
];
