'use client';

import { useState } from 'react';
import VideoDebugger from '@/components/VideoDebugger';
import { VideoPlayer } from '@/components/VideoPlayer';

export default function VideoTestPage() {
  const [testUrl, setTestUrl] = useState('');
  const [fileId, setFileId] = useState('');

  // Sample test media object
  const testMedia = {
    url: testUrl || 'https://drive.google.com/file/d/1CCCfrxwuICfiR1eEnMbWN-5rzxuL6lH7/view',
    googleDriveFileId: fileId || '1CCCfrxwuICfiR1eEnMbWN-5rzxuL6lH7',
    originalName: 'test-video.mp4',
    mediaType: 'video' as const
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Video Playback Test Tool
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Your Video URLs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video URL:
              </label>
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Drive File ID (optional):
              </label>
              <input
                type="text"
                value={fileId}
                onChange={(e) => setFileId(e.target.value)}
                placeholder="1CCCfrxwuICfiR1eEnMbWN-5rzxuL6lH7"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Paste your Google Drive video URL above</li>
              <li>Optionally extract and paste just the file ID</li>
              <li>The tool will test different URL formats automatically</li>
              <li>Check browser console for detailed error messages</li>
            </ul>
          </div>
        </div>

        {/* Video Debugger */}
        <div className="mb-8">
          <VideoDebugger media={testMedia} />
        </div>

        {/* Simple Video Player Test */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Video Player Component Test</h2>
          <VideoPlayer
            src={testMedia.url}
            googleDriveFileId={testMedia.googleDriveFileId}
            className="w-full max-w-2xl mx-auto"
          />
        </div>

        {/* Common Issues & Solutions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">
            Common Video Issues & Solutions
          </h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-yellow-700">Video won't load:</h3>
              <ul className="list-disc list-inside text-yellow-600 ml-4">
                <li>Check if the Google Drive file is publicly accessible</li>
                <li>Ensure sharing is set to "Anyone with the link can view"</li>
                <li>Try the direct download URL format</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-yellow-700">CORS errors:</h3>
              <ul className="list-disc list-inside text-yellow-600 ml-4">
                <li>Google Drive blocks direct embedding for security</li>
                <li>Use download URLs instead of view URLs</li>
                <li>Consider uploading videos to a CDN instead</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-yellow-700">Format not supported:</h3>
              <ul className="list-disc list-inside text-yellow-600 ml-4">
                <li>Ensure video is in MP4, WebM, or MOV format</li>
                <li>Check video codec compatibility (H.264 recommended)</li>
                <li>Consider converting large videos to smaller sizes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
