import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query } = body;
    
    console.log('Received search query:', query);
    
    // Validate input
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query parameter' },
        { status: 400 }
      );
    }
    
    // Encode the query parameters
    const encodedQuery = encodeURIComponent(query);
    const fields = encodeURIComponent('paperId,title,url,openAccessPdf,authors');
    
    // Make request to Semantic Scholar API
    const semanticScholarResponse = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search/match?query=${encodedQuery}&fields=${fields}`
    );

    console.log('Semantic Scholar API response status:', semanticScholarResponse.status);

    if (!semanticScholarResponse.ok) {
      const errorBody = await semanticScholarResponse.text();
      console.error('Semantic Scholar API error:', errorBody);
      return NextResponse.json({ 
        error: 'Failed to fetch from Semantic Scholar API',
        details: errorBody 
      }, { status: semanticScholarResponse.status });
    }

    const data = await semanticScholarResponse.json();
    
    console.log('Received data from Semantic Scholar:', JSON.stringify(data, null, 2));

    // Find the first paper with an openAccessPdf URL
    const paper = data.papers?.find(p => p.openAccessPdf?.url);
    
    if (!paper) {
      console.warn('No papers found for query:', query);
      return NextResponse.json({ 
        error: 'No papers found for this query',
        details: data 
      }, { status: 404 });
    }

    // Extract author names if available
    const authorNames = paper.authors 
      ? paper.authors.map((author: any) => author.name).join(', ')
      : 'Unknown Author';

    return NextResponse.json({ 
      pdfUrl: paper.openAccessPdf.url,
      title: paper.title,
      author: authorNames,
      year: paper.year || new Date().getFullYear()
    });

  } catch (error) {
    console.error('Search papers error:', error);
    return NextResponse.json({ 
      error: 'Failed to search for papers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}