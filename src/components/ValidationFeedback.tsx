import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface ValidationFeedbackProps {
  errors?: string[];
  warnings?: string[];
  success?: string[];
  className?: string;
  showIcons?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export default function ValidationFeedback({
  errors = [],
  warnings = [],
  success = [],
  className = '',
  showIcons = true,
  dismissible = false,
  onDismiss
}: ValidationFeedbackProps) {
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const hasSuccess = success.length > 0;
  
  if (!hasErrors && !hasWarnings && !hasSuccess) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className={`space-y-2 ${className}`}
      >
        {/* Error Messages */}
        {hasErrors && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                {showIcons && (
                  <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={16} />
                )}
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800 mb-1">
                    {errors.length === 1 ? 'Error' : 'Errors'}
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-red-500 mt-1">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {dismissible && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Warning Messages */}
        {hasWarnings && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-amber-50 border border-amber-200 rounded-lg p-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                {showIcons && (
                  <AlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={16} />
                )}
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-800 mb-1">
                    {warnings.length === 1 ? 'Warning' : 'Warnings'}
                  </h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-amber-500 mt-1">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {dismissible && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-amber-400 hover:text-amber-600 ml-2 flex-shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Success Messages */}
        {hasSuccess && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-green-50 border border-green-200 rounded-lg p-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                {showIcons && (
                  <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                )}
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-800 mb-1">Success</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    {success.map((message, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {dismissible && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-green-400 hover:text-green-600 ml-2 flex-shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Individual field validation component
interface FieldValidationProps {
  error?: string;
  warning?: string;
  success?: string;
  className?: string;
}

export function FieldValidation({ error, warning, success, className = '' }: FieldValidationProps) {
  if (!error && !warning && !success) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.15 }}
        className={`mt-1 ${className}`}
      >
        {error && (
          <div className="flex items-center gap-1 text-red-600">
            <AlertCircle size={14} />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {warning && !error && (
          <div className="flex items-center gap-1 text-amber-600">
            <AlertTriangle size={14} />
            <span className="text-sm">{warning}</span>
          </div>
        )}
        {success && !error && !warning && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle size={14} />
            <span className="text-sm">{success}</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// File validation preview component
interface FileValidationPreviewProps {
  files: File[];
  validationResult: {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
  };
  onRemoveFile?: (index: number) => void;
  maxFiles?: number;
}

export function FileValidationPreview({
  files,
  validationResult,
  onRemoveFile,
  maxFiles = 20
}: FileValidationPreviewProps) {
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return '🖼️';
    } else if (file.type.startsWith('video/')) {
      return '🎥';
    }
    return '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      {/* File count indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">
          Selected files: {files.length} / {maxFiles}
        </span>
        {files.length > maxFiles && (
          <span className="text-red-600 font-medium">
            Too many files selected
          </span>
        )}
      </div>

      {/* Validation feedback */}
      <ValidationFeedback
        errors={validationResult.errors}
        warnings={validationResult.warnings}
      />

      {/* File list */}
      {files.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
          {files.map((file, index) => (
            <motion.div
              key={`${file.name}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center justify-between p-2 bg-white rounded-lg border ${
                index >= maxFiles ? 'border-red-200 bg-red-50' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-lg">{getFileIcon(file)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              {onRemoveFile && (
                <button
                  onClick={() => onRemoveFile(index)}
                  className="text-red-500 hover:text-red-700 p-1 rounded"
                  title="Remove file"
                >
                  <X size={16} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
