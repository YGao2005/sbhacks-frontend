// src/app/collections/search-api.ts or src/lib/search-api.ts

export interface Paper {
    id: number;
    author: string;
    type: 'Paper' | 'Article';
    title: string;
    year: number;
    selected?: boolean;
  }
  
  // Simulate an API response
  export const searchPapers = async (query: string): Promise<Paper[]> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
  
    // If no query is provided (initial load), return an empty array
    if (!query) {
      return [];
    }
  
    // Mock search logic - in a real app, this would be an actual API call
    const allPapers: Paper[] = [
      // ... your existing paper data ...
    ];
  
    // Filter papers based on query (case-insensitive)
    return allPapers.filter(paper => 
      paper.title.toLowerCase().includes(query.toLowerCase()) ||
      paper.author.toLowerCase().includes(query.toLowerCase())
    );
  };