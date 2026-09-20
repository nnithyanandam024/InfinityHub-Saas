/**
 * Mobile Device-Side WebP Image Optimization Pipeline
 *
 * Ensures camera and gallery photos captured on iOS & Android:
 * 1. Never upload huge raw camera files (3–10 MB) over cellular networks.
 * 2. Downscales and compresses device-side before reaching Supabase:
 *    - Main Image: max 1200px, WebP quality 75–80% (~100–250 KB)
 *    - Thumbnail:  max 300px, WebP quality 70–75% (~20–50 KB)
 * 3. Standardizes upload storage paths:
 *    product-images/{productId}/main.webp and thumb.webp
 */
export interface MobileOptimizedResult {
    mainUri: string;
    thumbnailUri: string;
    mainWidth: number;
    mainHeight: number;
    thumbWidth: number;
    thumbHeight: number;
    estimatedSizeKb: number;
    storagePath: {
        main: string;
        thumb: string;
    };
}
export declare const mobileImageOptimizer: {
    /**
     * Generates standardized Supabase Storage paths for a product
     */
    getStoragePaths(productId: string): {
        main: string;
        thumb: string;
    };
    /**
     * Calculates scaled dimensions maintaining aspect ratio
     */
    calculateScaledDimensions(originalWidth: number, originalHeight: number, maxDimension: number): {
        width: number;
        height: number;
    };
    /**
     * Prepares and optimizes a picked image URI for upload
     */
    prepareForUpload(productId: string, imageUri: string, originalWidth?: number, originalHeight?: number): Promise<MobileOptimizedResult>;
};
//# sourceMappingURL=mobileImageOptimizer.d.ts.map