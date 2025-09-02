import React, { useState } from 'react';
import { LazyImage, useLazyLoadImage, useLazyLoadContent } from '@/lib/lazyLoad';
import { LazyAlbumImage, useLazyAlbumImages } from './LazyAlbumImage';
import { useLazyLoadWithPerformance } from '@/hooks/useLazyLoadWithPerformance';
import { getPerformanceSummary, exportPerformanceReport } from '@/lib/performance';

// Example data
const sampleImages = [
  { src: 'https://picsum.photos/400/400?random=1', alt: 'Wedding Photo 1' },
  { src: 'https://picsum.photos/400/400?random=2', alt: 'Wedding Photo 2' },
  { src: 'https://picsum.photos/400/400?random=3', alt: 'Wedding Photo 3' },
  { src: 'https://picsum.photos/400/400?random=4', alt: 'Wedding Photo 4' },
  { src: 'https://picsum.photos/400/400?random=5', alt: 'Wedding Photo 5' },
  { src: 'https://picsum.photos/400/400?random=6', alt: 'Wedding Photo 6' },
  { src: 'https://picsum.photos/400/400?random=7', alt: 'Wedding Photo 7' },
  { src: 'https://picsum.photos/400/400?random=8', alt: 'Wedding Photo 8' },
  { src: 'https://picsum.photos/400/400?random=9', alt: 'Wedding Photo 9' },
  { src: 'https://picsum.photos/400/400?random=10', alt: 'Wedding Photo 10' },
];

export const LazyLoadingExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'basic' | 'album' | 'performance' | 'batch'>('basic');
  
  // Performance summary
  const performanceSummary = getPerformanceSummary();

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Lazy Loading Examples</h1>
        <p className="text-gray-600">
          Explore different lazy loading implementations for optimal performance
        </p>
      </div>

      {/* Performance Dashboard */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Dashboard</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{performanceSummary.totalImages}</div>
            <div className="text-sm text-gray-600">Total Images</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{performanceSummary.successRate}</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{performanceSummary.averageLoadTime}</div>
            <div className="text-sm text-gray-600">Avg Load Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{performanceSummary.bandwidthUsed}</div>
            <div className="text-sm text-gray-600">Bandwidth</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{performanceSummary.cacheHitRate}</div>
            <div className="text-sm text-gray-600">Cache Hit Rate</div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => exportPerformanceReport()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'basic', label: 'Basic Lazy Loading' },
            { id: 'album', label: 'Album Images' },
            { id: 'performance', label: 'Performance Tracking' },
            { id: 'batch', label: 'Batch Loading' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'basic' && <BasicLazyLoading />}
      {activeTab === 'album' && <AlbumLazyLoading />}
      {activeTab === 'performance' && <PerformanceTracking />}
      {activeTab === 'batch' && <BatchLoading />}
    </div>
  );
};

// Basic Lazy Loading Example
const BasicLazyLoading: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Lazy Loading</h3>
        <p className="text-gray-600 mb-4">
          Simple lazy loading using the LazyImage component
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleImages.slice(0, 6).map((image, index) => (
            <LazyImage
              key={index}
              src={image.src}
              alt={image.alt}
              className="w-full h-48 object-cover rounded-lg shadow-md"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Album Lazy Loading Example
const AlbumLazyLoading: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Album Image Lazy Loading</h3>
        <p className="text-gray-600 mb-4">
          Specialized lazy loading for wedding album images with custom styling
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleImages.slice(0, 6).map((image, index) => (
            <LazyAlbumImage
              key={index}
              src={image.src}
              alt={image.alt}
              className="aspect-square"
              showLoadingState={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Performance Tracking Example
const PerformanceTracking: React.FC = () => {
  const { elementRef, state, retry } = useLazyLoadWithPerformance({
    src: 'https://picsum.photos/600/400?random=99',
    alt: 'Performance Tracked Image',
    enablePerformanceTracking: true,
    threshold: 0.1,
    rootMargin: '100px',
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Tracking</h3>
        <p className="text-gray-600 mb-4">
          Track load times, errors, and performance metrics for individual images
        </p>
        
        <div ref={elementRef} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Image Status</h4>
            <div className="space-y-2 text-sm">
              <div>Visible: {state.isVisible ? '✅' : '❌'}</div>
              <div>Loading: {state.isLoading ? '🔄' : '✅'}</div>
              <div>Loaded: {state.isLoaded ? '✅' : '❌'}</div>
              <div>Error: {state.hasError ? '❌' : '✅'}</div>
              {state.loadTime > 0 && (
                <div>Load Time: {state.loadTime.toFixed(2)}ms</div>
              )}
            </div>
          </div>

          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {state.isLoading && (
              <div className="text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                Loading image...
              </div>
            )}
            
            {state.hasError && (
              <div className="text-red-500">
                <div className="mb-2">❌ Failed to load image</div>
                <button
                  onClick={retry}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                >
                  Retry
                </button>
              </div>
            )}
            
            {state.isLoaded && (
              <img
                src="https://picsum.photos/600/400?random=99"
                alt="Performance Tracked Image"
                className="w-full h-64 object-cover rounded-lg shadow-md"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Batch Loading Example
const BatchLoading: React.FC = () => {
  const { visibleImages, hasMore, loadNextBatch, isLoading, totalImages, loadedCount, markImageLoaded } = useLazyAlbumImages(
    sampleImages,
    { batchSize: 3, preloadFirst: true }
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Loading</h3>
        <p className="text-gray-600 mb-4">
          Load images in batches for better performance and user experience
        </p>
        
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            Loaded {loadedCount} of {totalImages} images
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {visibleImages.map((image, index) => (
            <LazyAlbumImage
              key={index}
              src={image.src}
              alt={image.alt ?? ''}
              className="aspect-square"
              showLoadingState={true}
              onLoad={() => markImageLoaded(image.src)}
            />
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadNextBatch}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Loading...' : 'Load More Images'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LazyLoadingExample;
