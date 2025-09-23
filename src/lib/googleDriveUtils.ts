/**
 * Utility functions for handling Google Drive URLs
 */

/**
 * Converts a Google Drive file ID to a viewable image URL
 * @param fileId - Google Drive file ID
 * @param width - Optional width parameter for sizing (if not provided, returns full resolution)
 * @returns Viewable image URL
 */
export function getDriveViewUrl(fileId: string, width?: number): string {
  if (!fileId) return '';
  
  // Use lh3.googleusercontent.com for better performance and reliability
  const baseUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
  return width && width > 0 ? `${baseUrl}=w${width}` : baseUrl;
}

/**
 * Converts a Google Drive file ID to a download URL
 * @param fileId - Google Drive file ID
 * @returns Download URL
 */
export function getDriveDownloadUrl(fileId: string): string {
  if (!fileId) return '';
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Extracts file ID from various Google Drive URL formats
 * @param url - Google Drive URL
 * @returns File ID or null if not found
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  
  // Handle lh3.googleusercontent.com URLs
  const lh3Match = url.match(/lh3\.googleusercontent\.com\/d\/([^=]+)/);
  if (lh3Match) return lh3Match[1];
  
  // Handle drive.google.com/uc URLs
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*[?&]id=([^&]+)/);
  if (ucMatch) return ucMatch[1];
  
  // Handle drive.google.com/file URLs
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
  if (fileMatch) return fileMatch[1];
  
  return null;
}

/**
 * Gets the best display URL for a Google Drive file
 * @param url - Original URL (could be any format)
 * @param fileId - Optional file ID if known
 * @param width - Optional width for sizing (if not provided, returns full resolution)
 * @param mediaType - Type of media ('image' or 'video')
 * @returns Best display URL
 */
export function getBestDisplayUrl(url: string, fileId?: string, width?: number, mediaType?: string): string {
  // If we have a fileId, use it directly
  if (fileId) {
    // For videos, use download URL instead of view URL for better compatibility
    if (mediaType === 'video') {
      return getDriveDownloadUrl(fileId);
    }
    return getDriveViewUrl(fileId, width);
  }
  
  // Try to extract fileId from URL
  const extractedFileId = extractDriveFileId(url);
  if (extractedFileId) {
    // For videos, use download URL instead of view URL for better compatibility
    if (mediaType === 'video') {
      return getDriveDownloadUrl(extractedFileId);
    }
    return getDriveViewUrl(extractedFileId, width);
  }
  
  // Fallback to original URL
  return url;
}

/**
 * Gets the best display URL for full-size viewing (no width restrictions)
 * @param url - Original URL (could be any format)
 * @param fileId - Optional file ID if known
 * @param mediaType - Type of media ('image' or 'video')
 * @returns Full-resolution display URL
 */
export function getFullSizeDisplayUrl(url: string, fileId?: string, mediaType?: string): string {
  return getBestDisplayUrl(url, fileId, undefined, mediaType); // No width parameter = full resolution
}

/**
 * Gets the best video URL for playback (streaming, not download)
 * @param url - Original URL
 * @param fileId - Optional file ID if known
 * @returns Video URL optimized for streaming playback
 */
export function getVideoPlaybackUrl(url: string, fileId?: string): string {
  // If we have a fileId, use streaming URL instead of download
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
  // Try to extract fileId from URL
  const extractedFileId = extractDriveFileId(url);
  if (extractedFileId) {
    return `https://drive.google.com/file/d/${extractedFileId}/preview`;
  }
  
  // If it's already a preview URL, return as is
  if (url.includes('/preview')) {
    return url;
  }
  
  // Fallback to original URL
  return url;
}

/**
 * Gets the video download URL (for downloading, not streaming)
 * @param url - Original URL
 * @param fileId - Optional file ID if known
 * @returns Video URL for downloading
 */
export function getVideoDownloadUrl(url: string, fileId?: string): string {
  // If we have a fileId, use download URL
  if (fileId) {
    return getDriveDownloadUrl(fileId);
  }
  
  // Try to extract fileId from URL
  const extractedFileId = extractDriveFileId(url);
  if (extractedFileId) {
    return getDriveDownloadUrl(extractedFileId);
  }
  
  // If it's already a download URL, return as is
  if (url.includes('drive.google.com/uc?export=download')) {
    return url;
  }
  
  // Fallback to original URL
  return url;
}

/**
 * Checks if a URL is a Google Drive URL
 * @param url - URL to check
 * @returns True if it's a Google Drive URL
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('drive.google.com') || url.includes('lh3.googleusercontent.com');
}
