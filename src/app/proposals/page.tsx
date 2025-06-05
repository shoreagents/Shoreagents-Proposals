'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import NewProposalModal from '@/components/NewProposalModal';
import UpdateProposalModal from '@/components/UpdateProposalModal';
import { Proposal } from '@/lib/supabase';

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [isNewProposalModalOpen, setIsNewProposalModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await fetch('/api/proposals');
      if (!response.ok) throw new Error('Failed to fetch proposals');
      const data = await response.json();
      setProposals(data);
    } catch (err) {
      setError('Failed to load proposals');
      console.error('Error fetching proposals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewProposal = async (file: File, customUrl?: string) => {
    setUploadingId('new');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    if (customUrl) {
      formData.append('customUrl', customUrl);
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Refresh the proposals list
      await fetchProposals();
      setIsNewProposalModalOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload proposal');
      // Don't close the modal on error
    } finally {
      setUploadingId(null);
    }
  };

  const handleUpdate = async (title: string, file: File | null, customUrl?: string) => {
    if (!selectedProposal) return;

    setUploadingId(selectedProposal.id);
    setError(null);

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    formData.append('title', title);
    formData.append('proposalId', selectedProposal.id);
    if (customUrl) {
      formData.append('customUrl', customUrl);
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Refresh the proposals list
      await fetchProposals();
      setIsUpdateModalOpen(false);
      setSelectedProposal(null);
    } catch (error) {
      console.error('Update error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update proposal');
      // Don't close the modal on error
    } finally {
      setUploadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/proposals?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete proposal');
      }

      // Refresh the proposals list
      await fetchProposals();
    } catch (error) {
      console.error('Delete error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete proposal');
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-4">
            Proposals
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage and update your HTML proposals
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Your Proposals</h2>
              <button
                onClick={() => setIsNewProposalModalOpen(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {proposals.length === 0 ? 'Upload Your First Proposal' : 'New Proposal'}
              </button>
            </div>

            <div className="grid gap-6">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-white rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-200"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {proposal.title}
                    </h3>
                    <div className="text-sm text-gray-500">
                      Last modified: {new Date(proposal.updated_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                    <a
                      href={`/${proposal.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </a>
                    <button
                      onClick={() => {
                        setSelectedProposal(proposal);
                        setIsUpdateModalOpen(true);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Update
                    </button>
                    {showDeleteConfirm === proposal.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(proposal.id)}
                          disabled={deletingId === proposal.id}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {deletingId === proposal.id ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(proposal.id)}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {proposals.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No proposals found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <NewProposalModal
        isOpen={isNewProposalModalOpen}
        onClose={() => {
          setIsNewProposalModalOpen(false);
          setError(null); // Clear error when modal closes
        }}
        onSubmit={handleNewProposal}
        isUploading={uploadingId === 'new'}
        error={error} // Pass error to modal
      />

      {selectedProposal && (
        <UpdateProposalModal
          isOpen={isUpdateModalOpen}
          onClose={() => {
            setIsUpdateModalOpen(false);
            setSelectedProposal(null);
            setError(null); // Clear error when modal closes
          }}
          onSubmit={handleUpdate}
          isUploading={uploadingId === selectedProposal.id}
          currentTitle={selectedProposal.title}
          currentUrl={selectedProposal.url}
          proposalId={selectedProposal.id}
          error={error} // Pass error to modal
        />
      )}
    </main>
  );
} 