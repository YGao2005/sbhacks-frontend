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
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodedQuery}&fields=${fields}`
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

    // Process up to 3 papers with PDF URLs
    const processedPapers = data.data
      .filter((paper: any) => paper.openAccessPdf?.url)
      .slice(0, 3)
      .map((paper: any) => ({
        paperId: paper.paperId,
        title: paper.title,
        url: paper.url,
        pdfUrl: paper.openAccessPdf.url,
        authors: paper.authors.map((author: any) => ({
          id: author.authorId,
          name: author.name
        }))
      }));

    if (processedPapers.length === 0) {
      console.warn('No papers with PDF URLs found for query:', query);
      return NextResponse.json({ 
        error: 'No papers with PDF URLs found for this query',
        details: data 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      total: data.total,
      papers: processedPapers
    });

  } catch (error) {
    console.error('Search papers error:', error);
    return NextResponse.json({ 
      error: 'Failed to search for papers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}