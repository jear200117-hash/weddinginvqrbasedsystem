import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllWeddingImages, CloudinaryPresets } from '@/lib/cloudinary';

interface AnimatedBackgroundProps {
  opacity?: number;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ opacity = 0.15 }) => {
  const [isReady, setIsReady] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(0);

  // Create an array of all wedding images from Cloudinary
  const weddingImages = getAllWeddingImages(CloudinaryPresets.background);

  // Create columns - each column will have 4 images stacked vertically
  const columns = [];
  for (let i = 0; i < weddingImages.length; i += 4) {
    columns.push(weddingImages.slice(i, i + 4));
  }

  // Preload images and track loading
  useEffect(() => {
    let loadedCount = 0;
    const totalImages = 8; // Only track first 8 images (2 columns worth) for faster startup

    // Preload only the first 8 images
    weddingImages.slice(0, 8).forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        setImagesLoaded(loadedCount);
        
        // Once enough images loaded, start animations
        if (loadedCount >= 4) { // Start after 4 images (1 column)
          setTimeout(() => setIsReady(true), 300);
        }
      };
      img.onerror = () => {
        loadedCount++;
        setImagesLoaded(loadedCount);
      };
    });
  }, []);

  // Don't render until at least some images are loaded
  if (imagesLoaded < 2) {
    return null;
  }

  return (
    <motion.div 
      className="fixed inset-0 pointer-events-none overflow-hidden" 
      style={{ opacity }}
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 0.8 }}
    >
      <div className="flex w-full h-full gap-1 sm:gap-2">
        {columns.map((columnImages, columnIndex) => {
          // Alternate direction for each column (up, down, up, down)
          const direction = columnIndex % 2 === 0 ? -1 : 1;

          // Different speeds for each column to create depth
          const duration = 30 + (columnIndex * 8); // 30s, 38s, 46s, 54s (much slower)

          return (
            <div 
              key={columnIndex} 
              className={`flex-1 relative overflow-hidden ${columnIndex > 1 ? 'hidden sm:block' : ''}`}
            >
              <motion.div
                className="flex flex-col"
                style={{ 
                  willChange: isReady ? 'transform' : 'auto',
                  backfaceVisibility: 'hidden',
                  perspective: 1000
                }}
                animate={isReady ? {
                  y: direction === -1 ? ['0%', '-50%'] : ['-50%', '0%']
                } : {}}
                transition={{
                  duration: duration,
                  repeat: Infinity,
                  ease: "linear",
                  repeatType: "loop"
                }}
              >
                {/* Render images twice for seamless loop */}
                {[...columnImages, ...columnImages].map((imageSrc, imageIndex) => (
                  <div
                    key={imageIndex}
                    className="w-full h-[20vh] sm:h-[25vh] mb-1 sm:mb-2 flex-shrink-0"
                  >
                    <img
                      src={imageSrc}
                      alt=""
                      className="w-full h-full object-cover rounded-md sm:rounded-lg"
                      loading={imageIndex < 4 ? 'eager' : 'lazy'}
                      draggable={false}
                      decoding="async"
                      style={{ 
                        WebkitTransform: 'translate3d(0, 0, 0)',
                        transform: 'translate3d(0, 0, 0)',
                        contentVisibility: 'auto'
                      }}
                    />
                  </div>
                ))}
              </motion.div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default AnimatedBackground;
