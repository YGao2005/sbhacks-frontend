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

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const { papers } = await searchPapers(query, 3, 0);
      setSearchResults(papers);
      setLastSubmittedQuery(query);
      setCurrentOffset(papers.length);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;

    setLoadingMore(true);
    try {
      const query = lastSubmittedQuery || "academic research";

      // Get currently loaded paper IDs to exclude
      const excludedPaperIds = searchResults.map((paper) => paper.paperId);

      const { papers } = await searchPapers(
        query,
        3,
        currentOffset,
        excludedPaperIds
      );

      if (papers.length > 0) {
        setSearchResults((prev) => [...prev, ...papers]);
        setCurrentOffset((prev) => prev + papers.length);
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
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex justify-center items-center h-32 text-gray-500">
              {lastSubmittedQuery
                ? "No results found"
                : "Enter a search term to find papers"}
            </div>
          ) : (
            // Add this wrapper div to contain all the mapped results
            <div>
              {searchResults.map((paper) => (
                <div
                  key={paper.paperId}
                  className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedPapers.has(paper.paperId)}
                    onCheckedChange={() => togglePaperSelection(paper.paperId)}
                    className="h-4 w-4 text-blue-500 rounded border-gray-300 mr-4"
                  />
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-4">
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-sm font-medium">
                        {paper.authors.map((author) => author.name).join(", ")}
                      </span>
                      <span className="ml-3 px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                        Paper
                      </span>
                    </div>
                    <h3 className="text-gray-900">{paper.title}</h3>
                    <div className="text-sm text-gray-500 mt-1">
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        View on Semantic Scholar
                      </a>
                      {paper.pdfUrl && (
                        <a
                          href={paper.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3 hover:underline"
                        >
                          Open PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More Section */}
        {searchResults.length > 0 && (
          <div className="border-t border-gray-100 pt-8 pb-12">
            <div className="flex flex-col items-center">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                className="px-8 py-2 text-gray-600 border-gray-300 hover:bg-gray-50 transition-colors duration-200"
              >
                {loadingMore ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    <span>Loading more papers...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Load More Papers</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                )}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Showing {searchResults.length} papers
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={openCollectionModal}
            disabled={selectedPapers.size === 0}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 disabled:opacity-50"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            Save to Collection
          </Button>

          <Button
            variant="outline"
            onClick={handleJumpToChat}
            className="border border-blue-500 text-blue-500 hover:bg-blue-50 px-6 py-2"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Jump to Chat
          </Button>
        </div>

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
