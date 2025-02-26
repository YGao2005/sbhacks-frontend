"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { firebaseOperations } from "@/lib/firebase";
import { EmptyState } from "./../components/EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground } from "./../components/AnimatedBackground";

export interface Paper {
  paperId: string; // Changed from id: number
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

interface Collection {
  id: string;
  name: string;
  thesis?: string;
  papersCount: number;
  lastUpdated: number;
}

async function searchPapers(
  query: string,
  limit: number = 3,
  offset: number = 0,
  excludedPaperIds: string[] = []
): Promise<{
  papers: Paper[];
  hasMore: boolean;
}> {
  try {
    const response = await fetch("/api/library", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit,
        offset,
        excludedPaperIds,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch papers");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Search papers error:", error);
    throw error;
  }
}

export default function CollectionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState("");
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set()); // Changed from number to string
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);

  // In your CollectionsPage component

  // Add this state to track all loaded paper IDs
  const [loadedPaperIds, setLoadedPaperIds] = useState<Set<string>>(new Set());

  // Update handleSearch to reset the loaded papers tracking
  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const { papers } = await searchPapers(query, 8, 0, []);
      setSearchResults(papers);
      setLastSubmittedQuery(query);
      setCurrentOffset(papers.length);
      // Reset and initialize loaded paper IDs
      setLoadedPaperIds(new Set(papers.map((paper) => paper.paperId)));
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update handleLoadMore to use the tracked paper IDs
  const handleLoadMore = async () => {
    if (loadingMore) return;

    setLoadingMore(true);
    try {
      const query = lastSubmittedQuery || "academic research";

      // Use the tracked paper IDs for exclusion
      const excludedPaperIds = Array.from(loadedPaperIds);

      const { papers } = await searchPapers(
        query,
        3,
        currentOffset,
        excludedPaperIds
      );

      if (papers.length > 0) {
        setSearchResults((prev) => [...prev, ...papers]);
        setCurrentOffset((prev) => prev + papers.length);
        // Update the set of loaded paper IDs
        setLoadedPaperIds((prev) => {
          const newSet = new Set(prev);
          papers.forEach((paper) => newSet.add(paper.paperId));
          return newSet;
        });
      }
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(searchQuery);
    }
  };

  const togglePaperSelection = (paperId: string) => {
    setSelectedPapers((prev) => {
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
    router.push("/chat");
  };

  const fetchUserCollections = async () => {
    setLoadingCollections(true);
    try {
      const userCollections = await firebaseOperations.getCollections();
      setCollections(userCollections);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleAnalyzeClick = (paper: Paper) => {
    if (paper.pdfUrl) {
      const encodedUrl = encodeURIComponent(paper.pdfUrl);
      router.push(`/pdf-analysis?url=${encodedUrl}`);
    } else {
      // Handle case where PDF URL is not available
      console.log("No PDF URL available for analysis");
      // Optionally show a toast or alert to the user
    }
  };

  const handleSaveToCollection = async (collectionId: string) => {
    try {
      // Close the modal immediately when the save operation starts
      setIsCollectionModalOpen(false);
      
      const selectedPapersArray = Array.from(selectedPapers);
      const selectedPapersData = searchResults.filter((paper) =>
        selectedPapers.has(paper.paperId)
      );
  
      // Start both operations concurrently
      const [collectionSaveResult, pdfUploadResults] = await Promise.allSettled([
        // Save to Firebase collection
        firebaseOperations.addPapersToCollection(
          collectionId,
          selectedPapersData
        ),
        
        // Upload PDFs in parallel
        Promise.all(
          selectedPapersData.map(async (paper) => {
            if (paper.pdfUrl) {
              try {
                const response = await fetch('/api/upload-pdf', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ pdfUrl: paper.pdfUrl }),
                });
                
                if (!response.ok) {
                  throw new Error(`Failed to upload PDF for paper: ${paper.paperId}`);
                }
                
                return {
                  paperId: paper.paperId,
                  status: 'success',
                  data: await response.json(),
                };
              } catch (error) {
                console.error(`Error uploading PDF for paper ${paper.paperId}:`, error);
                return {
                  paperId: paper.paperId,
                  status: 'error',
                  error: (error as Error).message,
                };
              }
            }
            return {
              paperId: paper.paperId,
              status: 'skipped',
              message: 'No PDF URL available',
            };
          })
        )
      ]);
  
      // Reset selection after save operation completes
      setSelectedPapers(new Set());
  
      // Handle results
      if (collectionSaveResult.status === 'fulfilled') {
        console.log('Papers saved to collection successfully');
      } else {
        console.error('Error saving to collection:', collectionSaveResult.reason);
      }
  
      if (pdfUploadResults.status === 'fulfilled') {
        const uploads = pdfUploadResults.value;
        const successfulUploads = uploads.filter(result => result.status === 'success');
        const failedUploads = uploads.filter(result => result.status === 'error');
        const skippedUploads = uploads.filter(result => result.status === 'skipped');
  
        console.log(`PDF uploads completed:
          Successful: ${successfulUploads.length}
          Failed: ${failedUploads.length}
          Skipped: ${skippedUploads.length}`
        );
  
        if (failedUploads.length > 0) {
          console.warn('Some PDFs failed to upload:', failedUploads);
        }
      }
  
    } catch (error) {
      console.error("Error in handleSaveToCollection:", error);
      // Even if there's an error, ensure the modal is closed
      setIsCollectionModalOpen(false);
      setSelectedPapers(new Set());
    }
  };

  const openCollectionModal = () => {
    fetchUserCollections();
    setIsCollectionModalOpen(true);
  };

  const getTypeStyle = (type: string): string => {
    const styleMap: { [key: string]: string } = {
      Article: "bg-rose-50 text-rose-700 border-rose-200",
      Review: "bg-sky-50 text-sky-700 border-sky-200",
      "Book Chapter": "bg-purple-50 text-purple-700 border-purple-200",
      Dataset: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Preprint: "bg-amber-50 text-amber-700 border-amber-200",
      Dissertation: "bg-red-50 text-red-700 border-red-200",
      Book: "bg-violet-50 text-violet-700 border-violet-200",
      Other: "bg-slate-50 text-slate-700 border-slate-200",
    };
    return styleMap[type] || styleMap["Other"];
  };

  return (
    <div className="relative min-h-screen z-8 p-8">
    <AnimatedBackground />
    <div className="relative z-96 min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="flex items-center bg-white rounded-full shadow-lg p-2">
            <div className="flex items-center px-3 text-gray-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
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
        {/* Show empty state when no search has been performed */}
        {!lastSubmittedQuery && searchResults.length === 0 && !loading && (
            <EmptyState onSampleSearch={handleSearch} />
          )}


        {/* Results Title */}
        {lastSubmittedQuery && (
            <h1 className="text-2xl font-semibold text-black text-center mb-8">
              Results for "{lastSubmittedQuery}"
            </h1>
          )}

        {/* Results List */}
        <AnimatePresence>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-32"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-lg shadow-sm overflow-hidden mb-6"
            >
              {searchResults.map((paper) => (
                <motion.div
                  key={paper.paperId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-start space-x-4">
                    <Checkbox
                      checked={selectedPapers.has(paper.paperId)}
                      onCheckedChange={() =>
                        togglePaperSelection(paper.paperId)
                      }
                      className="mt-1 h-4 w-4 text-blue-500 rounded border-gray-300"
                    />

                    <div className="flex-1">
                      {/* Title */}
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {paper.title}
                      </h3>

                      {/* Meta information */}
                      <div className="flex items-center justify-between mb-2">
                      {/* Authors on the left */}
                      <span className="text-sm text-gray-600">
                        {paper.authors
                          .map((author) => author.name)
                          .join(", ")}
                      </span>

                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500">
                            ({paper.year})
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full inline-flex ${
                            paper.type === 'article' ? 'bg-rose-100 text-rose-800' : 
                            paper.type === 'Paper' ? 'bg-green-100 text-green-800' : 
                            paper.type === 'review' ? 'bg-sky-100 text-sky-800' :
                            paper.type === 'book chapter' ? 'bg-purple-100 text-purple-800' :
                            paper.type === 'dataset' ? 'bg-emerald-100 text-emerald-800' :
                            paper.type === 'preprint' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {paper.type}
                          </span>
                          
                        </div>
                      </div>

                      {/* Links */}
                      <button
                          onClick={() => router.push(`/summary/${paper.paperId}`)}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-gray-800"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4v.01M9 16v.01"
                            />
                          </svg>
                          Summarize
                        </button>
                      <div className="flex items-center space-x-4">
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          View paper
                        </a>
                        {paper.pdfUrl && (
                          <a
                            href={paper.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Action Buttons */}
        <motion.div
          className="flex justify-between items-center mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="outline"
            className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
            onClick={handleJumpToChat}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>Jump to Chat</span>
          </Button>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              className={`bg-blue-500 hover:bg-blue-600 text-white flex items-center space-x-2 ${
                selectedPapers.size === 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={openCollectionModal}
              disabled={selectedPapers.size === 0}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Save to Collection</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Collection Selection Modal */}
        <Dialog
          open={isCollectionModalOpen}
          onOpenChange={setIsCollectionModalOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose Collection</DialogTitle>
              <DialogDescription>
                Select a collection to add {selectedPapers.size} paper
                {selectedPapers.size !== 1 ? "s" : ""} to:
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
                      className="p-4 hover:bg-gray-50 rounded-lg cursor-pointer border transition-colors duration-200"
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
  </div>
  );
}
