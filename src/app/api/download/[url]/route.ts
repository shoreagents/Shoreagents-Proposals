import { NextRequest, NextResponse } from 'next/server';
import { proposalsApi } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { url: string } }
) {
  try {
    const proposal = await proposalsApi.getByUrl(params.url);
    
    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Create a response with the HTML content
    const response = new NextResponse(proposal.content);
    
    // Set appropriate headers for file download
    response.headers.set('Content-Type', 'text/html');
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="${proposal.title || 'proposal'}.html"`
    );

    return response;
  } catch (error) {
    console.error('Error downloading proposal:', error);
    return NextResponse.json(
      { error: 'Failed to download proposal' },
      { status: 500 }
    );
  }
} 