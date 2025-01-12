// app/api/proxy-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { pdfUrl } = await req.json();
    
    const response = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    const pdfBlob = await response.blob();
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf'
      }
    });
  } catch (error) {
    console.error('PDF proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PDF' },
      { status: 500 }
    );
  }
}