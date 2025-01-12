"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./../components/ui/button";
import { Input } from "./../components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// Simplified interfaces
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
  type: "Paper" | "Article";
  year: number;
  selected: boolean;
}

export default function CollectionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectAll, setSelectAll] = useState(false);

  const searchPapers = async (query: string, offset: number = 0) => {
    try {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, offset, limit: 10 }),
      });

      if (!response.ok) {
        throw new Error("Failed to search papers");
      }

      const data = await response.json();
      
      // Initialize papers with selected state based on current selectAll value
      return {
        papers: data.papers.map((paper: any) => ({
          ...paper,
          type: "Paper" as const,
          year: paper.year || new Date().getFullYear(),
          selected: selectAll, // Initialize based on selectAll state
        })),
        hasMore: data.hasMore,
        nextOffset: data.nextOffset,
        total: data.total,
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error("Failed to search papers");
    }
  };


  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await searchPapers(searchQuery);
      setSearchResults(data.papers);
      setHasMore(data.hasMore);
      setCurrentOffset(data.nextOffset);
      setTotal(data.total);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const data = await searchPapers(searchQuery, currentOffset);
      setSearchResults(prev => [...prev, ...data.papers]);
      setHasMore(data.hasMore);
      setCurrentOffset(data.nextOffset);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  };

  const togglePaperSelection = (paperId: string, checked: boolean) => {
    setSearchResults(prev => {
      const newResults = prev.map(paper =>
        paper.id === paperId ? { ...paper, selected: checked } : paper
      );
      
      const allSelected = newResults.every(paper => paper.selected);
      setSelectAll(allSelected);
      
      return newResults;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSearchResults(prev =>
      prev.map(paper => ({ ...paper, selected: checked }))
    );
  };

  const selectedCount = searchResults.filter(paper => paper.selected).length;
  const allSelected = searchResults.length > 0 && selectedCount === searchResults.length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex items-center bg-white rounded-full shadow-lg p-2">
            <Input
              type="text"
              placeholder="Search academic papers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 border-none focus:ring-0"
            />
            <Button
              onClick={handleSearch}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full"
            >
              Search
            </Button>
          </div>
        </div>

        
        {/* Results Header */}
        {searchResults.length > 0 && (
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-semibold">
              Results for "{searchQuery}" ({total} papers)
            </h1>
            <div className="flex items-center space-x-2">
            <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                id="select-all"
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
        )}
        
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex justify-center items-center h-32 text-gray-500">
              {searchQuery ? "No papers found" : "Enter a search term"}
            </div>
          ) : (
            <>
              {searchResults.map((paper) => (
                <div 
                  key={paper.id} 
                  className="flex items-center p-4 border-b hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="mr-4">
                    <Checkbox
                      checked={paper.selected}
                      onCheckedChange={(checked) => togglePaperSelection(paper.id, checked as boolean)}
                      id={`paper-${paper.id}`}
                    />
                </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-sm text-gray-500">
                        {paper.authors.map(a => a.name).join(", ")}
                      </span>
                      <span className="ml-3 px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                        {paper.type}
                      </span>
                    </div>
                    <h3 className="text-gray-900">{paper.title}</h3>
                    <div className="flex gap-4 mt-1">
                      <a href={paper.url} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-500 text-sm hover:underline">
                        Open paper
                      </a>
                      {paper.pdfUrl && (
                        <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer"
                           className="text-blue-500 text-sm hover:underline">
                          Download PDF
                        </a>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{paper.year}</span>
                </div>
              ))}

              {hasMore && (
                <div className="flex justify-center p-4">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    {loadingMore ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={() => {/* Handle save */}}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={selectedCount === 0}
          >
            Save to Collection ({selectedCount})
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/chat")}
            className="border border-blue-500 text-blue-500 hover:bg-blue-50"
          >
            Jump to Chat
          </Button>
        </div>
      </div>
    </div>
  );
}