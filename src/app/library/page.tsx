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

export default function LibraryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [totalResults, setTotalResults] = useState(0);

  const thesis = searchParams.get('thesis');
  const isNewCollection = searchParams.get('newCollection') === 'true';

  const searchPapers = async (searchQuery: string) => {
    console.log('Starting paper search with query:', searchQuery);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorBody
        });

        setError(response.status === 404 
          ? `No papers found for query: ${searchQuery}` 
          : `Error searching papers: ${response.statusText}`
        );
        setSearchResults([]);
        return;
      }

      const data = await response.json();
      console.log('Received data:', data);
      
      // Check if data has papers and total
      if (!data.papers || data.papers.length === 0) {
        setError('No papers found for the given search terms.');
        setSearchResults([]);
        return;
      }

      // Transform API results to our Paper interface
      const results: Paper[] = data.papers.map((paper: any) => ({
        id: paper.paperId, // Use paperId as the unique identifier
        authors: paper.authors || [], // Ensure authors array exists
        url: paper.url,
        type: 'Paper', 
        title: paper.title,
        year: new Date().getFullYear(), // Default to current year
        pdfUrl: paper.pdfUrl
      }));

      setSearchResults(results);
      setTotalResults(data.total || results.length);
      
    } catch (error) {
      console.error('Comprehensive search error:', error);
      setError(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSearchResults([]);
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
    // Filter selected papers with PDF URLs
    const selectedPapersWithPdf = searchResults.filter(paper => 
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
        // Fetch the PDF URL to get the file
        const response = await fetch(paper.pdfUrl!);
        const blob = await response.blob();

        // Create FormData to send the PDF
        const formData = new FormData();
        formData.append('pdf', blob, `${paper.id}_${paper.title.slice(0, 50)}.pdf`);

        // Send to upload API
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
          status: 'error' 
        };
      }
    });

    try {
      const uploadResults = await Promise.all(uploadPromises);

      // Process upload results
      const successCount = uploadResults.filter(r => r.status === 'success').length;
      const errorCount = uploadResults.filter(r => r.status === 'error').length;

      // Show toast notifications
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

      // Optionally, clear selection after upload
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
        {/* Header */}
        <h1 className="text-2xl font-semibold text-black text-center mb-8">
          {thesis ? `Results for "${decodeURIComponent(thesis)}"` : 'Search Results'}
        </h1>

        {/* Total Results */}
        {totalResults > 0 && (
          <div className="text-center text-gray-600 mb-4">
            Total results: {totalResults}
          </div>
        )}

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
                      <span className="text-sm font-medium text-gray-500">
                        {paper.authors.length > 0 
                          ? paper.authors.map(author => author.name).join(', ') 
                          : 'Unknown Author'}
                      </span>
                      <span className={`ml-3 px-2 py-1 text-xs rounded bg-green-100 text-green-800`}>
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
                No results found. Try a different search query.
              </div>
            )
          )}
        </div>

        {/* Action Buttons (remaining code stays the same) */}
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