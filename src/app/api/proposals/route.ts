import { NextResponse } from 'next/server';
import { proposalsApi } from '@/lib/supabase';

export async function GET() {
  try {
    const proposals = await proposalsApi.getAll();
    return NextResponse.json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Proposal ID is required' },
        { status: 400 }
      );
    }

    await proposalsApi.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json(
      { error: 'Failed to delete proposal' },
      { status: 500 }
    );
  }
} 