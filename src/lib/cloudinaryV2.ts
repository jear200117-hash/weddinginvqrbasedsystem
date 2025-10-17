export const CLOUDINARY_CLOUD_NAME_V2 = 'ddjopmdsi';
export const CLOUDINARY_BASE_URL_V2 = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME_V2}/image/upload`;

export const CloudinaryV2Presets = {
  highQuality: 'q_auto:best,f_auto',
  auto: 'q_auto,f_auto',
  background: 'q_auto:low,f_auto',
  responsive: (width: number) => `w_${width},q_auto,f_auto`,
  thumbnail: 'w_400,h_400,c_fill,q_auto,f_auto',
  large: 'w_1920,q_auto:good,f_auto,fl_progressive',
};

export const getV2CloudinaryUrl = (
  folder: 'newimgs',
  filename: string,
  transformations?: string
): string => {
  const folderPath = folder ? `${folder}/` : '';
  const baseUrl = transformations
    ? `${CLOUDINARY_BASE_URL_V2}/${transformations}/${folderPath}${filename}`
    : `${CLOUDINARY_BASE_URL_V2}/${folderPath}${filename}`;
  return baseUrl;
};

export const getV2ImageUrl = (
  folder: 'newimgs',
  filename: string,
  preset?: string
): string => {
  return getV2CloudinaryUrl(folder, filename, preset);
};

export type V2IndexOptions = {
  prefix?: string;
  // If undefined/null, no extension will be appended (publicId without extension)
  extension?: 'jpg' | 'jpeg' | 'png' | 'webp' | null;
  suffixMap?: Record<number, string>;
};

export const getV2ImageByIndex = (
  index: number,
  options?: V2IndexOptions
): string => {
  const prefix = options?.prefix ?? 'imgs_';
  const extension = options?.extension ?? 'jpg';
  const suffix = options?.suffixMap?.[index];
  const baseId = suffix ? `${prefix}${index}_${suffix}` : `${prefix}${index}`;
  const filename = extension ? `${baseId}.${extension}` : baseId;
  return getV2ImageUrl('newimgs', filename, CloudinaryV2Presets.auto);
};

export const getV2ImageRange = (
  start: number,
  end: number,
  options?: V2IndexOptions
): string[] => {
  const out: string[] = [];
  for (let i = start; i <= end; i++) {
    out.push(getV2ImageByIndex(i, options));
  }
  return out;
};

// Use full publicId (path within Cloudinary) directly, with optional transformations
export const getV2ByPublicId = (
  publicId: string,
  transformations?: string
): string => {
  return transformations
    ? `${CLOUDINARY_BASE_URL_V2}/${transformations}/${publicId}`
    : `${CLOUDINARY_BASE_URL_V2}/${publicId}`;
};
