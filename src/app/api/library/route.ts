import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export interface Paper {
  paperId: string;
  title: string;
  url: string;
  pdfUrl: string;
  type: string;
  year: number;
  authors: {
    id: string;
    name: string;
  }[];
  selected?: boolean;
}

// In your API route
export async function POST(req: NextRequest) {
  try {
    const { query, limit = 3, offset = 0, excludedPaperIds = [] } = await req.json();
    
    const encodedQuery = encodeURIComponent(query);
    const email = encodeURIComponent('your-email@example.com');
    
    // Request more items than needed to account for filtering
    const extraLimit = limit * 2;
    
    const openAlexResponse = await fetch(
      `https://api.openalex.org/works?search=${encodedQuery}&per_page=${extraLimit}&page=${Math.floor(offset/limit) + 1}&select=title,authorships,publication_year,type,open_access,id&mailto=${email}`
    );

    if (!openAlexResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch from OpenAlex API'
      }, { status: openAlexResponse.status });
    }

    const data = await openAlexResponse.json();
    
    // Filter out papers without PDF URLs and excluded papers
    const papers: Paper[] = data.results
      .filter((paper: any) => 
        paper.open_access?.oa_url && // Has PDF URL
        !excludedPaperIds.includes(paper.id) // Not in excluded list
      )
      .slice(0, limit) // Take only the requested number of papers
      .map((paper: any) => ({
        paperId: paper.id,
        title: paper.title,
        type: paper.type,
        url: paper.id,
        pdfUrl: paper.open_access.oa_url,
        year: paper.publication_year,
        authors: paper.authorships.map((authorship: any) => ({
          id: authorship.author.id,
          name: authorship.author.display_name
        }))
      }));

    return NextResponse.json({ 
      papers,
      hasMore: data.meta?.count > (offset + limit)
    });

  } catch (error) {
    console.error('Search papers error:', error);
    return NextResponse.json({ 
      error: 'Failed to search for papers'
    }, { status: 500 });
  }
}