import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">Proposal Not Found</h1>
          <p className="text-gray-600 mb-6">
            The proposal you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/proposals"
            className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Proposals
          </Link>
        </div>
      </div>
    </div>
  );
} 