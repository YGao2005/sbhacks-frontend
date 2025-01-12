'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { firebaseOperations, Collection, Paper } from '@/lib/firebase';
import { Button } from './../../components/ui/button';
import { Search, Trash2 } from 'lucide-react';

export default function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const collectionData = await firebaseOperations.getCollection(resolvedParams.id);
        if (collectionData) {
          setCollection(collectionData);
          setFilteredPapers(collectionData.papers);
        } else {
          console.log("No such collection!");
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching collection:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [resolvedParams.id, router]);

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!collection) return;

    // Filter papers based on title, authors, or year
    const filtered = collection.papers.filter(paper => 
      paper.title.toLowerCase().includes(query.toLowerCase()) ||
      paper.authors.some(author => 
        author.name.toLowerCase().includes(query.toLowerCase())
      ) ||
      paper.year.toString().includes(query)
    );

    setFilteredPapers(filtered);
  };

  // Delete paper functionality
  const handleDeletePaper = async (paperId: string) => {
    if (!collection) return;

    try {
      // Call Firebase operation to delete paper from collection
      await firebaseOperations.deletePaperFromCollection(
        resolvedParams.id, 
        paperId
      );

      // Update local state
      const updatedPapers = filteredPapers.filter(paper => paper.paperId !== paperId);
      setFilteredPapers(updatedPapers);
      
      // If the collection is also updated in the parent state, update it
      if (collection) {
        setCollection({
          ...collection,
          papers: updatedPapers
        });
      }
    } catch (error) {
      console.error("Error deleting paper:", error);
      // Optionally, show an error toast or alert to the user
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-gray-600 mb-4 hover:text-gray-900"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </button>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{collection.name}</h1>
            <p className="text-sm text-gray-500">Last updated {new Date(collection.lastUpdated).toLocaleDateString()}</p>
          </div>
          <div className="space-x-4">
            <Button className="bg-black text-white hover:bg-gray-800">
              Add Paper
            </Button>
            <Button className="bg-black text-white hover:bg-gray-800">
              Citations
            </Button>
          </div>
        </div>

        {collection.thesis && (
          <div className="mt-6 bg-white rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">Research Thesis</h2>
            <p className="text-gray-600">{collection.thesis}</p>
          </div>
        )}
      </div>

      {/* Papers Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Papers ({filteredPapers.length})</h2>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="bg-black text-white hover:bg-gray-800">
              Select
            </Button>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search papers..." 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
              <Search className="absolute left-2 top-3 w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {filteredPapers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {collection.papers.length === 0 
                ? "No papers added yet" 
                : `No papers found matching "${searchQuery}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPapers.map((paper: Paper) => (
              <div key={paper.paperId} className="bg-white rounded-lg p-6 relative group">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDeletePaper(paper.paperId)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-lg font-semibold mb-2">{paper.title}</h3>
                <p className="text-gray-600 text-sm mb-2">
                  Authors: {paper.authors.map(author => author.name).join(', ')}
                </p>
                <p className="text-gray-600 text-sm mb-3">Year: {paper.year}</p>
                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  {paper.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}