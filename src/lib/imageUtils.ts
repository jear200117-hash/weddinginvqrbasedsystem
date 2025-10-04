import imagesData from '../../public/images.json';
import { getCloudinaryUrl, CloudinaryPresets } from '@/lib/cloudinary';

export interface ImageData {
  name: string;
  path: string;
  fullPath: string;
  size: string;
  category: string;
}

// Default Cloudinary transformation for general use
const DEFAULT_TRANSFORM = CloudinaryPresets.auto;

type Folder = 'imgs' | 'weddingimgs';

function toCloudinaryImage(
  folder: Folder,
  image: { name: string; size: string; category: string }
): ImageData {
  const url = getCloudinaryUrl(folder, image.name, DEFAULT_TRANSFORM);
  return {
    name: image.name,
    path: url,
    fullPath: url,
    size: image.size,
    category: image.category,
  };
}

export const getWeddingImages = (count: number = 4): ImageData[] => {
  return imagesData.weddingimgs
    .slice(0, count)
    .map((img: any) => toCloudinaryImage('weddingimgs', img));
};

export const getCustomWeddingImages = (imageNames: string[]): ImageData[] => {
  return imagesData.weddingimgs
    .filter((img: any) => imageNames.includes(img.name))
    .map((img: any) => toCloudinaryImage('weddingimgs', img));
};

export const getImagesByNames = (imageNames: string[]): ImageData[] => {
  const weddingByName = new Map<string, any>(
    imagesData.weddingimgs.map((img: any) => [img.name, img])
  );
  const imgsByName = new Map<string, any>(
    imagesData.imgs.map((img: any) => [img.name, img])
  );

  const result: ImageData[] = [];
  for (const name of imageNames) {
    if (weddingByName.has(name)) {
      result.push(toCloudinaryImage('weddingimgs', weddingByName.get(name)));
    } else if (imgsByName.has(name)) {
      result.push(toCloudinaryImage('imgs', imgsByName.get(name)));
    }
  }
  return result;
};

export const getAllWeddingImages = (): ImageData[] => {
  return imagesData.weddingimgs.map((img: any) =>
    toCloudinaryImage('weddingimgs', img)
  );
};

export const getVenueImages = (): ImageData[] => {
  return imagesData.imgs.map((img: any) => toCloudinaryImage('imgs', img));
};

export const getRandomWeddingImages = (count: number = 4): ImageData[] => {
  const shuffled = [...imagesData.weddingimgs].sort(() => 0.5 - Math.random());
  return shuffled
    .slice(0, count)
    .map((img: any) => toCloudinaryImage('weddingimgs', img));
};

export const getImagePath = (image: ImageData): string => {
  return image.path;
};
