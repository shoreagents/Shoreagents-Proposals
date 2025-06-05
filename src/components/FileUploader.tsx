'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploaderProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export default function FileUploader({ onUpload, isUploading }: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (file.type !== 'text/html' && !file.name.endsWith('.html')) {
      setError('Please upload an HTML file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size must be less than 5MB');
      return;
    }

    onUpload(file);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/html': ['.html'],
    },
    maxFiles: 1,
    disabled: isUploading,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  return (
    <div className="w-full">
      <motion.div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        whileHover={!isUploading ? { scale: 1.01 } : {}}
        whileTap={!isUploading ? { scale: 0.99 } : {}}
      >
        <input {...getInputProps()} />
        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-gray-600"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg font-medium">Uploading...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait while we process your file</p>
            </motion.div>
          ) : isDragActive ? (
            <motion.div
              key="dragging"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-blue-500"
            >
              <div className="text-4xl mb-4">📄</div>
              <p className="text-xl font-medium">Drop your HTML file here</p>
              <p className="text-sm text-blue-400 mt-2">Release to upload</p>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-4xl mb-4">📁</div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drag and drop your HTML file here
              </p>
              <p className="text-sm text-gray-500">or click to browse files</p>
              <div className="mt-4 text-xs text-gray-400">
                <p>Supported format: .html</p>
                <p>Maximum size: 5MB</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-600 text-sm text-center flex items-center justify-center">
              <span className="mr-2">⚠️</span>
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 