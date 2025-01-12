"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "./../components/ui/button";
import { Checkbox } from "./../components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // Adjust this import based on your Firebase setup

interface Paper {
  paperId: string;
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
}

// Add this function at the top of your file
const generateUniqueId = () => {
  // Use crypto.randomUUID() if available, otherwise fallback to a simple implementation
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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
  const [isSaving, setIsSaving] = useState(false);

  const thesis = searchParams.get("thesis");
  const isNewCollection = searchParams.get("newCollection") === "true";
  const collectionId = searchParams.get("collectionId");

  // Helper function to add delay between calls
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

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
      console.log("Data:", data);
      const parsedResponse = JSON.parse(
        data.response.replace("```json\n", "").replace("\n```", "")
      );
      return parsedResponse.main_concepts;
    } catch (error) {
      console.error("Error getting semantic parts:", error);
      throw error;
    }
  };

  const searchPapers = async (
    searchQuery: string,
    concept: string
  ): Promise<SearchResultGroup> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
  
    try {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
        signal: controller.signal,
      });
  
      clearTimeout(timeout);
  
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        throw new Error(`Error searching papers: ${response.statusText}`);
      }
  
      const data = await response.json();
  
      if (!data.papers || data.papers.length === 0) {
        return {
          concept,
          papers: [],
          total: 0,
        };
      }
  
      const results: Paper[] = data.papers.map((paper: any) => ({
        paperId: generateUniqueId(), // Generate unique ID here
        authors: paper.authors || [],
        url: paper.url,
        type: "Paper",
        title: paper.title,
        year: paper.year,
        pdfUrl: paper.pdfUrl,
      }));
  
      return {
        concept,
        papers: results,
        total: data.total || results.length,
      };
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        throw new Error("Request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  };

  const performSemanticSearch = async (mainQuery: string) => {
    console.log("Performing semantic search for:", mainQuery);
    setLoading(true);
    setError(null);
    setSearchResults([]); // Clear existing results

    try {
      // Get semantic parts
      const concepts = await getSemanticParts(mainQuery);
      let successfulSearches = 0;
      const maxRetries = 3; // Maximum number of retries per concept
      const minSuccessfulResults = 2; // Minimum number of successful results needed

      // Process concepts in parallel with retries
      const searchPromises = concepts.map(async (concept) => {
        let retryCount = 0;
        let result: SearchResultGroup | null = null;

        while (retryCount < maxRetries && !result) {
          try {
            if (retryCount > 0) {
              // Add exponential backoff delay for retries
              await delay(1000 * Math.pow(2, retryCount));
            }

            result = await searchPapers(concept, concept);

            if (result.papers.length > 0) {
              successfulSearches++;
              // Update UI immediately when we get a successful result
              setSearchResults((prev) => [...prev, result!]);
            }
          } catch (error) {
            console.error(
              `Attempt ${retryCount + 1} failed for concept "${concept}":`,
              error
            );
            retryCount++;

            // If it's the last retry, return an empty result
            if (retryCount === maxRetries) {
              result = {
                concept,
                papers: [],
                total: 0,
              };
            }
          }
        }

        return result;
      });

      // Wait for all searches to complete or until we have enough results
      const results = await Promise.all(searchPromises);

      // Filter out null results and sort by number of papers
      const validResults = results
        .filter((r): r is SearchResultGroup => r !== null)
        .sort((a, b) => b.papers.length - a.papers.length);

      // Update the final results
      setSearchResults(validResults);

      // Show warning if we didn't get enough results
      if (successfulSearches < minSuccessfulResults) {
        toast({
          title: "Limited Results",
          description: "Some results couldn't be loaded. Try again later.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Comprehensive search error:", error);
      setError(
        `Search failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setSearchResults([]);
    } finally {
      setLoading(false);
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

  const togglePaperSelection = (id: string) => {
    setSelectedPapers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Add this function inside your LibraryPage component
  const handleSaveToCollection = async () => {
    if (!collectionId || selectedPapers.size === 0) {
      toast({
        title: "No papers selected",
        description: "Please select at least one paper to save",
        variant: "destructive",
      });
      return;
    }
  
    setIsSaving(true);
    setUploadLoading(true);
  
    try {
      const collectionRef = doc(db, "collections", collectionId);
      const collectionSnap = await getDoc(collectionRef);
  
      if (!collectionSnap.exists()) {
        throw new Error("Collection not found");
      }
  
      const papersToAdd = searchResults
        .flatMap((group) => group.papers)
        .filter((paper) => selectedPapers.has(paper.paperId));
  
      // Start both operations concurrently
      const [collectionUpdate, pdfUploads] = await Promise.allSettled([
        // Update Firebase collection
        updateDoc(collectionRef, {
          papers: arrayUnion(...papersToAdd),
          papersCount: increment(papersToAdd.length),
          lastUpdated: Date.now(),
        }),
  
        // Upload PDFs in parallel
        Promise.all(
          papersToAdd.map(async (paper) => {
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
                  error: error instanceof Error ? error.message : 'Unknown error',
                };
              }
            }
            return {
              paperId: paper.paperId,
              status: 'skipped',
              message: 'No PDF URL available',
            };
          })
        ),
      ]);
  
      // Handle collection update result
      if (collectionUpdate.status === 'fulfilled') {
        toast({
          title: "Papers saved successfully!",
          description: (
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{`Added ${papersToAdd.length} paper${
                papersToAdd.length === 1 ? "" : "s"
              } to your collection`}</span>
            </div>
          ),
          duration: 3000,
        });
      }
  
      // Handle PDF upload results
      if (pdfUploads.status === 'fulfilled') {
        const uploads = pdfUploads.value;
        const failedUploads = uploads.filter(result => result.status === 'error');
        
        if (failedUploads.length > 0) {
          toast({
            title: "Some PDFs failed to upload",
            description: `${failedUploads.length} PDF${
              failedUploads.length === 1 ? "" : "s"
            } failed to upload`,
            variant: "default",
          });
        }
      }
  
      // Add a slight delay before redirect for better UX
      setTimeout(() => {
        router.push("/collections");
      }, 1000);
  
    } catch (error) {
      console.error("Error saving to collection:", error);
      toast({
        title: "Error saving papers",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save papers to collection",
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
      setIsSaving(false);
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
      <span>{uploadLoading ? "Uploading..." : "Save to Collection "}</span>
    </Button>
  );

  const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
    const getTypeStyle = (type: string) => {
      const styles = {
        article: {
          background: "bg-blue-100",
          text: "text-blue-800",
        },
        libguides: {
          background: "bg-purple-100",
          text: "text-purple-800",
        },
        dataset: {
          background: "bg-green-100",
          text: "text-green-800",
        },
        preprint: {
          background: "bg-yellow-100",
          text: "text-yellow-800",
        },
        dissertation: {
          background: "bg-red-100",
          text: "text-red-800",
        },
        book: {
          background: "bg-indigo-100",
          text: "text-indigo-800",
        },
        review: {
          background: "bg-pink-100",
          text: "text-pink-800",
        },
        other: {
          background: "bg-gray-100",
          text: "text-gray-800",
        },
      };

      const normalizedType = type.toLowerCase();
      const style =
        styles[normalizedType as keyof typeof styles] || styles.other;

      return `${style.background} ${style.text}`;
    };

    return (
      <span
        className={`px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100
          text-blue-800 ${getTypeStyle(
          type
        )}`}
      >
        {type}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-black text-center mb-8">
          {thesis
            ? `Results for "${decodeURIComponent(thesis)}"`
            : "Search Results"}
        </h1>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </motion.div>
        )}

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
              transition={{ staggerChildren: 0.1 }}
            >
              {searchResults.map((group, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8"
                >
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    {group.concept} ({group.total} results)
                  </h2>
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                    {group.papers.length > 0 ? (
                      group.papers.map((paper) => (
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
                                  {paper.authors.length > 0
                                    ? paper.authors
                                        .map((author) => author.name)
                                        .join(", ")
                                    : "Unknown Author"}
                                </span>

                                {/* Year */}
                                <span className="text-sm text-gray-500">
                                  ({paper.year})
                                </span>

                                {/* Type Badge */}
                                <TypeBadge type={paper.type} />
                              </div>

                              {/* Links */}
                              <div className="flex items-center space-x-4">
                                {paper.url && (
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
                                )}
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
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center p-8 text-gray-500"
                      >
                        No results found for this concept.
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
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

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              className={`bg-blue-500 hover:bg-blue-600 text-white flex items-center space-x-2 transition-all duration-200 ${
                isSaving ? "opacity-75" : ""
              }`}
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
              <span>{uploadLoading ? "Analyzing Paper..." : "Save to Collection"}</span>
            </Button>
          </motion.div>

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
        </motion.div>
      </div>
    </div>
  );
}
