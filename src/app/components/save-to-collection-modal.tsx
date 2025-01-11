import { useState } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';

interface Paper {
  id: number;
  author: string;
  type: 'Paper' | 'Article';
  title: string;
  year: number;
  selected?: boolean;
}

interface Collection {
  id: number;
  name: string;
}

interface CollectionSelectModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (selectedCollections: Collection[], papers: Paper[]) => void; // Now accepting papers in onSave
  papers: Paper[]; // papers is correctly typed as Paper[]
}

export const CollectionSelectModal: React.FC<CollectionSelectModalProps> = ({
  isOpen,
  onOpenChange,
  onSave,
  papers,
}) => {
  const [collections, setCollections] = useState<Collection[]>([
    { id: 1, name: 'Research Papers' },
    { id: 2, name: 'Reading List' },
    { id: 3, name: 'Favorites' },
  ]);
  const [selectedCollections, setSelectedCollections] = useState<Set<number>>(new Set());

  const handleCollectionToggle = (collectionId: number) => {
    setSelectedCollections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    const collectionsToSave = collections.filter((collection) =>
      selectedCollections.has(collection.id)
    );
    onSave(collectionsToSave, papers); // Pass papers along with selected collections to onSave
    onOpenChange(false); // Close the form after saving
  };

  if (!isOpen) return null; // Don't render anything if modal is not open

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 max-w-lg mx-auto rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Save Papers to Collection</h2>
        <div className="mb-4">
          <h3 className="text-lg font-medium">Select Collections</h3>
          <div className="space-y-2 mt-2">
            {collections.map((collection) => (
              <div key={collection.id} className="flex items-center">
                <Checkbox
                  checked={selectedCollections.has(collection.id)}
                  onCheckedChange={() => handleCollectionToggle(collection.id)}
                />
                <span className="ml-2">{collection.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            onClick={() => onOpenChange(false)} // Close the form when canceled
            className="bg-gray-500 text-white px-6 py-2 hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedCollections.size === 0} // Disable if no collections are selected
            className="bg-blue-500 text-white px-6 py-2 hover:bg-blue-600 disabled:opacity-50"
          >
            Save to Selected Collections
          </Button>
        </div>
      </div>
    </div>
  );
};
