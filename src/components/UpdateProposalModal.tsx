'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UpdateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, file: File | null, customUrl?: string, content?: string) => Promise<void>;
  isUploading: boolean;
  currentTitle?: string;
  currentUrl?: string;
  proposalId?: string;
  error?: string | null;
  currentContent?: string;
}

export default function UpdateProposalModal({
  isOpen,
  onClose,
  onSubmit,
  isUploading,
  currentTitle,
  currentUrl,
  proposalId,
  error: externalError,
  currentContent,
}: UpdateProposalModalProps) {
  const [title, setTitle] = useState(currentTitle || '');
  const [file, setFile] = useState<File | null>(null);
  const [customUrl, setCustomUrl] = useState<string>(currentUrl || '');
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isUrlValid, setIsUrlValid] = useState(true);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [isUrlAvailable, setIsUrlAvailable] = useState(true);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isFileValid, setIsFileValid] = useState(true);
  const [activeTab, setActiveTab] = useState<'file' | 'code'>('file');
  const [isDragActive, setIsDragActive] = useState(false);

  // Load content when modal opens
  useEffect(() => {
    if (isOpen && currentContent) {
      setContent(currentContent);
      setActiveTab('code');
    }
  }, [isOpen, currentContent]);

  // Function to check if any field has changed
  const hasChanges = () => {
    return (
      title !== (currentTitle || '') ||
      customUrl !== (currentUrl || '') ||
      content !== (currentContent || '') ||
      file !== null
    );
  };

  // Update title, URL, and content when props change
  useEffect(() => {
    setTitle(currentTitle || '');
    setCustomUrl(currentUrl || '');
    setContent(currentContent || '');
  }, [currentTitle, currentUrl, currentContent]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTitle(currentTitle || '');
      setFile(null);
      setCustomUrl(currentUrl || '');
      setContent(currentContent || '');
      setError(null);
      setIsUrlValid(true);
      setIsUrlAvailable(true);
      setIsFileValid(true);
      setHasAttemptedSubmit(false);
      setActiveTab('file');
    }
  }, [isOpen, currentTitle, currentUrl, currentContent]);

  // Update error state when external error changes
  useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  const validateCustomUrl = (url: string): boolean => {
    if (!url) return true; // Empty URL is valid (will use default)
    // Only allow alphanumeric characters and hyphens
    const validUrlPattern = /^[a-zA-Z0-9-]+$/;
    return validUrlPattern.test(url);
  };

  const validateFile = (selectedFile: File | null): boolean => {
    if (!selectedFile) return true; // File is optional in update modal
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
        const response = await fetch(
          `/api/check-url?url=${encodeURIComponent(value)}${proposalId ? `&excludeId=${proposalId}` : ''}`
        );
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
    
    // Read file content if file is selected
    if (selectedFile && isValid) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        setContent(fileContent);
      };
      reader.readAsText(selectedFile);
    }
    
    // Only clear URL-related errors if file is valid
    if (isValid) {
      // If there's a URL error, keep it
      if (error && !error.includes('URL')) {
        setError(null);
      }
    }
  };

  // Add effect to switch to code tab when file is selected
  useEffect(() => {
    if (file) {
      setActiveTab('code');
    }
  }, [file]);

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect({ target: { files: [droppedFile] } } as any);
    }
  };

  const validateForm = (): boolean => {
    if (!file && !title.trim()) {
      setError('Please provide either a new file or a title');
      return false;
    }

    // Validate file if present
    if (file) {
      const isFileValidNow = validateFile(file);
      setIsFileValid(isFileValidNow);
      if (!isFileValidNow) {
        return false;
      }
    }

    // Validate URL if present
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
      await onSubmit(title.trim(), file || null, trimmedUrl || undefined, content);
      // Reset form
      setFile(null);
      setCustomUrl('');
      setContent('');
      setError(null);
      setIsUrlValid(true);
      setIsUrlAvailable(true);
      setIsFileValid(true);
      setHasAttemptedSubmit(false);
    } catch (err) {
      // Error is handled by parent component
    }
  };

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
              className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 mx-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Update Proposal</h2>
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
                {/* Title Input */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                    placeholder="Enter proposal title"
                  />
                </div>

                {/* URL Input */}
                <div>
                  <label htmlFor="customUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Custom URL (optional)
                  </label>
                  <input
                    type="text"
                    id="customUrl"
                    value={customUrl}
                    onChange={handleCustomUrlChange}
                    onPaste={handleCustomUrlPaste}
                    className={`w-full px-4 py-2 border ${
                      !isUrlValid || !isUrlAvailable ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-1 focus:ring-blue-300 focus:border-blue-300`}
                    placeholder="Enter custom URL"
                  />
                  {!isUrlValid && (
                    <p className="mt-1 text-sm text-red-500">
                      URL can only contain letters, numbers, and hyphens
                    </p>
                  )}
                  {!isUrlAvailable && (
                    <p className="mt-1 text-sm text-red-500">This URL is already in use</p>
                  )}
                </div>

                {/* Content Tabs */}
                <div>
                  <div className="flex space-x-4 mb-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('file')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${
                        activeTab === 'file'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('code')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${
                        activeTab === 'code'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Code
                    </button>
                  </div>

                  {activeTab === 'file' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        HTML File
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          id="proposal-file"
                          accept=".html"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor="proposal-file"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`block w-full min-h-32 px-4 py-8 border rounded-lg cursor-pointer transition-colors text-center flex items-center justify-center ${
                            hasAttemptedSubmit && !isFileValid ? 'border-red-300' : isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {file ? file.name : isDragActive ? 'Drop your HTML file here' : 'Select or drag & drop HTML file'}
                        </label>
                      </div>
                      {!isFileValid && (
                        <p className="mt-1 text-sm text-red-500">
                          Please select a valid HTML file (max 5MB)
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        HTML Content
                      </label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-300 focus:border-blue-300 font-mono text-sm"
                        placeholder="Enter HTML content"
                      />
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
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
                      (!file && !content && !title.trim()) || 
                      !isFileValid || 
                      Boolean(error) || 
                      isCheckingUrl || 
                      (customUrl !== '' && (!isUrlValid || !isUrlAvailable)) ||
                      !hasChanges()
                    }
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Updating...' : isCheckingUrl ? 'Checking URL...' : 'Update Proposal'}
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