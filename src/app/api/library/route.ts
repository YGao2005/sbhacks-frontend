import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In your API route
export async function POST(req: NextRequest) {
  try {
    const { query, limit = 3, offset = 0 } = await req.json();
    
    // Encode the query parameters 
    const encodedQuery = encodeURIComponent(query);
    const fields = encodeURIComponent('paperId,title,url,openAccessPdf,authors');
      
    // Make request to Semantic Scholar API with offset
    const semanticScholarResponse = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodedQuery}&fields=${fields}&offset=${offset}&limit=${limit}`
    );

    if (!semanticScholarResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch from Semantic Scholar API'
      }, { status: semanticScholarResponse.status });
    }

    const data = await semanticScholarResponse.json();
    
    // Process papers with PDF URLs
    const papers = data.data
      .filter((paper: any) => paper.openAccessPdf?.url)
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

    return NextResponse.json({ 
      papers,
      hasMore: true // Always indicate there are more papers
    });

  } catch (error) {
    console.error('Search papers error:', error);
    return NextResponse.json({ 
      error: 'Failed to search for papers'
    }, { status: 500 });
  }
}