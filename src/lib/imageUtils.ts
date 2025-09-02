import imagesData from '../../public/images.json';

export interface ImageData {
  name: string;
  path: string;
  fullPath: string;
  size: string;
  category: string;
}

export const getWeddingImages = (count: number = 4): ImageData[] => {
  return imagesData.weddingimgs.slice(0, count);
};

export const getCustomWeddingImages = (imageNames: string[]): ImageData[] => {
  return imagesData.weddingimgs.filter(img => imageNames.includes(img.name));
};

export const getImagesByNames = (imageNames: string[]): ImageData[] => {
  const allImages = [...imagesData.weddingimgs, ...imagesData.imgs];
  return allImages.filter(img => imageNames.includes(img.name));
};

export const getAllWeddingImages = (): ImageData[] => {
  return imagesData.weddingimgs;
};

export const getVenueImages = (): ImageData[] => {
  return imagesData.imgs;
};

export const getRandomWeddingImages = (count: number = 4): ImageData[] => {
  const shuffled = [...imagesData.weddingimgs].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const getImagePath = (image: ImageData): string => {
  return image.path;
};
