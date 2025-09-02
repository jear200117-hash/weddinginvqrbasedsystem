'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getWeddingImages, ImageData } from '@/lib/imageUtils';

interface StoryCarouselProps {
  images?: string[]; // Custom image names to use
  className?: string;
}

export default function StoryCarousel({ 
  images: customImages,
  className = "" 
}: StoryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  
  // Get 6 images - either custom selection or first 6 wedding images
  const getCarouselImages = (): ImageData[] => {
    if (customImages && customImages.length > 0) {
      const allImages = getWeddingImages(16); // Get all images first
      return allImages.filter(img => customImages.includes(img.name)).slice(0, 6);
    }
    return getWeddingImages(6); // Default to first 6 images
  };
  
  const [carouselImages] = useState<ImageData[]>(getCarouselImages());

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      if (newDirection > 0) {
        return prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1;
      } else {
        return prevIndex === 0 ? carouselImages.length - 1 : prevIndex - 1;
      }
    });
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1);
    }, 8000); // Change every 8 seconds (slower)

    return () => clearInterval(timer);
  }, [currentIndex]);

  if (carouselImages.length === 0) {
    return (
      <div className={`aspect-[4/3] rounded-xl overflow-hidden shadow-xl bg-gray-50 ${className}`}>
        <div className="w-full h-full bg-gradient-to-br from-sage-green/20 via-dusty-rose/30 to-slate-blue/20 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">📸</div>
            <div className="text-xl font-light">Our Journey Together</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Carousel Container */}
      <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-xl bg-gray-50">
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={currentIndex}
            src={carouselImages[currentIndex].path}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
                         transition={{
               x: { type: "spring", stiffness: 200, damping: 40 },
               opacity: { duration: 0.4 }
             }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
            alt={`Story image ${currentIndex + 1}`}
          />
        </AnimatePresence>
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
        
        {/* Navigation Arrows */}
        <button 
          onClick={() => paginate(-1)}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-105 transition-all duration-300 z-20"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5 text-slate-blue" />
        </button>
        
        <button 
          onClick={() => paginate(1)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-105 transition-all duration-300 z-20"
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5 text-slate-blue" />
        </button>
        
        {/* Carousel Dots - Inside the image container */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white scale-110 shadow-lg' 
                  : 'bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
