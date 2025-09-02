import React, { useState, useEffect } from 'react';
import { getPerformanceSummary, exportPerformanceReport, resetPerformanceMetrics } from '@/lib/performance';
import { BarChart3, Download, RotateCcw } from 'lucide-react';

export const PerformanceMonitor: React.FC = () => {
  const [summary, setSummary] = useState(getPerformanceSummary());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSummary(getPerformanceSummary());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    const report = exportPerformanceReport();
    console.log('Performance Report:', report);
    
    // Download as file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    resetPerformanceMetrics();
    setSummary(getPerformanceSummary());
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
        title="Show Performance Monitor"
      >
        <BarChart3 size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 size={16} />
          Performance Monitor
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-blue-50 p-2 rounded">
            <div className="text-blue-600 font-semibold">{summary.totalImages}</div>
            <div className="text-blue-500">Total Images</div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="text-green-600 font-semibold">{summary.successRate}</div>
            <div className="text-green-500">Success Rate</div>
          </div>
          <div className="bg-purple-50 p-2 rounded">
            <div className="text-purple-600 font-semibold">{summary.averageLoadTime}</div>
            <div className="text-purple-500">Avg Load Time</div>
          </div>
          <div className="bg-orange-50 p-2 rounded">
            <div className="text-orange-600 font-semibold">{summary.bandwidthUsed}</div>
            <div className="text-orange-500">Bandwidth</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 bg-blue-500 text-white text-xs py-2 px-3 rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
          >
            <Download size={12} />
            Export
          </button>
          <button
            onClick={handleReset}
            className="flex-1 bg-gray-500 text-white text-xs py-2 px-3 rounded hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
