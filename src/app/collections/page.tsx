'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "./../components/ui/button";
import { Checkbox } from "./../components/ui/checkbox";
import { Input } from "./../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./../components/ui/dialog";
import { searchPapers } from './search-api';
import { firebaseOperations } from '@/lib/firebase';

export interface Paper {
  id: number;
  author: string;
  type: 'Paper' | 'Article';
  title: string;
  year: number;
  selected?: boolean;
}

interface Collection {
  id: string;
  name: string;
  thesis?: string;
  papersCount: number;
  lastUpdated: number;
}

export default function CollectionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState('');
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);

  // Initial search when component loads
  useEffect(() => {
    const initialSearch = async () => {
      setLoading(true);
      try {
        const results = await searchPapers('');
        setSearchResults(results);
      } catch (error) {
        console.error('Initial search error:', error);
      } finally {
        setLoading(false);
      }
    };

    initialSearch();
  }, []);

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const results = await searchPapers(query);
      setSearchResults(results);
      setLastSubmittedQuery(query);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  const togglePaperSelection = (id: number) => {
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

  const handleJumpToChat = () => {
    router.push('/chat');
  };

  const fetchUserCollections = async () => {
    setLoadingCollections(true);
    try {
      const userCollections = await firebaseOperations.getCollections();
      setCollections(userCollections);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleSaveToCollection = async (collectionId: string) => {
    try {
      const selectedPapersArray = Array.from(selectedPapers);
      const selectedPapersData = searchResults
        .filter(paper => selectedPapers.has(paper.id));
      
      await firebaseOperations.addPapersToCollection(collectionId, selectedPapersData);
      setIsCollectionModalOpen(false);
      setSelectedPapers(new Set());
      // Optionally show a success message
    } catch (error) {
      console.error('Error saving papers to collection:', error);
      // Optionally show an error message
    }
  };

  const openCollectionModal = () => {
    fetchUserCollections();
    setIsCollectionModalOpen(true);
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
              placeholder="Find a paper or article"
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
            ? `Results for "${lastSubmittedQuery}"` 
            : 'Search Papers and Articles'}
        </h1>

        {/* Results List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex justify-center items-center h-32 text-gray-500">
              {lastSubmittedQuery 
                ? 'No results found' 
                : 'Enter a search term to find papers'}
            </div>
          ) : (
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
                    <span className={`ml-3 px-2 py-1 text-xs rounded ${
                      paper.type === 'Paper' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {paper.type}
                    </span>
                  </div>
                  <h3 className="text-gray-900">{paper.title}</h3>
                </div>
                <span className="text-sm text-gray-500">{paper.year}</span>
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={openCollectionModal}
            disabled={selectedPapers.size === 0}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 disabled:opacity-50"
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

        {/* Collection Selection Modal */}
        <Dialog open={isCollectionModalOpen} onOpenChange={setIsCollectionModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose Collection</DialogTitle>
              <DialogDescription>
                Select a collection to add {selectedPapers.size} paper{selectedPapers.size !== 1 ? 's' : ''} to:
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto">
              {loadingCollections ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : collections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No collections found. Create a collection first.
                </div>
              ) : (
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <div
                      key={collection.id}
                      onClick={() => handleSaveToCollection(collection.id)}
                      className="p-4 hover:bg-gray-50 rounded-lg cursor-pointer border"
                    >
                      <h3 className="font-medium">{collection.name}</h3>
                      {collection.thesis && (
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          {collection.thesis}
                        </p>
                      )}
                      <div className="text-sm text-gray-400 mt-2">
                        {collection.papersCount} papers
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}