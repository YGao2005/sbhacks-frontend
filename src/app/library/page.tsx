'use client';

import { useState, useEffect } from 'react';
import { Button } from "./../components/ui/button";
import { Checkbox } from "./../components/ui/checkbox";

interface Paper {
  id: number;
  author: string;
  type: 'Paper' | 'Article';
  title: string;
  year: number;
  selected?: boolean;
}

interface SearchParams {
  thesis: string;
  page?: number;
}

export default function LibraryPage() {
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPapers, setSelectedPapers] = useState<Set<number>>(new Set());

  // In a real application, you would get this from your router or state management
  const currentThesis = "The effects of smoking on public health";

  // Simulate a search API call
  const searchPapers = async (params: SearchParams) => {
    setLoading(true);
    try {
      // This is where you would make an actual API call
      // For now, we'll simulate it with mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      // Mock results - replace this with your actual API call
      const mockResults: Paper[] = [
        { id: 1, author: "Jullu Jalal", type: "Paper", title: "The health consequences of smoking: a report of Surgeon General", year: 2019 },
        { id: 2, author: "Minerva Barnett", type: "Article", title: "Systemic effects of smoking", year: 2007 },
        { id: 3, author: "Peter Lewis", type: "Paper", title: "Smoking and gender", year: 2012 },
        { id: 4, author: "Anthony Briggs", type: "Article", title: "Uncovering the effects of smoking: historical perspective", year: 2019 },
        { id: 5, author: "Clifford Morgan", type: "Article", title: "Smoking and passive smoking in Chinese, 2002", year: 2011 },
        { id: 6, author: "Cecilia Webster", type: "Paper", title: "Mortality from smoking worldwide", year: 2010 },
        { id: 7, author: "Harvey Manning", type: "Paper", title: "The economics of smoking", year: 2024 },
        { id: 8, author: "Willie Blake", type: "Article", title: "Smoking, smoking cessation, and major depression", year: 2022 },
        { id: 9, author: "Minerva Barnett", type: "Paper", title: "Smoking and reproduction", year: 2023 }
      ];

      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error searching papers:', error);
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  };

  // Initial search when component mounts
  useEffect(() => {
    if (currentThesis) {
      searchPapers({ thesis: currentThesis });
    }
  }, [currentThesis]);

  const togglePaperSelection = (paperId: number) => {
    setSelectedPapers(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(paperId)) {
        newSelection.delete(paperId);
      } else {
        newSelection.add(paperId);
      }
      return newSelection;
    });
  };

  const handleSaveToCollection = () => {
    const selectedPapersData = searchResults.filter(paper => 
      selectedPapers.has(paper.id)
    );
    console.log('Saving papers to collection:', selectedPapersData);
    // Implement your save logic here
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-8">
          Results for your thesis
        </h1>

        {/* Results List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
        <div className="flex justify-between items-center text-blue-500">
          <Button 
            variant="outline" 
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 transition-colors duration-200"
            onClick={() => {/* Implement chat functionality */}}
          >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        <span>Jump to Chat</span>
          </Button>

          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center space-x-2 transition-colors duration-200"
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
            onClick={() => {/* Implement find more sources */}}
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