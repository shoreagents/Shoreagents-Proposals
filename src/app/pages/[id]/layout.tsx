import { Metadata } from 'next';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { notFound } from 'next/navigation';

const uploadsDir = join(process.cwd(), 'uploads');

async function getMetadata(id: string): Promise<{ title: string; description?: string }> {
  try {
    // First try to read from HTML file
    const htmlPath = join(uploadsDir, `${id}.html`);
    const htmlContent = await readFile(htmlPath, 'utf-8');
    const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      console.log('Found title in HTML:', title);
      return { title };
    }

    // Fall back to metadata file
    const metadataPath = join(uploadsDir, `${id}.json`);
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    console.log('Using title from metadata:', metadata.title);
    
    return {
      title: metadata.title || 'Proposal',
      description: metadata.description
    };
  } catch (error) {
    console.error(`Error reading metadata for ${id}:`, error);
    return {
      title: 'Proposal'
    };
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const metadata = await getMetadata(params.id);
    console.log('Generated metadata for page:', metadata);
    
    return {
      title: metadata.title,
      description: metadata.description,
      viewport: {
        width: 'device-width',
        initialScale: 1,
      },
      icons: {
        icon: '/favicon.ico',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Proposal'
    };
  }
}

export default async function ProposalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  // Verify the proposal exists
  try {
    const metadataPath = join(uploadsDir, `${params.id}.json`);
    await readFile(metadataPath, 'utf-8');
  } catch (error) {
    notFound();
  }

  return children;
} 