import React, { useState, useEffect } from 'react';

interface AnimatedBackgroundProps {
  opacity?: number;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ opacity = 0.15 }) => {
  const [isReady, setIsReady] = useState(false);

  // Only use first 8 images for better performance
  const weddingImages = Array.from({ length: 8 }, (_, i) => `/weddingimgs/img${i + 1}.jpg`);

  // Create 2 columns only (performance optimization)
  const columns = [
    weddingImages.slice(0, 4),  // Column 1
    weddingImages.slice(4, 8)   // Column 2
  ];

  // Delay rendering to prevent initial load lag
  useEffect(() => {
    // Wait for page to be fully loaded and interactive
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2000); // 2 second delay for Netlify

    return () => clearTimeout(timer);
  }, []);

  // Don't render until ready
  if (!isReady) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden" 
      style={{ opacity }}
    >
      <div className="flex w-full h-full gap-1 sm:gap-2">
        {columns.map((columnImages, columnIndex) => {
          // Alternate direction
          const direction = columnIndex % 2 === 0 ? 'up' : 'down';
          
          // Simple CSS keyframe animations (much lighter than Framer Motion)
          const animationName = direction === 'up' ? 'scrollUp' : 'scrollDown';
          const duration = 40 + (columnIndex * 10); // 40s, 50s (very slow)

          return (
            <div 
              key={columnIndex} 
              className="flex-1 relative overflow-hidden"
            >
              <div
                className="flex flex-col"
                style={{ 
                  animation: `${animationName} ${duration}s linear infinite`,
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden'
                }}
              >
                {/* Render images twice for seamless loop */}
                {[...columnImages, ...columnImages].map((imageSrc, imageIndex) => (
                  <div
                    key={imageIndex}
                    className="w-full h-[25vh] mb-2 flex-shrink-0"
                  >
                    <img
                      src={imageSrc}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                      loading="lazy"
                      draggable={false}
                      decoding="async"
                      style={{ 
                        transform: 'translate3d(0, 0, 0)',
                        contentVisibility: 'auto'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* CSS Keyframe Animations */}
      <style jsx>{`
        @keyframes scrollUp {
          from {
            transform: translateY(0%);
          }
          to {
            transform: translateY(-50%);
          }
        }

        @keyframes scrollDown {
          from {
            transform: translateY(-50%);
          }
          to {
            transform: translateY(0%);
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;
