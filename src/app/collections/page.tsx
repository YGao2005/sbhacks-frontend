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
import { motion, AnimatePresence } from "framer-motion";

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
      const selectedPapersArray = Array.from(selectedPapers);
      const selectedPapersData = searchResults.filter((paper) =>
        selectedPapers.has(paper.paperId)
      );

      await firebaseOperations.addPapersToCollection(
        collectionId,
        selectedPapersData
      );
      setIsCollectionModalOpen(false);
      setSelectedPapers(new Set());
      // Optionally show a success message
    } catch (error) {
      console.error("Error saving papers to collection:", error);
      // Optionally show an error message
    }
  };

  const openCollectionModal = () => {
    fetchUserCollections();
    setIsCollectionModalOpen(true);
  };

  const getTypeStyle = (
    type: string
  ): { bg: string; text: string; border: string } => {
    const styleMap: {
      [key: string]: { bg: string; text: string; border: string };
    } = {
      Article: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      },
      "Book Chapter": {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
      },
      Dataset: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
      },
      Preprint: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
      },
      Dissertation: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
      },
      Book: {
        bg: "bg-indigo-50",
        text: "text-indigo-700",
        border: "border-indigo-200",
      },
      Review: {
        bg: "bg-pink-50",
        text: "text-pink-700",
        border: "border-pink-200",
      },
      Other: {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
      },
    };
    return styleMap[type] || styleMap["Other"];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
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

        {/* Results Title */}
        <h1 className="text-2xl font-semibold text-black text-center mb-8">
          {lastSubmittedQuery
            ? `Results for "${lastSubmittedQuery}"`
            : "Search Papers and Articles"}
        </h1>

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
                      <div className="flex items-center space-x-3 mb-2">
                        {/* Authors */}
                        <span className="text-sm text-gray-600">
                          {paper.authors
                            .map((author) => author.name)
                            .join(", ")}
                        </span>

                        {/* Year */}
                        <span className="text-sm text-gray-500">
                          ({paper.year})
                        </span>

                        {/* Type Badge */}
                        <span
                          className={`
                            px-2 py-0.5 text-xs font-medium rounded-full
                            ${getTypeStyle(paper.type).bg}
                            ${getTypeStyle(paper.type).text}
                            border ${getTypeStyle(paper.type).border}
                          `}
                        >
                          {paper.type}
                        </span>
                      </div>

                      {/* Links */}
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
  );
}
