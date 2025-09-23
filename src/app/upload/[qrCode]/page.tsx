'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Upload, Image, Video, X, CheckCircle, AlertCircle, Camera, User } from 'lucide-react';
import { albumsAPI, mediaAPI } from '@/lib/api';
import { useAlbumByQR } from '@/hooks/useFirebaseRealtime';
import toast, { Toaster } from 'react-hot-toast';
import { validateFiles, validateGuestName, FILE_VALIDATION_CONSTANTS, ValidationResult } from '@/lib/validation';
import ValidationFeedback, { FieldValidation, FileValidationPreview } from '@/components/ValidationFeedback';

interface Album {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isFeatured: boolean;
  coverImage?: string;
  qrCode: string;
  createdAt: any;
  updatedAt: any;
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
  const [validationState, setValidationState] = useState<{
    guestName: ValidationResult;
    files: ValidationResult;
  }>({
    guestName: { isValid: true, errors: [] },
    files: { isValid: true, errors: [], warnings: [] }
  });
  const [showValidation, setShowValidation] = useState(false);

  // Firebase real-time album data
  const firebaseAlbum = useAlbumByQR(qrCode);

  useEffect(() => {
    if (firebaseAlbum.album) {
      setAlbum(firebaseAlbum.album);
      setLoading(false);
    }
  }, [firebaseAlbum.album]);

  useEffect(() => {
    if (firebaseAlbum.error) {
      toast.error('Album not found or no longer available');
      router.push('/');
    }
  }, [firebaseAlbum.error, router]);

  // Update loading state based on Firebase data
  useEffect(() => {
    setLoading(firebaseAlbum.loading);
  }, [firebaseAlbum.loading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Validate files immediately
      const fileValidation = validateFiles(filesArray, {
        maxFiles: FILE_VALIDATION_CONSTANTS.MAX_GUEST_PHOTOS,
        maxFileSize: FILE_VALIDATION_CONSTANTS.MAX_FILE_SIZE,
        allowedTypes: [...FILE_VALIDATION_CONSTANTS.ALLOWED_IMAGE_TYPES, ...FILE_VALIDATION_CONSTANTS.ALLOWED_VIDEO_TYPES]
      });
      
      setValidationState(prev => ({
        ...prev,
        files: fileValidation
      }));
      
      setUploadForm({ ...uploadForm, files: filesArray });
      
      // Show validation feedback
      setShowValidation(true);
      
      // Show toast for immediate feedback
      if (!fileValidation.isValid) {
        toast.error(`Please fix file selection issues before uploading.`);
      } else if (fileValidation.warnings && fileValidation.warnings.length > 0) {
        toast(`${filesArray.length} files selected. Check warnings below.`, {
          icon: '⚠️',
          duration: 4000,
        });
      } else {
        toast.success(`${filesArray.length} files selected and ready to upload!`);
      }
    }
  };

  const validateForm = () => {
    const nameValidation = validateGuestName(uploadForm.guestName);
    const fileValidation = validateFiles(uploadForm.files, {
      maxFiles: FILE_VALIDATION_CONSTANTS.MAX_GUEST_PHOTOS,
      maxFileSize: FILE_VALIDATION_CONSTANTS.MAX_FILE_SIZE,
      allowedTypes: [...FILE_VALIDATION_CONSTANTS.ALLOWED_IMAGE_TYPES, ...FILE_VALIDATION_CONSTANTS.ALLOWED_VIDEO_TYPES]
    });
    
    setValidationState({
      guestName: nameValidation,
      files: fileValidation
    });
    
    setShowValidation(true);
    
    return nameValidation.isValid && fileValidation.isValid;
  };

  const handleUpload = async () => {
    if (!album) {
      toast.error('Album information is not available');
      return;
    }
    
    // Validate form before upload
    if (!validateForm()) {
      toast.error('Please fix the validation errors before uploading');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadedFiles([]);

    try {
      const uploadedMedia: any[] = [];
      const totalFiles = uploadForm.files.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = uploadForm.files[i];

        // Create a single-file FileList for the current file
        const dt = new DataTransfer();
        dt.items.add(file);
        const singleFileList = dt.files;

        // Update progress before each upload attempt
        const progress = Math.round(((i + 1) / totalFiles) * 100);
        setUploadProgress(progress);

        try {
          const response = await mediaAPI.uploadByQR(qrCode, singleFileList, uploadForm.guestName);
          if (response?.media) {
            if (Array.isArray(response.media)) {
              uploadedMedia.push(...response.media);
            } else {
              uploadedMedia.push(response.media);
            }
          }
        } catch (fileError: any) {
          console.error(`Error uploading file ${file.name}:`, fileError);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      setUploadProgress(100);

      if (uploadedMedia.length > 0) {
        const uploadedFileNames = uploadedMedia.map((m: any) => m.originalName || m.filename || 'File');
        setUploadedFiles(uploadedFileNames);

        toast.success(`Successfully uploaded ${uploadedMedia.length} file(s)!`);

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
    
    // Re-validate files after removal
    if (newFiles.length > 0) {
      const fileValidation = validateFiles(newFiles, {
        maxFiles: FILE_VALIDATION_CONSTANTS.MAX_GUEST_PHOTOS,
        maxFileSize: FILE_VALIDATION_CONSTANTS.MAX_FILE_SIZE,
        allowedTypes: [...FILE_VALIDATION_CONSTANTS.ALLOWED_IMAGE_TYPES, ...FILE_VALIDATION_CONSTANTS.ALLOWED_VIDEO_TYPES]
      });
      
      setValidationState(prev => ({
        ...prev,
        files: fileValidation
      }));
    } else {
      setValidationState(prev => ({
        ...prev,
        files: { isValid: true, errors: [], warnings: [] }
      }));
      setShowValidation(false);
    }
  };
  
  const handleGuestNameChange = (value: string) => {
    setUploadForm({ ...uploadForm, guestName: value });
    
    // Real-time validation for guest name
    if (showValidation) {
      const nameValidation = validateGuestName(value);
      setValidationState(prev => ({
        ...prev,
        guestName: nameValidation
      }));
    }
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
                Photos already uploaded
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
                  onChange={(e) => handleGuestNameChange(e.target.value)}
                  placeholder="Enter your name"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent transition-colors ${
                    showValidation && !validationState.guestName.isValid
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
              </div>
              {showValidation && (
                <FieldValidation
                  error={validationState.guestName.errors[0]}
                />
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Photos & Videos * (Max {FILE_VALIDATION_CONSTANTS.MAX_GUEST_PHOTOS} files)
              </label>
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                showValidation && !validationState.files.isValid
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-[#84a2be]'
              }`}>
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
                        Photos and videos up to {Math.round(FILE_VALIDATION_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024))}MB each
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Supported: JPG, PNG, GIF, WebP, MP4, MOV, AVI, WMV, WebM
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* File Validation and Preview */}
            {uploadForm.files.length > 0 && (
              <FileValidationPreview
                files={uploadForm.files}
                validationResult={validationState.files}
                onRemoveFile={removeFile}
                maxFiles={FILE_VALIDATION_CONSTANTS.MAX_GUEST_PHOTOS}
              />
            )}
            
            {/* Overall validation feedback */}
            {showValidation && (uploadForm.files.length > 0 || uploadForm.guestName.trim()) && (
              <ValidationFeedback
                errors={[
                  ...validationState.guestName.errors.map(err => `Name: ${err}`),
                  ...validationState.files.errors
                ]}
                warnings={validationState.files.warnings}
              />
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
              disabled={uploading || !uploadForm.guestName.trim() || uploadForm.files.length === 0 || (showValidation && (!validationState.guestName.isValid || !validationState.files.isValid))}
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
              <span>Supported formats: JPG, PNG, GIF, MP4, MOV, JPEG</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-400 mt-0.5" size={16} />
              <span>Maximum {FILE_VALIDATION_CONSTANTS.MAX_GUEST_PHOTOS} files per upload, {Math.round(FILE_VALIDATION_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024))}MB per file</span>
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
