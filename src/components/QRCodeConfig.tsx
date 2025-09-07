'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Type, 
  Settings,
  Palette,
  Download,
  Eye
} from 'lucide-react';
import { qrAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface QRCodeConfigProps {
  onConfigChange: (config: QRConfig) => void;
  initialConfig?: QRConfig;
  showPreview?: boolean;
}

interface QRConfig {
  centerType: 'none' | 'logo' | 'monogram';
  centerOptions: {
    logoPath?: string;
    monogram: string;
    fontSize: number;
    fontFamily: string;
    textColor: string;
    backgroundColor: string;
    logoSize: number;
    logoMargin: number;
  };
  size: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
}

interface Logo {
  filename: string;
  url: string;
  name: string;
}

export default function QRCodeConfig({ 
  onConfigChange, 
  initialConfig,
  showPreview = true 
}: QRCodeConfigProps) {
  const [config, setConfig] = useState<QRConfig>(initialConfig || {
    centerType: 'monogram',
    centerOptions: {
      monogram: 'M&E',
      fontSize: 40,
      fontFamily: 'Arial',
      textColor: '#000000',
      backgroundColor: '#ffffff',
      logoSize: 60,
      logoMargin: 10
    },
    size: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [qrOptions, setQrOptions] = useState<any>(null);

  useEffect(() => {
    loadLogos();
    loadQROptions();
  }, []);

  useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);

  const loadLogos = async () => {
    try {
      const response = await qrAPI.getLogos();
      setLogos(response.logos || []);
    } catch (error) {
      console.error('Failed to load logos:', error);
    }
  };

  const loadQROptions = async () => {
    try {
      const response = await qrAPI.getOptions();
      setQrOptions(response);
    } catch (error) {
      console.error('Failed to load QR options:', error);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const response = await qrAPI.uploadLogo(file);
      const newLogo = {
        filename: response.filename,
        url: response.logoUrl,
        name: response.originalName
      };
      setLogos(prev => [...prev, newLogo]);
      // Auto-select the newly uploaded logo
      updateCenterOptions({ logoPath: response.logoUrl });
      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async (filename: string) => {
    try {
      await qrAPI.deleteLogo(filename);
      setLogos(prev => prev.filter(logo => logo.filename !== filename));
      toast.success('Logo deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete logo');
    }
  };

  const generatePreview = async () => {
    if (!showPreview) return;
    
    setLoading(true);
    try {
      const testUrl = 'https://example.com/test';
      const response = await qrAPI.generate(
        testUrl, 
        config.size, 
        config.margin, 
        config.centerType, 
        config.centerOptions
      );
      setPreviewUrl(response.qrCode);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (updates: Partial<QRConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateCenterOptions = (updates: Partial<QRConfig['centerOptions']>) => {
    setConfig(prev => ({
      ...prev,
      centerOptions: { ...prev.centerOptions, ...updates }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Center Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          QR Code Center Content
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'none', label: 'None', icon: Settings },
            { value: 'logo', label: 'Logo', icon: ImageIcon },
            { value: 'monogram', label: 'Monogram', icon: Type }
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => updateConfig({ centerType: value as any })}
              className={`p-3 rounded-lg border-2 transition-all ${
                config.centerType === value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className="w-6 h-6 mx-auto mb-1" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logo Configuration */}
      {config.centerType === 'logo' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Logo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Click to upload logo'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF up to 5MB
                </span>
              </label>
            </div>
          </div>

          {/* Available Logos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Logo
            </label>
            {logos.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {logos.map((logo) => {
                  const isSelected = config.centerOptions.logoPath === logo.url;
                  
                  return (
                    <div
                      key={logo.filename}
                      className={`relative group cursor-pointer rounded-lg border-2 p-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                      onClick={() => {
                        updateCenterOptions({ logoPath: logo.url });
                      }}
                    >
                      <img
                        src={`/api/proxy-image?url=${encodeURIComponent(`https://backendv2-nasy.onrender.com${logo.url}`)}`}
                        alt={logo.name}
                        className="w-full h-16 object-contain"
                        onError={(e) => {
                          console.error('Failed to load logo image:', logo.url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLogo(logo.filename);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No logos uploaded yet</p>
                <p className="text-xs text-gray-400 mt-1">Upload a logo above to get started</p>
              </div>
            )}
          </div>

          {/* Logo Size Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo Size
              </label>
              <input
                type="range"
                min="20"
                max="100"
                value={config.centerOptions.logoSize}
                onChange={(e) => updateCenterOptions({ logoSize: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">
                {config.centerOptions.logoSize}px
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo Margin
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={config.centerOptions.logoMargin}
                onChange={(e) => updateCenterOptions({ logoMargin: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">
                {config.centerOptions.logoMargin}px
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monogram Configuration */}
      {config.centerType === 'monogram' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monogram Text
            </label>
            <input
              type="text"
              value={config.centerOptions.monogram}
              onChange={(e) => updateCenterOptions({ monogram: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter monogram (e.g., M&E)"
              maxLength={10}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Size
              </label>
              <select
                value={config.centerOptions.fontSize}
                onChange={(e) => updateCenterOptions({ fontSize: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {qrOptions?.monogramOptions?.fontSizes?.map((size: number) => (
                  <option key={size} value={size}>{size}px</option>
                )) || [20, 30, 40, 50, 60].map(size => (
                  <option key={size} value={size}>{size}px</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Family
              </label>
              <select
                value={config.centerOptions.fontFamily}
                onChange={(e) => updateCenterOptions({ fontFamily: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {qrOptions?.monogramOptions?.fontFamilies?.map((font: string) => (
                  <option key={font} value={font}>{font}</option>
                )) || ['Arial', 'Helvetica', 'Times New Roman', 'Georgia'].map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Color
              </label>
              <input
                type="color"
                value={config.centerOptions.textColor}
                onChange={(e) => updateCenterOptions({ textColor: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Color
              </label>
              <input
                type="color"
                value={config.centerOptions.backgroundColor}
                onChange={(e) => updateCenterOptions({ backgroundColor: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* QR Code Size and Colors */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            QR Code Size
          </label>
          <select
            value={config.size}
            onChange={(e) => updateConfig({ size: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {qrOptions?.sizes?.map((size: number) => (
              <option key={size} value={size}>{size}px</option>
            )) || [200, 300, 400, 500, 600].map(size => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dark Color
            </label>
            <input
              type="color"
              value={config.color.dark}
              onChange={(e) => updateConfig({ 
                color: { ...config.color, dark: e.target.value }
              })}
              className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Light Color
            </label>
            <input
              type="color"
              value={config.color.light}
              onChange={(e) => updateConfig({ 
                color: { ...config.color, light: e.target.value }
              })}
              className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs">
          <h4 className="font-medium mb-2">Debug Info:</h4>
          <div className="space-y-1">
            <p>Center Type: {config.centerType}</p>
            <p>Logo Path: {config.centerOptions.logoPath || 'None'}</p>
            <p>Monogram: {config.centerOptions.monogram}</p>
            <p>Available Logos: {logos.length}</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {showPreview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Preview</h3>
            <button
              onClick={generatePreview}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              {loading ? 'Generating...' : 'Generate Preview'}
            </button>
          </div>
          
          {previewUrl && (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <img
                src={previewUrl}
                alt="QR Code Preview"
                className="mx-auto max-w-full h-auto"
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
