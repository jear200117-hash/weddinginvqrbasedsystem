'use client';

import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface VideoTestProps {
  videoUrl: string;
  title?: string;
}

export const VideoTest: React.FC<VideoTestProps> = ({ videoUrl, title = 'Test Video' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  const togglePlay = () => {
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoElement) {
      videoElement.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoRef = (element: HTMLVideoElement | null) => {
    if (element) {
      setVideoElement(element);
      
      // Add event listeners
      element.addEventListener('loadedmetadata', () => {
        console.log('Video metadata loaded');
      });
      
      element.addEventListener('canplay', () => {
        console.log('Video can play');
      });
      
      element.addEventListener('error', (e) => {
        console.error('Video error:', e);
      });
      
      element.addEventListener('loadstart', () => {
        console.log('Video load started');
      });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="relative">
        <video
          ref={handleVideoRef}
          src={videoUrl}
          className="w-full h-64 object-cover"
          preload="metadata"
          muted={isMuted}
          playsInline
          style={{
            display: 'block',
            opacity: 1,
            visibility: 'visible',
            filter: 'none',
            transform: 'none',
            position: 'relative',
            zIndex: 1,
            backgroundColor: 'transparent'
          }}
        />
        
        {/* Video Controls Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="bg-white bg-opacity-90 rounded-full p-3 shadow-lg">
            {isPlaying ? (
              <Pause className="text-blue-600" size={24} />
            ) : (
              <Play className="text-blue-600" size={24} />
            )}
          </div>
        </div>
        
        {/* Control Buttons */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <button
            onClick={togglePlay}
            className="bg-white bg-opacity-90 rounded-full p-2 shadow-lg hover:bg-opacity-100 transition-all"
          >
            {isPlaying ? (
              <Pause className="text-blue-600" size={20} />
            ) : (
              <Play className="text-blue-600" size={20} />
            )}
          </button>
          
          <button
            onClick={toggleMute}
            className="bg-white bg-opacity-90 rounded-full p-2 shadow-lg hover:bg-opacity-100 transition-all"
          >
            {isMuted ? (
              <VolumeX className="text-blue-600" size={20} />
            ) : (
              <Volume2 className="text-blue-600" size={20} />
            )}
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-3">Video URL: {videoUrl}</p>
        
        <div className="space-y-2 text-xs text-gray-500">
          <div>Status: {isPlaying ? 'Playing' : 'Paused'}</div>
          <div>Muted: {isMuted ? 'Yes' : 'No'}</div>
          <div>Video Element: {videoElement ? 'Loaded' : 'Not Loaded'}</div>
        </div>
        
        {/* Debug Info */}
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <h4 className="font-semibold mb-2">Debug Info:</h4>
          <div>Video URL: {videoUrl}</div>
          <div>Video Type: {videoUrl.split('.').pop()}</div>
          <div>Element State: {videoElement ? 'Ready' : 'Loading'}</div>
        </div>
      </div>
    </div>
  );
};

export default VideoTest;
