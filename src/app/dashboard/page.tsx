'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { firebaseOperations, Collection } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from './../components/ui/dialog';
import { Button } from './../components/ui/button';
import { Input } from './../components/ui/input';
import { Textarea } from './../components/ui/textarea';

export default function DashboardPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [newCollection, setNewCollection] = useState({ title: '', thesis: '' });
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const loadCollections = async () => {
      const fetchedCollections = await firebaseOperations.getCollections();
      setCollections(fetchedCollections);
    };
    loadCollections();
  }, []);
  
  const handleCitationClick = (collection: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/citations/${collection.id}`);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCollection.title.trim()) return;
    try {
      const newCollectionItem = {
        name: newCollection.title,
        thesis: newCollection.thesis,
        papersCount: 0,
        lastUpdated: Date.now(),
        papers: [],
        userId: '',
      };

      const createdCollection = await firebaseOperations.createCollection(newCollectionItem);
      setCollections([...collections, createdCollection]);

      setNewCollection({ title: '', thesis: '' });
      setIsOpen(false);

      const encodedThesis = encodeURIComponent(newCollection.thesis || newCollection.title);
      router.push(`/library?thesis=${encodedThesis}&newCollection=true`);
    } catch (error) {
      console.error('Error creating collection:', error);
    }
  };

  const handleDeleteClick = (collection: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollectionToDelete(collection);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (collectionToDelete) {
      try {
        await firebaseOperations.deleteCollection(collectionToDelete.id);
        setCollections(collections.filter((collection) => collection.id !== collectionToDelete.id));
        setDeleteDialogOpen(false);
        setCollectionToDelete(null);
      } catch (error) {
        console.error('Error deleting collection:', error);
      }
    }
  };

  const handleCollectionClick = (collection: Collection) => {
    router.push(`/theses/${collection.id}`);
  };

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-8 py-6">
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
                    onChange={(e) =>
                      setNewCollection({ ...newCollection, title: e.target.value })
                    }
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
                    onChange={(e) =>
                      setNewCollection({ ...newCollection, thesis: e.target.value })
                    }
                    placeholder="Enter your research thesis"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Collection</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group relative cursor-pointer"
              onClick={() => handleCollectionClick(collection)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{collection.name}</h3>
                  <span className="text-sm text-gray-500">{collection.papersCount} papers</span>
                </div>
                <div className="relative">
                <button
                  onClick={(e) => toggleMenu(collection.id, e)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6h.01M12 12h.01M12 18h.01"
                    />
                  </svg>
                </button>
                {activeMenu === collection.id && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-md z-10">
                <button
                  onClick={(e) => handleCitationClick(collection, e)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Citation
                </button>
                <button
                  onClick={(e) => handleDeleteClick(collection, e)}
                  className="block px-4 py-2 text-sm text-red-500 hover:bg-gray-100 w-full text-left"
                >
                  Delete
                </button>
              </div>
            )}
                </div>
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this collection? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}