'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ExternalLink, AlertCircle } from 'lucide-react';

interface PrenupVideoProps {
  videoConfig: {
    videoUrl: string;
    embedUrl?: string;
    directUrl?: string;
    description: string;
  };
  className?: string;
}

export default function PrenupVideo({ videoConfig, className = "" }: PrenupVideoProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Extract file ID from Google Drive URL
  const getGoogleDriveFileId = (url: string) => {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  // Generate proper Google Drive embed URL
  const getGoogleDriveEmbedUrl = (url: string) => {
    const fileId = getGoogleDriveFileId(url);
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return url;
  };

  // Handle iframe load events
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // Handle fallback to direct link
  const handleFallbackClick = () => {
    setShowFallback(true);
  };

  const embedUrl = videoConfig.embedUrl || getGoogleDriveEmbedUrl(videoConfig.videoUrl);

  return (
    <div className={` p-6 md:p-8 ${className}`}>
      
      {/* Video Container */}
      <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg bg-gray-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-blue mx-auto mb-4"></div>
              <p className="text-slate-blue">Loading video...</p>
            </div>
          </div>
        )}
        
        {hasError && !showFallback && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center p-6">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">Unable to load video</p>
              <button
                onClick={handleFallbackClick}
                className="px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 transition-colors"
              >
                Open Video Link
              </button>
            </div>
          </div>
        )}
        
        {!hasError && !showFallback && (
          <iframe
            className="w-full h-full"
            src={embedUrl}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}
        
        {showFallback && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-blue/10 to-dusty-rose/10">
            <div className="text-center p-6">
              <Play className="w-16 h-16 text-slate-blue mx-auto mb-4" />
              <p className="text-slate-blue mb-4">Video will open in a new tab</p>
              <a
                href={videoConfig.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-blue text-white rounded-full hover:bg-slate-blue/90 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Watch Prenup Video
              </a>
            </div>
          </div>
        )}
      </div>
      
      <p className="text-lg text-sage-green font-light mt-6 italic">
        {videoConfig.description}
      </p>
      
      {/* Fallback link for mobile or if iframe fails */}
      <div className="mt-4 text-center">
        <a
          href={videoConfig.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-slate-blue hover:text-slate-blue/80 transition-colors text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          Open video in new tab
        </a>
      </div>
    </div>
  );
}
