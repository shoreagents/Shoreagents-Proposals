import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { proposalsApi } from '@/lib/supabase';

// Loading component
function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading proposal...</p>
        </div>
      </div>
    </div>
  );
}

// Error component
function ErrorState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="text-red-500 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-gray-600 mb-6">Failed to load the proposal content</p>
          <a
            href="/proposals"
            className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Proposals
          </a>
        </div>
      </div>
    </div>
  );
}

// Server component to fetch and render content
async function ProposalContent({ url }: { url: string }) {
  if (!url) {
    notFound();
  }

  const proposal = await proposalsApi.getByUrl(url);
  
  if (!proposal) {
    notFound();
  }

  if (!proposal.content) {
    return <ErrorState />;
  }

  return (
    <iframe
      srcDoc={proposal.content}
      className="w-full h-screen"
      title={proposal.title || 'Proposal Preview'}
    />
  );
}

// Main page component
export default function DynamicPage({ params }: { params: { url: string } }) {
  if (!params?.url) {
    notFound();
  }

  return (
    <Suspense fallback={<LoadingState />}>
      <ProposalContent url={params.url} />
    </Suspense>
  );
}

// Add metadata for better SEO and caching
export async function generateMetadata({ params }: { params: { url: string } }) {
  if (!params?.url) {
    return {
      title: 'Proposal Not Found',
    };
  }

  try {
    const proposal = await proposalsApi.getByUrl(params.url);
    if (!proposal) {
      return {
        title: 'Proposal Not Found',
      };
    }
    return {
      title: proposal.title || 'Proposal Preview',
      description: 'View proposal details',
    };
  } catch {
    return {
      title: 'Proposal Preview',
    };
  }
}

// Add caching headers
export const revalidate = 3600; // Revalidate every hour 