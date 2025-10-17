import { getV2ImageByIndex, getV2ImageRange, getV2ByPublicId } from '@/lib/cloudinaryV2';
import { V2_SUFFIX_MAP } from './v2ImageSuffixes';
import { V2_IMAGE_MANIFEST } from './v2ImageManifest';

// Resolve image by index using the manifest first (supports versioned publicIds),
// then fallback to suffixMap/index convention.
const resolveByIndex = (index: number) => {
  const publicId = V2_IMAGE_MANIFEST[index];
  if (publicId) {
    return getV2ByPublicId(publicId);
  }
  return getV2ImageByIndex(index, { suffixMap: V2_SUFFIX_MAP });
};

const resolveRange = (start: number, end: number) => {
  const out: string[] = [];
  for (let i = start; i <= end; i++) {
    out.push(resolveByIndex(i));
  }
  return out;
};

// Resolve multiple images by specific indices
const resolveBySelectedImages = (indices: number[]) => {
  return indices.map((index) => resolveByIndex(index));
};

export const V2_HERO_IMAGE = () => resolveByIndex(1);

export const V2_STORY_IMAGES = () => resolveRange(2, 6);

export const V2_TIMELINE_BG = () => resolveByIndex(29);

export const V2_IMAGE_STRIP = () => resolveRange(123, 125);

export const V2_ENTOURAGE_BG = () => resolveByIndex(17);

export const V2_VENUE_IMAGES = () => ({
  ceremony: resolveByIndex(12),
  reception: resolveByIndex(13),
});

export const V2_DRESSCODE_IMAGES = () => ({
  palette: resolveByIndex(14),
  men: resolveByIndex(15),
  women: resolveByIndex(16),
});

// Utility function to resolve custom image selections
// Usage: V2_CUSTOM_IMAGES([8, 15, 23, 45]) returns URLs for those specific images
export const V2_CUSTOM_IMAGES = (indices: number[]) => resolveBySelectedImages(indices);
