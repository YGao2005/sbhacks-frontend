'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "./../components/ui/button";
import { Checkbox } from "./../components/ui/checkbox";
import { Input } from "./../components/ui/input";

interface Author {
  id: string;
  name: string;
}

interface Paper {
  id: string;
  title: string;
  url: string;
  pdfUrl: string;
  authors: Author[];
  type: 'Paper' | 'Article';
  year: number;
  selected?: boolean;
}

interface SearchResponse {
  total: number;
  papers: Paper[];
  hasMore: boolean;
  nextOffset: number;
  currentLimit: number;
  currentOffset: number;
}

const MIN_INITIAL_PAPERS = 6;  // Minimum papers for initial load
const MIN_LOAD_MORE_PAPERS = 4;  // Minimum papers for each load more
const MAX_RETRIES = 3;  // Maximum number of retry attempts
const LIMIT = 10;


export default function CollectionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const LIMIT = 10;

  // Initial load - now empty until search
  useEffect(() => {
    setSearchResults([]);
  }, []);

  const searchPapersWithRetry = async (
    query: string,
    offset: number = 0,
    minPapers: number,
    retryCount: number = 0
  ): Promise<SearchResponse> => {
    try {
      const response = await fetch('/api/library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query,
          offset,
          limit: LIMIT
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search papers');
      }
  
      const data: SearchResponse = await response.json();
      
      // If we don't have enough papers and haven't exceeded retry limit, try to fetch more
      if (data.papers.length < minPapers && data.hasMore && retryCount < MAX_RETRIES) {
        // Wait a short time before retrying to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        
        const additionalData = await searchPapersWithRetry(
          query,
          offset + data.papers.length,
          minPapers - data.papers.length,
          retryCount + 1
        );
  
        return {
          papers: [...data.papers, ...additionalData.papers],
          total: Math.max(data.total, data.papers.length + additionalData.papers.length),
          hasMore: additionalData.hasMore,
          nextOffset: additionalData.nextOffset,
          currentLimit: LIMIT,
          currentOffset: offset
        };
      }
  
      return data;
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        return searchPapersWithRetry(query, offset, minPapers, retryCount + 1);
      }
      throw error;
    }
  };

  useEffect(() => {
    setSearchResults([]);
  }, []);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchPapersWithRetry(query, 0, MIN_INITIAL_PAPERS);
      
      // Transform the papers data
      const transformedPapers = data.papers.map(paper => ({
        id: paper.id,
        title: paper.title,
        url: paper.url,
        pdfUrl: paper.pdfUrl,
        authors: paper.authors,
        type: 'Paper' as const,
        year: new Date().getFullYear(),
        selected: false
      }));

      setSearchResults(transformedPapers);
      setHasMore(data.hasMore);
      setCurrentOffset(data.nextOffset);
      setTotal(data.total);
      setLastSubmittedQuery(query);
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'Failed to search papers');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!lastSubmittedQuery || loadingMore) return;
    
    setLoadingMore(true);
    setError(null);
    try {
      const data = await searchPapersWithRetry(
        lastSubmittedQuery,
        currentOffset,
        MIN_LOAD_MORE_PAPERS
      );
      
      const transformedPapers = data.papers.map(paper => ({
        id: paper.id,
        title: paper.title,
        url: paper.url,
        pdfUrl: paper.pdfUrl,
        authors: paper.authors,
        type: 'Paper' as const,
        year: new Date().getFullYear(),
        selected: false
      }));

      setSearchResults(prev => [...prev, ...transformedPapers]);
      setHasMore(data.hasMore);
      setCurrentOffset(data.nextOffset);
      setTotal(data.total);
    } catch (error) {
      console.error('Load more error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load more papers');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  const togglePaperSelection = (paperId: string) => {
    setSelectedPapers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paperId)) {
        newSet.delete(paperId);
      } else {
        newSet.add(paperId);
      }
      return newSet;
    });
  };

  const handleJumpToChat = () => {
    router.push('/chat');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="flex items-center bg-white rounded-full shadow-lg p-2">
            <div className="flex items-center px-3 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Search academic papers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-none focus:ring-0 text-base text-gray-900"
            />
            <Button 
              onClick={() => handleSearch(searchQuery)}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Results Title */}
        <h1 className="text-2xl font-semibold text-black text-center mb-8">
          {lastSubmittedQuery 
            ? `Results for "${lastSubmittedQuery}" (${total} papers found)` 
            : 'Search Academic Papers'}
        </h1>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Results List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex justify-center items-center h-32 text-gray-500">
              {lastSubmittedQuery 
                ? 'No papers found with PDF access' 
                : 'Enter a search term to find papers'}
            </div>
          ) : (
            <>
              {searchResults.map((paper) => (
                <div 
                  key={paper.id}
                  className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedPapers.has(paper.id)}
                    onCheckedChange={() => togglePaperSelection(paper.id)}
                    className="h-4 w-4 text-blue-500 rounded border-gray-300 mr-4"
                  />
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-sm font-medium text-gray-500">
                        {paper.authors.length > 0 
                          ? paper.authors.map(author => author.name).join(', ') 
                          : 'Unknown Author'}
                      </span>
                      <span className="ml-3 px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                        {paper.type}
                      </span>
                    </div>
                    <h3 className="text-gray-900">{paper.title}</h3>
                    <div className="flex gap-4 mt-1">
                      <a 
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 text-sm hover:underline"
                      >
                        Open paper
                      </a>
                      {paper.pdfUrl && (
                        <a 
                          href={paper.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 text-sm hover:underline"
                        >
                          Download PDF
                        </a>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{paper.year}</span>
                </div>
              ))}
              
              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center p-4">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2"
                  >
                    {loadingMore ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                        Loading...
                      </div>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={() => {/* Handle save to collection */}}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
            disabled={selectedPapers.size === 0}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save to Collection
          </Button>

          <Button
            variant="outline"
            onClick={handleJumpToChat}
            className="border border-blue-500 text-blue-500 hover:bg-blue-50 px-6 py-2"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Jump to Chat
          </Button>
        </div>
      </div>
    </div>
  );
}