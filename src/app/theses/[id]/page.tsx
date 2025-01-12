'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { firebaseOperations, Collection, Paper } from '@/lib/firebase';
import { Button } from './../../components/ui/button';
import { Search, Trash2, MessageSquare } from 'lucide-react';



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
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!collection) return;

    const filtered = collection.papers.filter(paper => 
      paper.title.toLowerCase().includes(query.toLowerCase()) ||
      paper.authors.some(author => 
        author.name.toLowerCase().includes(query.toLowerCase())
      ) ||
      paper.year.toString().includes(query)
    );

    setFilteredPapers(filtered);
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedPaperIds([]);
  };

  const togglePaperSelection = (paperId: string) => {
    if (selectedPaperIds.includes(paperId)) {
      setSelectedPaperIds(selectedPaperIds.filter(id => id !== paperId));
    } else {
      setSelectedPaperIds([...selectedPaperIds, paperId]);
    }
  };

  const handleBulkDeletePapers = async () => {
    if (!collection) return;
  
    try {
      // Delete papers from Firebase
      await Promise.all(
        selectedPaperIds.map(paperId =>
          firebaseOperations.deletePaperFromCollection(resolvedParams.id, paperId)
        )
      );
  
      // Update both the collection papers and filtered papers
      const updatedPapers = collection.papers.filter(
        paper => !selectedPaperIds.includes(paper.paperId)
      );
  
      // Update collection state
      setCollection({
        ...collection,
        papers: updatedPapers,
        papersCount: updatedPapers.length
      });
  
      // Update filtered papers separately
      setFilteredPapers(updatedPapers);
  
      // Reset selection state
      setSelectMode(false);
      setSelectedPaperIds([]);
    } catch (error) {
      console.error("Error deleting papers:", error);
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!collection) return;
  
    try {
      // Delete from Firebase first
      await firebaseOperations.deletePaperFromCollection(
        resolvedParams.id, 
        paperId
      );
  
      // Update the main collection papers
      const updatedPapers = collection.papers.filter(paper => paper.paperId !== paperId);
  
      // Update collection state with new papers and count
      setCollection({
        ...collection,
        papers: updatedPapers,
        papersCount: updatedPapers.length
      });
  
      // Update filtered papers to match
      setFilteredPapers(prevFiltered => prevFiltered.filter(paper => paper.paperId !== paperId));
    } catch (error) {
      console.error("Error deleting paper:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
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
            <Button onClick={() => router.push('/collections')}>
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
                  d="M12 4v16m8-8H4" 
                />
              </svg>
              Add Paper
            </Button>
            <Button onClick={() => router.push(`/citations/${resolvedParams.id}`)}>
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                />
              </svg>
              Citations
            </Button>
            <Button onClick={() => router.push(`/chat/${resolvedParams.id}`)}>
              <MessageSquare className="w-5 h-5 mr-2" />
              Chat
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
            <Button 
              variant="outline"
              className={`${selectMode ? 'bg-black text-white' : 'bg-white'} hover:bg-gray-500`}
              onClick={toggleSelectMode}
              disabled={filteredPapers.length === 0}
            >
              {selectMode ? 'Cancel Select' : 'Select'}
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
  
        {selectMode && selectedPaperIds.length > 0 && (
          <div className="mb-6 flex justify-end">
    {showBulkDeleteDialog && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-2">Are you sure?</h3>
          <p className="text-gray-600 mb-4">
            This will permanently delete {selectedPaperIds.length} selected papers from your collection.
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowBulkDeleteDialog(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleBulkDeletePapers();
                setShowBulkDeleteDialog(false);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    <Button 
      variant="destructive"
      onClick={() => setShowBulkDeleteDialog(true)}
    >
      Delete Selected ({selectedPaperIds.length})
    </Button>
  </div>
)}

        <div className="mt-8">
          {collection.papersCount === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Papers Yet</h3>
              <p className="text-gray-500 mb-4">Start adding papers to your collection</p>
              <Button onClick={() => router.push('/collections')}>
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
                    d="M12 4v16m8-8H4" 
                  />
                </svg>
                Add your first paper
              </Button>
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {`No papers found matching "${searchQuery}"`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPapers.map((paper: Paper) => (
                <div 
                  key={`${resolvedParams.id}-${paper.paperId}`}
                  className="bg-white rounded-lg p-6 relative group"  
                >
                  {selectMode && (
                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={selectedPaperIds.includes(paper.paperId)}  
                        onChange={() => togglePaperSelection(paper.paperId)}
                      />
                    </div>
                  )}
                  {!selectMode && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {showDeleteDialog === paper.paperId && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-2">Delete Paper</h3>
                            <p className="text-gray-600 mb-4">
                              Are you sure you want to delete "{paper.title}"?
                            </p>
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setShowDeleteDialog(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  handleDeletePaper(paper.paperId);
                                  setShowDeleteDialog(null);
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => setShowDeleteDialog(paper.paperId)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold mb-2">{paper.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    Authors: {paper.authors.map(author => author.name).join(', ')}
                  </p>
                  <p className="text-gray-600 text-sm mb-3">Year: {paper.year}</p>
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
                      {/* Links */}
                      <div className="flex justify-end space-x-4">
                      <button
                          onClick={() => router.push(`/summary/${resolvedParams.id}`)}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}