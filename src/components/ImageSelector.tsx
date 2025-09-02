'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { getAllWeddingImages, getVenueImages, ImageData } from '@/lib/imageUtils';

interface ImageSelectorProps {
  onImagesSelected: (imageNames: string[]) => void;
  currentSelection?: string[];
  className?: string;
}

export default function ImageSelector({ 
  onImagesSelected, 
  currentSelection = [],
  className = "" 
}: ImageSelectorProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>(currentSelection);
  const [activeTab, setActiveTab] = useState<'wedding' | 'venue'>('wedding');
  
  const weddingImages = getAllWeddingImages();
  const venueImages = getVenueImages();

  const handleImageToggle = (imageName: string) => {
    const newSelection = selectedImages.includes(imageName)
      ? selectedImages.filter(name => name !== imageName)
      : [...selectedImages, imageName];
    
    setSelectedImages(newSelection);
    onImagesSelected(newSelection);
  };

  const clearSelection = () => {
    setSelectedImages([]);
    onImagesSelected([]);
  };

  const selectAll = () => {
    const allImages = activeTab === 'wedding' 
      ? weddingImages.map(img => img.name)
      : venueImages.map(img => img.name);
    setSelectedImages(allImages);
    onImagesSelected(allImages);
  };

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Background Images</h3>
      
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setActiveTab('wedding')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'wedding' 
              ? 'bg-rose-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Wedding Images ({weddingImages.length})
        </button>
        <button
          onClick={() => setActiveTab('venue')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'venue' 
              ? 'bg-rose-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Venue Images ({venueImages.length})
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={selectAll}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Select All
        </button>
        <button
          onClick={clearSelection}
          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
        >
          Clear All
        </button>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
        {(activeTab === 'wedding' ? weddingImages : venueImages).map((image) => (
          <motion.div
            key={image.name}
            onClick={() => handleImageToggle(image.name)}
            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
              selectedImages.includes(image.name)
                ? 'border-rose-500 shadow-lg scale-105'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <img
              src={image.path}
              alt={image.name}
              className="w-full h-24 object-cover"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
            
            {/* Selection Indicator */}
            {selectedImages.includes(image.name) && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
              {image.name}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selection Summary */}
      <div className="mt-4 p-3 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-700">
          Selected: <span className="font-semibold">{selectedImages.length}</span> images
        </p>
        {selectedImages.length > 0 && (
          <p className="text-xs text-gray-600 mt-1">
            {selectedImages.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
