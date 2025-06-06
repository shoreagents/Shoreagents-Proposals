import { NextRequest, NextResponse } from 'next/server';
import { proposalsApi } from '@/lib/supabase';
import { generateSlug, ensureUniqueUrl } from '@/lib/utils';

function extractTitleFromHtml(content: string): string | null {
  const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const customUrl = formData.get('customUrl') as string;
    const proposalId = formData.get('proposalId') as string;

    if (!file && !title) {
      return NextResponse.json(
        { error: 'Either a file or title is required' },
        { status: 400 }
      );
    }

    let content = '';
    let fileName = '';
    let fileSize = 0;
    let fileType = '';
    let extractedTitle = title;

    // NEW: Get content from form if present
    const formContent = formData.get('content') as string | null;

    if (proposalId && !file && !formContent) {
      const existingProposal = await proposalsApi.getById(proposalId);
      if (!existingProposal) {
        return NextResponse.json(
          { error: 'Proposal not found' },
          { status: 404 }
        );
      }
      content = existingProposal.content;
      fileName = existingProposal.file_name;
      fileSize = existingProposal.file_size;
      fileType = existingProposal.file_type;
    } else if (file) {
      // Only process file if one is provided
      content = await file.text();
      fileName = file.name;
      fileSize = file.size;
      fileType = file.type;

      // If no title provided, try to extract it from the HTML content
      if (!extractedTitle) {
        extractedTitle = extractTitleFromHtml(content) || fileName.replace('.html', '');
      }
    } else if (formContent) {
      // If content is provided from the code editor, use it
      content = formContent;
      // Use previous file info if available
      if (proposalId) {
        const existingProposal = await proposalsApi.getById(proposalId);
        if (existingProposal) {
          fileName = existingProposal.file_name;
          fileSize = existingProposal.file_size;
          fileType = existingProposal.file_type;
        }
      }
    }

    // Generate or validate URL
    let url = customUrl;
    if (!url) {
      // If no custom URL provided, generate one from the title
      const baseSlug = generateSlug(extractedTitle || fileName.replace('.html', ''));
      url = await ensureUniqueUrl(baseSlug);
    } else {
      // Validate custom URL format
      const validUrlPattern = /^[a-zA-Z0-9-]+$/;
      if (!validUrlPattern.test(url)) {
        return NextResponse.json(
          { error: 'Invalid URL format. Only letters, numbers, and hyphens are allowed.' },
          { status: 400 }
        );
      }

      // Check if custom URL is available
      const isAvailable = await proposalsApi.isUrlAvailable(url, proposalId);
      if (!isAvailable) {
        return NextResponse.json(
          { error: 'This custom URL is already in use' },
          { status: 400 }
        );
      }
    }

    const proposalData = {
      title: extractedTitle,
      content,
      url,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      user_id: null, // Will be updated when authentication is implemented
    };

    if (proposalId) {
      // Update existing proposal
      const updatedProposal = await proposalsApi.update(proposalId, proposalData);
      return NextResponse.json(updatedProposal);
    } else {
      // Create new proposal
      const newProposal = await proposalsApi.create(proposalData);
      return NextResponse.json(newProposal);
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
} 