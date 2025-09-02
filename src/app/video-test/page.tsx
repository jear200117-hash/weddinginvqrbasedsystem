'use client';

import React, { useState } from 'react';

export default function VideoTestPage() {
  const [testVideoUrl, setTestVideoUrl] = useState('https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4');

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">Video Display Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Video URL</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={testVideoUrl}
              onChange={(e) => setTestVideoUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter video URL to test"
            />
            <button
              onClick={() => setTestVideoUrl('https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting Tips</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Check browser console for video loading errors</li>
            <li>• Ensure video URLs are accessible and CORS-enabled</li>
            <li>• Try different video formats (MP4, WebM, OGV)</li>
            <li>• Check if videos are properly uploaded to your backend</li>
            <li>• Verify video file permissions and storage</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
