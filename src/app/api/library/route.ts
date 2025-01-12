import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Create a cache to store seen paper IDs per query
const seenPapersCache = new Map<string, Set<string>>();

// Helper function to clean up old cache entries
const cleanupCache = () => {
  const maxCacheAge = 30 * 60 * 1000; // 30 minutes
  const now = Date.now();
  
  for (const [query, data] of seenPapersCache.entries()) {
    if (now - (data as any).timestamp > maxCacheAge) {
      seenPapersCache.delete(query);
    }
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, offset = 0, limit = DEFAULT_LIMIT } = body;
    
    console.log('Received search query:', query, 'offset:', offset, 'limit:', limit);
    
    // Validate input
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query parameter' },
        { status: 400 }
      );
    }

    // Validate and sanitize limit
    const sanitizedLimit = Math.min(
      Math.max(1, Number(limit)),
      MAX_LIMIT
    );
    
    if (isNaN(sanitizedLimit)) {
      return NextResponse.json(
        { error: 'Invalid limit parameter' },
        { status: 400 }
      );
    }

    // Validate offset
    const sanitizedOffset = Math.max(0, Number(offset));
    if (isNaN(sanitizedOffset)) {
      return NextResponse.json(
        { error: 'Invalid offset parameter' },
        { status: 400 }
      );
    }

    // Initialize or get the set of seen papers for this query
    if (!seenPapersCache.has(query)) {
      seenPapersCache.set(query, new Set());
      (seenPapersCache.get(query) as any).timestamp = Date.now();
    }
    const seenPapers = seenPapersCache.get(query)!;
    
    // Clean up old cache entries periodically
    cleanupCache();
    
    // Make request to Semantic Scholar API with increased limit to account for potential duplicates
    const adjustedLimit = sanitizedLimit * 2; // Request more papers to account for filtering
    const encodedQuery = encodeURIComponent(query);
    const fields = encodeURIComponent('paperId,title,url,openAccessPdf,authors');
    
    const semanticScholarResponse = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodedQuery}&fields=${fields}&limit=${adjustedLimit}&offset=${sanitizedOffset}`
    );

    if (!semanticScholarResponse.ok) {
      const errorBody = await semanticScholarResponse.text();
      console.error('Semantic Scholar API error:', errorBody);
      return NextResponse.json({ 
        error: 'Failed to fetch from Semantic Scholar API',
        details: errorBody 
      }, { status: semanticScholarResponse.status });
    }

    const data = await semanticScholarResponse.json();
    
    // Process and filter papers
    const processedPapers = [];
    for (const paper of data.data) {
      // Skip papers without PDF URLs or that we've seen before
      if (!paper.openAccessPdf?.url || seenPapers.has(paper.paperId)) {
        continue;
      }

      // Add to processed papers and mark as seen
      processedPapers.push({
        id: paper.paperId,
        title: paper.title,
        url: paper.url,
        pdfUrl: paper.openAccessPdf.url,
        authors: paper.authors.map((author: any) => ({
          id: author.authorId,
          name: author.name
        }))
      });
      seenPapers.add(paper.paperId);

      // Break if we have enough unique papers
      if (processedPapers.length >= sanitizedLimit) {
        break;
      }
    }

    // Calculate if there are more results
    const hasMore = sanitizedOffset + processedPapers.length < data.total;
    
    // Return results with pagination info
    return NextResponse.json({ 
      total: data.total,
      papers: processedPapers,
      hasMore,
      nextOffset: sanitizedOffset + processedPapers.length,
      currentLimit: sanitizedLimit,
      currentOffset: sanitizedOffset
    });

  } catch (error) {
    console.error('Search papers error:', error);
    return NextResponse.json({ 
      error: 'Failed to search for papers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}