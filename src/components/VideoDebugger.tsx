'use client';

import React, { useState } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { getVideoPlaybackUrl, getVideoDownloadUrl, getDriveDownloadUrl, extractDriveFileId } from '@/lib/googleDriveUtils';

interface VideoDebuggerProps {
  media: {
    url: string;
    googleDriveFileId?: string;
    originalName?: string;
    mediaType?: string;
  };
}

export const VideoDebugger: React.FC<VideoDebuggerProps> = ({ media }) => {
  const [showDebug, setShowDebug] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);

  // Generate all possible URLs for testing
  const testUrls = [
    {
      label: 'Original URL',
      url: media.url
    },
    {
      label: 'Video Playback URL (streaming)',
      url: getVideoPlaybackUrl(media.url, media.googleDriveFileId)
    },
    {
      label: 'Video Download URL',
      url: getVideoDownloadUrl(media.url, media.googleDriveFileId)
    },
    ...(media.googleDriveFileId ? [
      {
        label: 'Google Drive Download URL (direct)',
        url: getDriveDownloadUrl(media.googleDriveFileId)
      },
      {
        label: 'Google Drive Preview URL (iframe)',
        url: `https://drive.google.com/file/d/${media.googleDriveFileId}/preview`
      },
      {
        label: 'Google Drive View URL',
        url: `https://drive.google.com/file/d/${media.googleDriveFileId}/view`
      }
    ] : []),
    ...(extractDriveFileId(media.url) ? [
      {
        label: 'Extracted File ID Download',
        url: getDriveDownloadUrl(extractDriveFileId(media.url)!)
      }
    ] : [])
  ];

  const currentTest = testUrls[currentUrlIndex];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold mb-4">Video Debug Tool</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          <strong>File:</strong> {media.originalName || 'Unknown'}
        </p>
        <p className="text-sm text-gray-600 mb-2">
          <strong>Type:</strong> {media.mediaType || 'Unknown'}
        </p>
        <p className="text-sm text-gray-600 mb-2">
          <strong>Google Drive ID:</strong> {media.googleDriveFileId || 'Not available'}
        </p>
      </div>

      {/* URL Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test URL ({currentUrlIndex + 1} of {testUrls.length}):
        </label>
        <select
          value={currentUrlIndex}
          onChange={(e) => setCurrentUrlIndex(Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          {testUrls.map((test, index) => (
            <option key={index} value={index}>
              {test.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1 break-all">
          {currentTest.url}
        </p>
      </div>

      {/* Video Player */}
      <div className="mb-4">
        <VideoPlayer
          src={currentTest.url}
          googleDriveFileId={media.googleDriveFileId}
          className="w-full max-w-md mx-auto"
          onError={(error) => console.error('Video error:', error)}
          onLoad={() => console.log('Video loaded successfully')}
        />
      </div>

      {/* Debug Toggle */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        {showDebug ? 'Hide' : 'Show'} Debug Info
      </button>

      {/* Debug Information */}
      {showDebug && (
        <div className="bg-gray-100 p-4 rounded-md">
          <h4 className="font-semibold mb-2">Debug Information:</h4>
          <div className="space-y-2 text-sm">
            <div>
              <strong>All Test URLs:</strong>
              <ul className="mt-1 space-y-1">
                {testUrls.map((test, index) => (
                  <li key={index} className={`${index === currentUrlIndex ? 'font-bold text-blue-600' : ''}`}>
                    <span className="inline-block w-4">{index + 1}.</span>
                    <span className="font-medium">{test.label}:</span>
                    <br />
                    <span className="ml-6 text-xs break-all text-gray-600">{test.url}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-4">
              <strong>Browser Support:</strong>
              <ul className="mt-1 text-xs">
                <li>• Chrome: MP4, WebM, Ogg</li>
                <li>• Firefox: MP4, WebM, Ogg</li>
                <li>• Safari: MP4, MOV</li>
                <li>• Edge: MP4, WebM</li>
              </ul>
            </div>

            <div className="mt-4">
              <strong>Common Issues:</strong>
              <ul className="mt-1 text-xs">
                <li>• CORS: Google Drive may block cross-origin requests</li>
                <li>• Permissions: Video may require Google account access</li>
                <li>• Format: Browser may not support video codec</li>
                <li>• Size: Large videos may fail to load</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Quick Test Buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => window.open(currentTest.url, '_blank')}
          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          Open in New Tab
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(currentTest.url);
            alert('URL copied to clipboard!');
          }}
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
        >
          Copy URL
        </button>
      </div>
    </div>
  );
};

export default VideoDebugger;
