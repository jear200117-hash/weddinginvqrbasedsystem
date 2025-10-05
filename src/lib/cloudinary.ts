/**
 * Cloudinary Image Utility
 * Handles image URL generation for Cloudinary-hosted images
 */

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'ddjopmdsi';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Debug - Check if environment variable is loaded
if (typeof window !== 'undefined') {
  console.log('🔍 Cloudinary Cloud Name:', CLOUDINARY_CLOUD_NAME || '❌ NOT SET');
  console.log('🔍 Base URL:', CLOUDINARY_BASE_URL);
}

/**
 * Generate Cloudinary URL for images
 * @param folder - The folder name (imgs or weddingimgs) - not used in URL, kept for API consistency
 * @param filename - The image filename
 * @param transformations - Optional Cloudinary transformations (e.g., 'w_800,q_auto,f_auto')
 * @returns Full Cloudinary URL
 */
export const getCloudinaryUrl = (
  folder: 'imgs' | 'weddingimgs',
  filename: string,
  transformations?: string
): string => {
  // Keep filename as-is (Cloudinary public IDs include file extensions)
  // Build Cloudinary URL with optional transformations
  // Images are at root level in Cloudinary (no folder structure)
  const baseUrl = transformations 
    ? `${CLOUDINARY_BASE_URL}/${transformations}/${filename}`
    : `${CLOUDINARY_BASE_URL}/${filename}`;

  return baseUrl;
};

/**
 * Preset transformations for common use cases
 */
export const CloudinaryPresets = {
  // High quality for logos and important images
  highQuality: 'q_auto:best,f_auto',
  
  // Auto optimization for general images
  auto: 'q_auto,f_auto',
  
  // Optimized for backgrounds (lower quality since they're often with low opacity)
  background: 'q_auto:low,f_auto',
  
  // Responsive images with width
  responsive: (width: number) => `w_${width},q_auto,f_auto`,
  
  // Thumbnails
  thumbnail: 'w_400,h_400,c_fill,q_auto,f_auto',
  
  // Large images with progressive loading
  large: 'w_1920,q_auto:good,f_auto,fl_progressive',
};

/**
 * Helper function to get image URL with preset
 */
export const getImageUrl = (
  folder: 'imgs' | 'weddingimgs',
  filename: string,
  preset?: string
): string => {
  return getCloudinaryUrl(folder, filename, preset);
};

/**
 * Get all wedding images for AnimatedBackground
 */
export const getAllWeddingImages = (transformations?: string): string[] => {
  return Array.from({ length: 30 }, (_, i) => 
    getCloudinaryUrl('weddingimgs', `img${i + 1}.jpg`, transformations)
  );
};
