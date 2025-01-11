'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./../components/ui/dialog";
import { Button } from "./../components/ui/button";
import { Input } from "./../components/ui/input";
import { Textarea } from "./../components/ui/textarea";

interface Collection {
  id: string;
  name: string;
  thesis?: string;
  papersCount: number;
  lastUpdated: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [newCollection, setNewCollection] = useState({ title: '', thesis: '' });
  const [collections, setCollections] = useState<Collection[]>([]);

  // Load collections from local storage on component mount
  useEffect(() => {
    const storedCollections = localStorage.getItem('collections');
    if (storedCollections) {
      setCollections(JSON.parse(storedCollections));
    }
  }, []);

  // Update local storage whenever collections change
  useEffect(() => {
    localStorage.setItem('collections', JSON.stringify(collections));
  }, [collections]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCollection.title.trim()) return;
  
    const newId = (collections.length + 1).toString();
    const newCollectionItem = {
      id: newId,
      name: newCollection.title,
      thesis: newCollection.thesis,
      papersCount: 0,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  
    setCollections([...collections, newCollectionItem]);
  
    setNewCollection({ title: '', thesis: '' });
    setIsOpen(false);
    
    // Navigate to library with the thesis for searching
    const encodedThesis = encodeURIComponent(newCollection.thesis || newCollection.title);
    router.push(`/library?thesis=${encodedThesis}&newCollection=true`);
  };

  const handleDeleteClick = (collection: Collection) => {
    setCollectionToDelete(collection);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (collectionToDelete) {
      setCollections(collections.filter(collection => collection.id !== collectionToDelete.id));
      setDeleteDialogOpen(false);
      setCollectionToDelete(null);
    }
  };

  const handleCollectionClick = (collection: Collection) => {
    // For existing collections, we'll show their contents
    router.push(`/collection/${collection.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                  />
                </svg>
                New Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Collection</DialogTitle>
                <DialogDescription>
                  Add a new collection to organize your research papers.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="title"
                    value={newCollection.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCollection({
                      ...newCollection,
                      title: e.target.value
                    })}
                    placeholder="Enter collection title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="thesis" className="text-sm font-medium">
                    Thesis
                  </label>
                  <Textarea
                    id="thesis"
                    value={newCollection.thesis}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewCollection({
                      ...newCollection,
                      thesis: e.target.value
                    })}
                    placeholder="Enter your research thesis"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Collection</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Collection</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{collectionToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div 
              key={collection.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group cursor-pointer"
              onClick={() => handleCollectionClick(collection)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{collection.name}</h3>
                  <span className="text-sm text-gray-500">{collection.papersCount} papers</span>
                </div>
                <button
                  onClick={() => handleDeleteClick(collection)}
                  className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                    />
                  </svg>
                </button>
              </div>
              {collection.thesis && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{collection.thesis}</p>
              )}
              <div className="text-sm text-gray-500">
                Last updated {new Date(collection.lastUpdated).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {collections.length === 0 && (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="bg-gray-100 rounded-full p-4 mb-4">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Collections Yet</h3>
            <p className="text-gray-500 text-center max-w-sm">
              Create your first collection to start organizing your research papers
            </p>
          </div>
        )}
      </main>
    </div>
  );
}