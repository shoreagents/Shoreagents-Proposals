'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File, customUrl?: string) => Promise<void>;
  isUploading: boolean;
  error?: string | null;
}

export default function NewProposalModal({
  isOpen,
  onClose,
  onSubmit,
  isUploading,
  error: externalError,
}: NewProposalModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isUrlValid, setIsUrlValid] = useState(true);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [isUrlAvailable, setIsUrlAvailable] = useState(true);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Add validation state for file
  const [isFileValid, setIsFileValid] = useState(true);

  const validateCustomUrl = (url: string): boolean => {
    if (!url) return true; // Empty URL is valid (will use default)
    // Only allow alphanumeric characters and hyphens
    const validUrlPattern = /^[a-zA-Z0-9-]+$/;
    return validUrlPattern.test(url);
  };

  const validateFile = (selectedFile: File | null): boolean => {
    if (!selectedFile) return false;
    if (selectedFile.type !== 'text/html' && !selectedFile.name.endsWith('.html')) {
      setError('Only HTML files are allowed');
      return false;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return false;
    }
    return true;
  };

  const checkUrlAvailability = async (url: string) => {
    if (!url || !validateCustomUrl(url)) return;
    
    setIsCheckingUrl(true);
    try {
      const response = await fetch(`/api/check-url?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      setIsUrlAvailable(data.available);
      if (!data.available) {
        setError('This custom URL is already in use');
      } else if (isUrlValid) {
        setError(null);
      }
    } catch (err) {
      console.error('Error checking URL:', err);
      setError('Failed to check URL availability');
    } finally {
      setIsCheckingUrl(false);
    }
  };

  const validateAndUpdateUrl = (value: string) => {
    setCustomUrl(value);
    const isValid = validateCustomUrl(value);
    setIsUrlValid(isValid);
    
    // Clear any existing URL-related errors
    if (!value) {
      setError(null);
      setIsUrlAvailable(true);
      return;
    }

    // Immediate format validation
    if (!isValid) {
      setError('Custom URL can only contain letters, numbers, and hyphens');
      setIsUrlAvailable(true);
      return;
    }

    // Clear format error if URL is valid
    if (error === 'Custom URL can only contain letters, numbers, and hyphens') {
      setError(null);
    }
    
    // Set checking state immediately
    setIsCheckingUrl(true);
    
    // Debounce the URL check
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/check-url?url=${encodeURIComponent(value)}`);
        const data = await response.json();
        setIsUrlAvailable(data.available);
        if (!data.available) {
          setError('This custom URL is already in use');
        } else if (isValid) {
          // Only clear error if URL is still valid
          setError(null);
        }
      } catch (err) {
        console.error('Error checking URL:', err);
        setError('Failed to check URL availability');
      } finally {
        setIsCheckingUrl(false);
      }
    }, 300); // Reduced debounce time to 300ms
    return () => clearTimeout(timeoutId);
  };

  const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndUpdateUrl(e.target.value);
  };

  const handleCustomUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedValue = e.clipboardData.getData('text');
    validateAndUpdateUrl(pastedValue);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    const isValid = validateFile(selectedFile);
    setIsFileValid(isValid);
    setFile(selectedFile);
    
    // Only clear URL-related errors if file is valid
    if (isValid) {
      // If there's a URL error, keep it
      if (error && !error.includes('URL')) {
        setError(null);
      }
    }
  };

  const validateForm = (): boolean => {
    // Validate file first
    const isFileValidNow = validateFile(file);
    setIsFileValid(isFileValidNow);
    
    if (!isFileValidNow) {
      setError('Please select a valid HTML file');
      return false;
    }

    // Then validate URL if it's not empty
    if (customUrl) {
      const isUrlValidNow = validateCustomUrl(customUrl);
      setIsUrlValid(isUrlValidNow);

      if (!isUrlValidNow) {
        setError('Invalid custom URL format');
        return false;
      }

      if (!isUrlAvailable) {
        setError('This custom URL is already in use');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!validateForm()) {
      return;
    }

    try {
      const trimmedUrl = customUrl.trim();
      await onSubmit(file!, trimmedUrl || undefined);
      // Reset form
      setFile(null);
      setCustomUrl('');
      setError(null);
      setIsUrlValid(true);
      setIsUrlAvailable(true);
      setIsFileValid(true);
      setHasAttemptedSubmit(false);
    } catch (err) {
      // Error is handled by parent component
    }
  };

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setCustomUrl('');
      setError(null);
      setIsUrlValid(true);
      setIsUrlAvailable(true);
      setIsFileValid(true);
      setHasAttemptedSubmit(false);
    }
  }, [isOpen]);

  // Add effect to validate URL when it changes
  useEffect(() => {
    if (customUrl) {
      validateAndUpdateUrl(customUrl);
    }
  }, [customUrl]);

  // Update error state when external error changes
  useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 mx-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">New Proposal</h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="proposal-file"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    HTML File
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="proposal-file"
                      accept=".html"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="proposal-file"
                      className={`block w-full px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-center ${
                        hasAttemptedSubmit && !isFileValid ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      {file ? file.name : 'Select HTML file'}
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Maximum file size: 5MB
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="custom-url"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Custom URL (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="custom-url"
                      value={customUrl}
                      onChange={handleCustomUrlChange}
                      onPaste={handleCustomUrlPaste}
                      placeholder="Enter custom URL"
                      autoComplete="off"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        (!isUrlValid || (customUrl !== '' && !isUrlAvailable)) ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isUploading}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Only letters, numbers, and hyphens allowed. Leave empty for auto-generated URL.
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm text-center flex items-center justify-center">
                      <span className="mr-2">⚠️</span>
                      {error}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isUploading}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isUploading || 
                      !file || 
                      !isFileValid || 
                      Boolean(error) || 
                      isCheckingUrl || 
                      (customUrl !== '' && (!isUrlValid || !isUrlAvailable))
                    }
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : isCheckingUrl ? 'Checking URL...' : 'Create Proposal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
} 