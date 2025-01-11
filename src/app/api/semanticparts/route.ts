import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_query } = body;

    if (!user_query) {
      return NextResponse.json({ error: 'Missing user_query' }, { status: 400 });
    }

    const response = await fetch('http://127.0.0.1:5000/semantic_parts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_query }),
    });

    if (!response.ok) {
      throw new Error('Failed to get semantic parts');
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Semantic parts error:', error);
    return NextResponse.json(
      { error: 'Failed to get semantic parts' },
      { status: 500 }
    );
  }
}