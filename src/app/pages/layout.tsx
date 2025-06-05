import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ShoreAgents Proposal',
};

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 