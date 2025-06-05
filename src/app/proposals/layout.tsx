import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ShoreAgents Proposals',
  description: 'Manage and update your HTML proposals',
};

export default function ProposalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 