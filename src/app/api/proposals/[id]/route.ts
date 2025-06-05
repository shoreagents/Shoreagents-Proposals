import { NextResponse } from 'next/server';
import { unlink, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const uploadsDir = join(process.cwd(), 'uploads');
const pagesDir = join(process.cwd(), 'src/app/pages');

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const metadataPath = join(uploadsDir, `${id}.json`);
    
    if (!existsSync(metadataPath)) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);

    return NextResponse.json({
      id: metadata.id,
      title: metadata.title || 'Untitled Proposal',
      lastModified: metadata.lastModified || new Date().toISOString(),
      description: metadata.description
    });
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log('Deleting proposal:', id);

    // Delete the HTML file
    const filePath = join(uploadsDir, `${id}.html`);
    await unlink(filePath);
    console.log('Deleted HTML file');

    // Delete the page component directory
    const pageDir = join(pagesDir, id);
    await rm(pageDir, { recursive: true, force: true });
    console.log('Deleted page component directory');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json(
      { error: 'Failed to delete proposal' },
      { status: 500 }
    );
  }
} 