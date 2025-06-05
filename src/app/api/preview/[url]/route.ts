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

    return NextResponse.json({
      content: proposal.content,
      title: proposal.title
    });
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposal content' },
      { status: 500 }
    );
  }
} 