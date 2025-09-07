'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Upload, Image, Video, X, CheckCircle, AlertCircle, Camera, User } from 'lucide-react';
import { albumsAPI, mediaAPI } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';

interface Album {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  mediaCount: number;
  uploadUrl: string;
}

export default function GuestUploadPage() {
  const params = useParams();
  const router = useRouter();
  const qrCode = params.qrCode as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    guestName: '',
    files: [] as File[]
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  useEffect(() => {
    if (qrCode) {
      fetchAlbumInfo();
    }
  }, [qrCode]);

  const fetchAlbumInfo = async () => {
    try {
      setLoading(true);
      const response = await albumsAPI.getByQRCode(qrCode);
      setAlbum(response.album);
    } catch (error: any) {
      console.error('Failed to fetch album:', error);
      toast.error('Album not found or no longer available');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setUploadForm({ ...uploadForm, files: filesArray });
    }
  };

  const handleUpload = async () => {
    if (!album || !uploadForm.guestName.trim() || uploadForm.files.length === 0) {
      toast.error('Please fill in your name and select files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadedFiles([]);

    try {
      const fileList = Object.assign(uploadForm.files, {
        length: uploadForm.files.length,
        item: (index: number) => uploadForm.files[index]
      }) as FileList;
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await mediaAPI.uploadByQR(qrCode, fileList, uploadForm.guestName);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (response.media && Array.isArray(response.media)) {
        const uploadedFileNames = response.media.map((media: any) => media.originalName);
        setUploadedFiles(uploadedFileNames);
        
        toast.success(`Successfully uploaded ${response.media.length} file(s)!`);
        
        // Reset form after successful upload
        setTimeout(() => {
          setUploadForm({ guestName: '', files: [] });
          setUploadProgress(0);
          setUploadedFiles([]);
        }, 3000);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload files');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadForm.files.filter((_, i) => i !== index);
    setUploadForm({ ...uploadForm, files: newFiles });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#667c93] to-[#84a2be] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading album...</p>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#667c93] to-[#84a2be] flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Album Not Found</h1>
          <p className="text-lg opacity-90">This album is no longer available for uploads.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 bg-white text-[#667c93] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Go to Wedding Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667c93] to-[#84a2be]">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Upload Photos & Videos</h1>
              <p className="text-white/80">Share your memories from the wedding</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Album Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20"
        >
          <div className="flex items-center gap-4">
            {album.coverImage ? (
              <img
                src={album.coverImage}
                alt={album.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                <Image className="text-white" size={24} />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">{album.name}</h2>
              <p className="text-white/80">{album.description}</p>
              <p className="text-white/60 text-sm mt-1">
                {album.mediaCount} {album.mediaCount === 1 ? 'photo' : 'photos'} already uploaded
              </p>
            </div>
          </div>
        </motion.div>

        {/* Upload Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Upload Your Photos & Videos</h3>
          
          <div className="space-y-6">
            {/* Guest Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={uploadForm.guestName}
                  onChange={(e) => setUploadForm({...uploadForm, guestName: e.target.value})}
                  placeholder="Enter your name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent"
                />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Photos & Videos *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#84a2be] transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="bg-[#84a2be] bg-opacity-20 rounded-full p-4">
                        <Camera className="text-[#667c93]" size={32} />
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        <span className="text-[#84a2be]">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Photos and videos up to 50MB each
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Selected Files */}
            {uploadForm.files.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Files:</h4>
                <div className="space-y-2">
                  {uploadForm.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        {file.type.startsWith('image/') ? (
                          <Image className="text-green-600" size={20} />
                        ) : (
                          <Video className="text-blue-600" size={20} />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Uploading...</span>
                  <span className="text-sm text-gray-500">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#84a2be] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Upload Success */}
            {uploadedFiles.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="text-green-600" size={20} />
                  <h4 className="text-sm font-medium text-green-800">Upload Successful!</h4>
                </div>
                <p className="text-sm text-green-700">
                  Successfully uploaded {uploadedFiles.length} file(s):
                </p>
                <ul className="text-sm text-green-600 mt-1">
                  {uploadedFiles.map((fileName, index) => (
                    <li key={index}>• {fileName}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || !uploadForm.guestName.trim() || uploadForm.files.length === 0}
              className="w-full bg-gradient-to-r from-[#667c93] to-[#84a2be] text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Upload {uploadForm.files.length} {uploadForm.files.length === 1 ? 'File' : 'Files'}
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mt-8 border border-white/20"
        >
          <h3 className="text-lg font-bold text-white mb-4">Upload Guidelines</h3>
          <ul className="space-y-2 text-white/80">
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-400 mt-0.5" size={16} />
              <span>Upload photos and videos from the wedding celebration</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-400 mt-0.5" size={16} />
              <span>Supported formats: JPG, PNG, GIF, MP4, MOV</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-400 mt-0.5" size={16} />
              <span>Maximum file size: 50MB per file</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-400 mt-0.5" size={16} />
              <span>All uploads will be reviewed before being added to the album</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
