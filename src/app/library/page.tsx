'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "./../components/ui/button";
import { Checkbox } from "./../components/ui/checkbox";
import { useToast } from "@/hooks/use-toast"
import { url } from 'inspector';

interface Paper {
  id: string;
  authors: { id: string; name: string }[];
  type: 'Paper' | 'Article';
  title: string;
  url: string;
  year: number;
  pdfUrl?: string;
  selected?: boolean;
}

interface SearchResultGroup {
  concept: string;
  papers: Paper[];
  total: number;
}

export default function LibraryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchResults, setSearchResults] = useState<SearchResultGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [totalResults, setTotalResults] = useState(0);

  const thesis = searchParams.get('thesis');
  const isNewCollection = searchParams.get('newCollection') === 'true';

  const getSemanticParts = async (query: string): Promise<string[]> => {
    try {
      const response = await fetch('/api/semanticparts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_query: query }),
      });

      if (!response.ok) {
        throw new Error('Failed to get semantic parts');
      }

      const data = await response.json();
      // Parse the JSON string from the response
      console.log('Data:', data);
      const parsedResponse = JSON.parse(data.response.replace('```json\n', '').replace('\n```', ''));
      return parsedResponse.main_concepts;
    } catch (error) {
      console.error('Error getting semantic parts:', error);
      throw error;
    }
  };


  const searchPapers = async (searchQuery: string, concept: string): Promise<SearchResultGroup> => {
    try {
      const response = await fetch('/api/library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error(`Error searching papers: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.papers || data.papers.length === 0) {
        return {
          concept,
          papers: [],
          total: 0
        };
      }

      const results: Paper[] = data.papers.map((paper: any) => ({
        id: paper.paperId,
        authors: paper.authors || [],
        url: paper.url,
        type: 'Paper',
        title: paper.title,
        year: new Date().getFullYear(),
        pdfUrl: paper.pdfUrl
      }));

      return {
        concept,
        papers: results,
        total: data.total || results.length
      };
    } catch (error) {
      console.error(`Search error for concept "${concept}":`, error);
      throw error;
    }
  };

  const performSemanticSearch = async (mainQuery: string) => {
    console.log('Performing semantic search for:', mainQuery);
    setLoading(true);
    setError(null);
    try {
      // Get semantic parts
      const concepts = await getSemanticParts(mainQuery);
      
      // Search papers for each concept
      const searchPromises = concepts.map(concept => 
        searchPapers(concept, concept)
      );

      const results = await Promise.all(searchPromises);
      setSearchResults(results);
    } catch (error) {
      console.error('Comprehensive search error:', error);
      setError(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (thesis && isNewCollection) {
      performSemanticSearch(thesis);
    } else if (!isNewCollection) {
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


  const handleSaveToCollection = async () => {
    const allPapers = searchResults.flatMap(group => group.papers);
    const selectedPapersWithPdf = allPapers.filter(paper => 
      selectedPapers.has(paper.id) && paper.pdfUrl
    );
  
    if (selectedPapersWithPdf.length === 0) {
      toast({
        title: "No PDFs to upload",
        description: "No selected papers have PDF URLs to upload",
      });
      return;
    }
  
    setUploadLoading(true);
    const uploadPromises = selectedPapersWithPdf.map(async (paper) => {
      try {
        // First fetch PDF through our proxy
        const proxyResponse = await fetch('/api/proxy-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pdfUrl: paper.pdfUrl }),
        });
  
        if (!proxyResponse.ok) {
          throw new Error(`Failed to fetch PDF through proxy for paper: ${paper.title}`);
        }
  
        const blob = await proxyResponse.blob();
        const formData = new FormData();
        formData.append('pdf', blob, `${paper.id}_${paper.title.slice(0, 50)}.pdf`);
  
        const uploadResponse = await fetch('http://127.0.0.1:5000/upload_pdf', {
          method: 'POST',
          body: formData
        });
  
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload PDF for paper: ${paper.title}`);
        }
  
        return { 
          id: paper.id, 
          title: paper.title, 
          status: 'success' 
        };
      } catch (error) {
        console.error(`Error uploading PDF for paper ${paper.title}:`, error);
        return { 
          id: paper.id, 
          title: paper.title, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  
    try {
      const uploadResults = await Promise.all(uploadPromises);
      const successCount = uploadResults.filter(r => r.status === 'success').length;
      const errorCount = uploadResults.filter(r => r.status === 'error').length;
  
      if (successCount > 0) {
        toast({
          title: "Upload Successful",
          description: `Successfully uploaded ${successCount} PDF(s)`,
          variant: "default"
        });
      }
  
      if (errorCount > 0) {
        toast({
          title: "Upload Partial Failure",
          description: `Failed to upload ${errorCount} PDF(s)`,
          variant: "destructive"
        });
      }
  
      setSelectedPapers(new Set());
    } catch (error) {
      console.error('Comprehensive upload error:', error);
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading PDFs",
        variant: "destructive"
      });
    } finally {
      setUploadLoading(false);
    }
  };

  // Modify the Button for saving to collection to show loading state
  const SaveToCollectionButton = (
    <Button 
      className="bg-blue-500 hover:bg-blue-600 text-white flex items-center space-x-2"
      onClick={handleSaveToCollection}
      disabled={selectedPapers.size === 0 || uploadLoading}
    >
      {uploadLoading ? (
        <svg className="animate-spin h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      <span>{uploadLoading ? 'Uploading...' : 'Save to Collection'}</span>
    </Button>
  );


  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-black text-center mb-8">
          {thesis ? `Results for "${decodeURIComponent(thesis)}"` : 'Search Results'}
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          searchResults.map((group, index) => (
            <div key={index} className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                {group.concept} ({group.total} results)
              </h2>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                {group.papers.length > 0 ? (
                  group.papers.map((paper) => (
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
                        {paper.url && (
                          <a 
                            href={paper.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-500 text-sm hover:underline"
                          >
                            Open paper
                          </a>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{paper.year}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    No results found for this concept.
                  </div>
                )}
              </div>
            </div>
          ))
        )}

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
            disabled={selectedPapers.size === 0 || uploadLoading}
          >
            {uploadLoading ? (
              <svg className="animate-spin h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            <span>{uploadLoading ? 'Uploading...' : 'Save to Collection'}</span>
          </Button>

          <Button 
            variant="outline" 
            className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
            onClick={() => router.push('/collections')}
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