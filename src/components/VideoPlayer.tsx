'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertCircle, ExternalLink } from 'lucide-react';
import { getVideoPlaybackUrl, isGoogleDriveUrl, getDriveDownloadUrl, extractDriveFileId } from '@/lib/googleDriveUtils';

interface VideoPlayerProps {
  src: string;
  googleDriveFileId?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  poster?: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  googleDriveFileId,
  className = '',
  controls = true,
  autoPlay = false,
  muted = true,
  poster,
  onError,
  onLoad
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  // Get the best video URL for playback
  const videoUrl = getVideoPlaybackUrl(src, googleDriveFileId);
  
  // Alternative URLs to try if the primary fails
  const alternativeUrls = [
    videoUrl,
    src,
    googleDriveFileId ? getDriveDownloadUrl(googleDriveFileId) : null,
    googleDriveFileId ? `https://drive.google.com/file/d/${googleDriveFileId}/preview` : null
  ].filter(Boolean) as string[];

  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const currentUrl = alternativeUrls[currentUrlIndex] || videoUrl;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setIsLoading(false);
      setHasError(false);
      setDuration(video.duration);
      onLoad?.();
    };

    const handleError = (e: Event) => {
      console.error('Video error:', e);
      const errorMsg = `Failed to load video (attempt ${currentUrlIndex + 1}/${alternativeUrls.length})`;
      
      // Try next URL if available
      if (currentUrlIndex < alternativeUrls.length - 1) {
        setCurrentUrlIndex(prev => prev + 1);
        return;
      }

      // All URLs failed
      setIsLoading(false);
      setHasError(true);
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [currentUrl, currentUrlIndex, alternativeUrls.length, onError, onLoad]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(err => {
        console.error('Play failed:', err);
        setHasError(true);
        setErrorMessage('Failed to play video');
      });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleFallbackClick = () => {
    setShowFallback(true);
    // Open video in new tab as fallback
    window.open(videoUrl, '_blank');
  };

  if (hasError && !showFallback) {
    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex items-center justify-center bg-gray-800">
          <div className="text-center p-6">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Video playback failed</p>
            <p className="text-gray-400 text-sm mb-4">{errorMessage}</p>
            <div className="space-y-2">
              <button
                onClick={handleFallbackClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <ExternalLink className="w-4 h-4" />
                Open Video Link
              </button>
              {isGoogleDriveUrl(src) && (
                <p className="text-xs text-gray-500">
                  Note: Google Drive videos may require permission to view
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Loading video...</p>
            <p className="text-gray-400 text-sm mt-2">
              Trying URL {currentUrlIndex + 1} of {alternativeUrls.length}
            </p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src={currentUrl}
        className="w-full h-full object-contain"
        controls={false} // We'll use custom controls
        autoPlay={autoPlay}
        muted={isMuted}
        playsInline
        poster={poster}
        preload="metadata"
      />

      {/* Custom Controls */}
      {controls && !isLoading && !hasError && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <button
              onClick={handleFallbackClick}
              className="text-white hover:text-blue-400 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
