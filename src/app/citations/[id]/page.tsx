'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { firebaseOperations, Collection, Paper } from '@/lib/firebase';
import { Button } from './../../components/ui/button';
import { Checkbox } from './../../components/ui/checkbox';

type PaperWithSelection = Paper & { selected: boolean };

export default function CitationPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [papers, setPapers] = useState<PaperWithSelection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollectionAndPapers = async () => {
      if (collectionId) {
        try {
          const fetchedCollection = await firebaseOperations.getCollection(collectionId);
          setCollection(fetchedCollection);
          const fetchedPapers = await firebaseOperations.getPapersForCollection(collectionId);
          setPapers(fetchedPapers.map(paper => ({ ...paper, selected: false })));
        } catch (error) {
          console.error('Error fetching collection or papers:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchCollectionAndPapers();
  }, [collectionId]);

  const handleCheckboxChange = (index: number) => {
    setPapers(papers.map((paper, i) => 
      i === index ? { ...paper, selected: !paper.selected } : paper
    ));
  };

  const handleGenerateCitations = () => {
    const selectedPapers = papers.filter(paper => paper.selected);
    // Implement citation generation logic here
    console.log('Generating citations for:', selectedPapers);
    // You might want to update the state to show the generated citations
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!collection) {
    return <div className="flex justify-center items-center h-screen">Collection not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Citations for "{collection.name}" Collection</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {papers.map((paper, index) => (
              <tr key={paper.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Checkbox
                    checked={paper.selected}
                    onCheckedChange={() => handleCheckboxChange(index)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{paper.author}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    paper.type === 'Paper' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {paper.type}
                  </span>
                </td>
                <td className="px-6 py-4">{paper.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{paper.year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex justify-center">
        <Button onClick={handleGenerateCitations} className="bg-blue-500 text-white">
          Generate Selected Citations
        </Button>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Your citations</h2>
        {/* Add generated citations here */}
      </div>
    </div>
  );
}