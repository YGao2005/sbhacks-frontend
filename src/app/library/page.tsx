"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "./../components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Paper {
  id: string;
  authors: { id: string; name: string }[];
  type: "Paper" | "Article";
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
  hasMore: boolean;
  offset: number;
  loading: boolean;
}

const LIMIT = 10;

export default function LibraryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchResults, setSearchResults] = useState<SearchResultGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());

  const thesis = searchParams.get("thesis");
  const isNewCollection = searchParams.get("newCollection") === "true";

  const allPaperIds = searchResults.flatMap((group) =>
    group.papers.map((paper) => paper.id)
  );

  const handleSelectAll = (checked: boolean) => {
    setSelectedPapers(new Set(checked ? allPaperIds : []));
  };

  const getSemanticParts = async (query: string): Promise<string[]> => {
    try {
      const response = await fetch("/api/semanticparts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_query: query }),
      });

      if (!response.ok) {
        throw new Error("Failed to get semantic parts");
      }

      const data = await response.json();
      const parsedResponse = JSON.parse(
        data.response.replace("```json\n", "").replace("\n```", "")
      );
      return parsedResponse.main_concepts;
    } catch (error) {
      console.error("Error getting semantic parts:", error);
      throw error;
    }
  };

  const LIMIT = 6;
  const MAX_RETRIES = 3; // Maximum number of retries for each concept
  const MIN_PAPERS = 4; // Minimum number of papers we want for each concept

  const searchPapersWithRetry = async (
    searchQuery: string,
    concept: string,
    offset: number = 0,
    retryCount: number = 0
  ): Promise<{
    papers: Paper[];
    total: number;
    hasMore: boolean;
    nextOffset: number;
  }> => {
    try {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          offset,
          limit: LIMIT,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error searching papers: ${response.statusText}`);
      }

      const data = await response.json();
      const results: Paper[] =
        data.papers?.map((paper: any) => ({
          id: paper.paperId,
          authors: paper.authors || [],
          url: paper.url,
          type: "Paper",
          title: paper.title,
          year: new Date().getFullYear(),
          pdfUrl: paper.pdfUrl,
        })) || [];

      // If we don't have enough papers and haven't exceeded retry limit, try to fetch more
      if (results.length < MIN_PAPERS && retryCount < MAX_RETRIES) {
        const additionalResults = await searchPapersWithRetry(
          searchQuery,
          concept,
          offset + results.length,
          retryCount + 1
        );

        return {
          papers: [...results, ...additionalResults.papers],
          total: Math.max(
            data.total || 0,
            results.length + additionalResults.papers.length
          ),
          hasMore: additionalResults.hasMore,
          nextOffset: additionalResults.nextOffset,
        };
      }

      return {
        papers: results,
        total: data.total || results.length,
        hasMore: data.hasMore,
        nextOffset: data.nextOffset || offset + results.length,
      };
    } catch (error) {
      console.error(
        `Search error for concept "${concept}" (retry ${retryCount}):`,
        error
      );
      if (retryCount < MAX_RETRIES) {
        // Wait a short time before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return searchPapersWithRetry(
          searchQuery,
          concept,
          offset,
          retryCount + 1
        );
      }
      throw error;
    }
  };

  const performSemanticSearch = async (mainQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const concepts = await getSemanticParts(mainQuery);

      const searchPromises = concepts.map((concept) =>
        searchPapersWithRetry(concept, concept)
      );

      const results = await Promise.all(searchPromises);

      // Transform results into SearchResultGroup format
      const groupResults = results.map((result, index) => ({
        concept: concepts[index],
        papers: result.papers,
        total: result.total,
        hasMore: result.hasMore,
        offset: result.nextOffset,
        loading: false,
        retryCount: 0,
      }));

      setSearchResults(groupResults.filter((group) => group.papers.length > 0));
    } catch (error) {
      console.error("Comprehensive search error:", error);
      setError("Failed to load search results. Please try again.");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async (concept: string, groupIndex: number) => {
    const group = searchResults[groupIndex];
    if (!group || group.loading || !group.hasMore) return;

    setSearchResults((prev) =>
      prev.map((g, i) => (i === groupIndex ? { ...g, loading: true } : g))
    );

    try {
      const results = await searchPapersWithRetry(
        concept,
        concept,
        group.offset,
        0
      );

      setSearchResults((prev) =>
        prev.map((g, i) => {
          if (i === groupIndex) {
            return {
              ...g,
              papers: [...g.papers, ...results.papers],
              hasMore: results.hasMore,
              offset: results.nextOffset,
              loading: false,
              retryCount: 0,
            };
          }
          return g;
        })
      );
    } catch (error) {
      console.error(`Load more error for concept "${concept}":`, error);
      setSearchResults((prev) =>
        prev.map((g, i) => (i === groupIndex ? { ...g, loading: false } : g))
      );

      toast({
        title: "Error",
        description: "Failed to load more papers. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (thesis && isNewCollection) {
      performSemanticSearch(thesis);
    } else if (!isNewCollection) {
      router.push("/collections");
    }
  }, [thesis, isNewCollection]);

  const handleJumpToChat = () => {
    router.push("/chat");
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

  const handleSaveToCollection = async () => {
    // Get all papers from all groups
    const allPapers = searchResults.flatMap((group) => group.papers);

    // Filter selected papers with PDF URLs
    const selectedPapersWithPdf = allPapers.filter(
      (paper) => selectedPapers.has(paper.id) && paper.pdfUrl
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
        const response = await fetch(paper.pdfUrl!);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append(
          "pdf",
          blob,
          `${paper.id}_${paper.title.slice(0, 50)}.pdf`
        );

        const uploadResponse = await fetch("http://127.0.0.1:5000/upload_pdf", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload PDF for paper: ${paper.title}`);
        }

        return {
          id: paper.id,
          title: paper.title,
          status: "success",
        };
      } catch (error) {
        console.error(`Error uploading PDF for paper ${paper.title}:`, error);
        return {
          id: paper.id,
          title: paper.title,
          status: "error",
        };
      }
    });

    try {
      const uploadResults = await Promise.all(uploadPromises);
      const successCount = uploadResults.filter(
        (r) => r.status === "success"
      ).length;
      const errorCount = uploadResults.filter(
        (r) => r.status === "error"
      ).length;

      if (successCount > 0) {
        toast({
          title: "Upload Successful",
          description: `Successfully uploaded ${successCount} PDF(s)`,
          variant: "default",
        });
      }

      if (errorCount > 0) {
        toast({
          title: "Upload Partial Failure",
          description: `Failed to upload ${errorCount} PDF(s)`,
          variant: "destructive",
        });
      }

      setSelectedPapers(new Set());
    } catch (error) {
      console.error("Comprehensive upload error:", error);
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading PDFs",
        variant: "destructive",
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
        <svg
          className="animate-spin h-5 w-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
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
      )}
      <span>{uploadLoading ? "Uploading..." : "Save to Collection"}</span>
    </Button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-black text-center mb-8">
          {thesis
            ? `Results for "${decodeURIComponent(thesis)}"`
            : "Search Results"}
        </h1>

        {/* Select All Checkbox */}
        {allPaperIds.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={
                allPaperIds.length > 0 &&
                allPaperIds.every((id) => selectedPapers.has(id))
              }
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm text-gray-700">
              Select All Papers
            </label>
          </div>
        )}

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          searchResults.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                {group.concept} ({group.total} results)
              </h2>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                {group.papers.length > 0 ? (
                  <>
                    {group.papers.map((paper) => (
                      <div
                        key={paper.id}
                        className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50"
                      >
                        <div>
                          <Checkbox
                            checked={selectedPapers.has(paper.id)}
                            onCheckedChange={() =>
                              togglePaperSelection(paper.id)
                            }
                            className="mr-4"
                          />
                        </div>
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
                            <span className="text-sm font-medium text-gray-500">
                              {paper.authors.length > 0
                                ? paper.authors
                                    .map((author) => author.name)
                                    .join(", ")
                                : "Unknown Author"}
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
                                Open PDF
                              </a>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {paper.year}
                        </span>
                      </div>
                    ))}

                    {/* Load More Button */}
                    {group.hasMore && (
                      <div className="flex justify-center p-4">
                        <Button
                          onClick={() =>
                            handleLoadMore(group.concept, groupIndex)
                          }
                          disabled={group.loading}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2"
                        >
                          {group.loading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                              Loading...
                            </div>
                          ) : (
                            "Load More"
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    No results found for this concept.
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
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

          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center space-x-2"
            onClick={handleSaveToCollection}
            disabled={selectedPapers.size === 0 || uploadLoading}
          >
            {uploadLoading ? (
              <svg
                className="animate-spin h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
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
            )}
            <span>{uploadLoading ? "Uploading..." : "Save to Collection"}</span>
          </Button>

          <Button
            variant="outline"
            className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
            onClick={() => router.push("/collections")}
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span>Find more sources</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
