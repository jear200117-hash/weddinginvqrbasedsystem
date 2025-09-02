'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWeddingImages, getCustomWeddingImages, getImagesByNames, getVenueImages, ImageData } from '@/lib/imageUtils';

// Preload images for smooth transitions
const preloadImages = (images: ImageData[]) => {
  images.forEach(image => {
    const img = new Image();
    img.src = image.path;
  });
};

interface RotatingBackgroundProps {
  interval?: number; // Time in milliseconds between transitions
  opacity?: number; // Background opacity
  className?: string;
  showIndicators?: boolean; // Show image indicators
  customImages?: string[]; // Array of image names to use (e.g., ['img1.jpg', 'img3.jpg', 'img5.jpg'])
  imageSource?: 'wedding' | 'venue' | 'all'; // Source of images to use
}

export default function RotatingBackground({ 
  interval = 5000, 
  opacity = 0.2,
  className = "",
  showIndicators = false,
  customImages,
  imageSource = 'wedding'
}: RotatingBackgroundProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Determine which images to use
  const getImages = (): ImageData[] => {
    if (customImages && customImages.length > 0) {
      return getImagesByNames(customImages);
    }
    
    switch (imageSource) {
      case 'venue':
        return getVenueImages();
      case 'all':
        return getWeddingImages(4).concat(getVenueImages());
      case 'wedding':
      default:
        return getWeddingImages(4);
    }
  };
  
  const [images] = useState<ImageData[]>(getImages());
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload images on component mount
  useEffect(() => {
    preloadImages(images);
    setImagesLoaded(true);
  }, [images]);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  if (images.length === 0 || !imagesLoaded) {
    return (
      <div className={`absolute inset-0 bg-gradient-to-br from-rose-50 to-pink-100 ${className}`}>
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImageIndex}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${images[currentImageIndex].path})`,
            opacity: opacity
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: opacity }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </AnimatePresence>
      
      {/* Image Indicators */}
      {showIndicators && images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <motion.div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentImageIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 scale-100'
              }`}
              animate={{
                scale: index === currentImageIndex ? 1.25 : 1,
                opacity: index === currentImageIndex ? 1 : 0.5
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
