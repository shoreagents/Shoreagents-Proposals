import { NextRequest, NextResponse } from 'next/server';
import { proposalsApi } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const excludeId = searchParams.get('excludeId');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    const validUrlPattern = /^[a-zA-Z0-9-]+$/;
    if (!validUrlPattern.test(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format. Only letters, numbers, and hyphens are allowed.' },
        { status: 400 }
      );
    }

    const isAvailable = await proposalsApi.isUrlAvailable(url, excludeId || undefined);
    return NextResponse.json({ available: isAvailable });
  } catch (error) {
    console.error('Error checking URL:', error);
    return NextResponse.json(
      { error: 'Failed to check URL availability' },
      { status: 500 }
    );
  }
} 