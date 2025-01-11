'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "./../components/ui/button";
import { Checkbox } from "./../components/ui/checkbox";

interface Paper {
  id: string;
  author: string;
  type: 'Paper' | 'Article';
  title: string;
  year: number;
  pdfUrl?: string;
  selected?: boolean;
}

export default function LibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());

  const thesis = searchParams.get('thesis');
  const isNewCollection = searchParams.get('newCollection') === 'true';

  const searchPapers = async (searchQuery: string) => {
    console.log('Starting paper search with query:', searchQuery);
    setLoading(true);
    setError(null);

    try {
      // Add multiple queries to get more comprehensive results
      const queries = searchQuery.split(',').map(q => q.trim());
      
      const results: Paper[] = [];
      
      for (const query of queries) {
        console.log(`Searching for query: ${query}`);

        try {
          const response = await fetch('/api/library/search-papers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
          });

          console.log('Response status:', response.status);
          console.log('Response headers:', Object.fromEntries(response.headers.entries()));

          if (!response.ok) {
            // Log the error response body
            const errorBody = await response.text();
            console.error(`API Error for query ${query}:`, {
              status: response.status,
              statusText: response.statusText,
              body: errorBody
            });

            // If it's a 404, set a more specific error message
            if (response.status === 404) {
              setError(`No papers found for query: ${query}`);
            } else {
              setError(`Error searching papers: ${response.statusText}`);
            }
            continue;
          }

          const data = await response.json();
          console.log('Received data:', data);
          
          // Create a paper object from the result
          const paper: Paper = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
            author: 'Unknown', // Semantic Scholar API might not return author in this endpoint
            type: 'Paper', 
            title: data.title || query,
            year: new Date().getFullYear(), // Default to current year if not provided
            pdfUrl: data.pdfUrl
          };

          results.push(paper);
        } catch (queryError) {
          console.error(`Error processing query ${query}:`, queryError);
          setError(`Network error: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`);
        }
      }

      console.log('Final search results:', results);
      setSearchResults(results);

      // If no results after all queries
      if (results.length === 0) {
        setError('No papers found for the given search terms.');
      }
    } catch (error) {
      console.error('Comprehensive search error:', error);
      setError(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Component mounted with thesis:', thesis);
    console.log('Is new collection:', isNewCollection);

    if (thesis && isNewCollection) {
      searchPapers(thesis);
    } else if (!isNewCollection) {
      // Redirect to collections page or show message if not a new collection
      router.push('/collections');
    }
  }, [thesis, isNewCollection]);

  const handleJumpToChat = () => {
    router.push('/chat');
  };

  const togglePaperSelection = (id: string) => {
    setSelectedPapers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSaveToCollection = () => {
    // Handle saving selected papers to the collection
    const selectedPapersData = searchResults.filter(paper => 
      selectedPapers.has(paper.id)
    );
    console.log('Saving papers:', selectedPapersData);
    // Add your save logic here, potentially sending PDF URLs to backend
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-black text-center mb-8">
          {thesis ? `Results for "${decodeURIComponent(thesis)}"` : 'Search Results'}
        </h1>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Results List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            searchResults.length > 0 ? (
              searchResults.map((paper) => (
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
                      <span className="text-sm font-medium">{paper.author}</span>
                      <span className={`ml-3 px-2 py-1 text-xs rounded bg-green-100 text-green-800`}>
                        {paper.type}
                      </span>
                    </div>
                    <h3 className="text-gray-900">{paper.title}</h3>
                    {paper.pdfUrl && (
                      <a 
                        href={paper.pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-500 text-sm hover:underline"
                      >
                        Open PDF
                      </a>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{paper.year}</span>
                </div>
              ))
            ) : (
              <div className="text-center p-8 text-gray-500">
                No results found. Try a different search query.
              </div>
            )
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
            onClick={handleJumpToChat}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Jump to Chat</span>
          </Button>

          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center space-x-2"
            onClick={handleSaveToCollection}
            disabled={selectedPapers.size === 0}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Save to Collection</span>
          </Button>

          <Button 
            variant="outline" 
            className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
            onClick={() => {/* Add find more sources logic */}}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Find more sources</span>
          </Button>
        </div>
      </div>
    </div>
  );
}