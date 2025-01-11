'use client';

import { useState } from 'react';

interface SearchResult {
  id: number;
  author: string;
  type: 'Paper' | 'Article';
  title: string;
  year: number;
  selected?: boolean;
}

const SearchResultsPage = () => {
  const [results] = useState<SearchResult[]>([
    { id: 1, author: "Jullu Jalal", type: "Paper", title: "The health consequences of smoking: a report of Surgeon General", year: 2019, selected: true },
    { id: 2, author: "Minerva Barnett", type: "Article", title: "Systemic effects of smoking", year: 2007, selected: true },
    { id: 3, author: "Peter Lewis", type: "Paper", title: "Smoking and gender", year: 2012 },
    { id: 4, author: "Anthony Briggs", type: "Article", title: "Uncovering the effects of smoking: historical perspective", year: 2019, selected: true },
    { id: 5, author: "Clifford Morgan", type: "Article", title: "Smoking and passive smoking in Chinese, 2002", year: 2011 },
    { id: 6, author: "Cecilia Webster", type: "Paper", title: "Mortality from smoking worldwide", year: 2010 },
    { id: 7, author: "Harvey Manning", type: "Paper", title: "The economics of smoking", year: 2024 },
    { id: 8, author: "Willie Blake", type: "Article", title: "Smoking, smoking cessation, and major depression", year: 2022 },
    { id: 9, author: "Minerva Barnett", type: "Paper", title: "Smoking and reproduction", year: 2023, selected: true }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Search Bar */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white rounded-full shadow-lg flex items-center p-2">
          <button className="p-2 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <input
            type="text"
            placeholder="Find a paper or article"
            className="flex-1 px-4 py-2 outline-none"
          />
          <div className="flex items-center space-x-2 px-2">
            <button className="p-2 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button className="p-2 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button className="bg-blue-500 p-2 rounded-full text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results Title */}
      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="text-2xl font-semibold text-center">Results for "Smoking"</h1>
      </div>

      {/* Results List */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        {results.map((result) => (
          <div key={result.id} className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50">
            <input
              type="checkbox"
              checked={result.selected}
              className="h-4 w-4 text-blue-500 rounded border-gray-300 mr-4"
            />
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <span className="text-sm font-medium">{result.author}</span>
                <span className={`ml-3 px-2 py-1 text-xs rounded ${
                  result.type === 'Paper' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {result.type}
                </span>
              </div>
              <h3 className="text-gray-900">{result.title}</h3>
            </div>
            <span className="text-sm text-gray-500">{result.year}</span>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="max-w-4xl mx-auto flex justify-center">
        <button className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          <span>Save to "Smoking" Collection</span>
        </button>
      </div>
    </div>
  );
};

export default SearchResultsPage;