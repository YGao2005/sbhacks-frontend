'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { firebaseOperations, Collection, Paper } from '@/lib/firebase';
import { Button } from './../../components/ui/button';
import { Checkbox } from './../../components/ui/checkbox';

type CitationFormat = 'APA' | 'MLA' | 'Chicago';

const generateAPACitation = (paper: Paper): string => {
  const authors = paper.authors.map(author => {
    const nameParts = author.name.split(' ');
    const lastName = nameParts.pop();
    const initials = nameParts.map(name => `${name[0]}.`).join(' ');
    return `${lastName}, ${initials}`;
  }).join(', ');

  return `${authors} (${paper.year}). ${paper.title}. Retrieved from ${paper.url}`;
};

const generateMLACitation = (paper: Paper): string => {
  const authors = paper.authors.map(author => {
    const nameParts = author.name.split(' ');
    const lastName = nameParts.pop();
    const firstName = nameParts.join(' ');
    return `${lastName}, ${firstName}`;
  }).join(', and ');

  return `${authors}. "${paper.title}." ${paper.year}. ${paper.url}`;
};

const generateChicagoCitation = (paper: Paper): string => {
  const authors = paper.authors.map(author => {
    const nameParts = author.name.split(' ');
    const lastName = nameParts.pop();
    const firstName = nameParts.join(' ');
    return `${lastName}, ${firstName}`;
  }).join(', and ');

  return `${authors}. "${paper.title}." ${paper.year}. ${paper.url}.`;
};

export default function CitationPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [citationFormat, setCitationFormat] = useState<CitationFormat>('APA');
  const [generatedCitations, setGeneratedCitations] = useState<string[]>([]);

  useEffect(() => {
    const fetchCollectionAndPapers = async () => {
      if (collectionId) {
        try {
          const fetchedCollection = await firebaseOperations.getCollection(collectionId);
          setCollection(fetchedCollection);
          const fetchedPapers = fetchedCollection?.papers || [];
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
    let citations: string[] = [];
    
    switch (citationFormat) {
      case 'APA':
        citations = selectedPapers.map(generateAPACitation);
        break;
      case 'MLA':
        citations = selectedPapers.map(generateMLACitation);
        break;
      case 'Chicago':
        citations = selectedPapers.map(generateChicagoCitation);
        break;
    }
    
    setGeneratedCitations(citations);
  };

  const handleCopyCitations = () => {
    const citationText = generatedCitations.join('\n\n');
    navigator.clipboard.writeText(citationText);
  };

  const handleFormatChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCitationFormat(event.target.value as CitationFormat);
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author(s)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {papers.map((paper, index) => {
              const authorText = paper.authors
                .map(author => author.name)
                .join(', ');
              
              return (
                <tr key={`paper-${paper.paperId || `index-${index}`}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={paper.selected}
                      onCheckedChange={() => handleCheckboxChange(index)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative group">
                      <div className="max-w-xs truncate">
                        {authorText}
                      </div>
                      <div className="hidden group-hover:block absolute z-10 w-96 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg top-0 left-full ml-2">
                        {authorText}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      paper.type === 'Paper' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {paper.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-md truncate">{paper.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{paper.year}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex justify-center items-center gap-4">
        <select 
          value={citationFormat}
          onChange={handleFormatChange}
          className="px-4 py-2 border rounded-md bg-white"
        >
          <option value="APA">APA</option>
          <option value="MLA">MLA</option>
          <option value="Chicago">Chicago</option>
        </select>
        <Button 
          onClick={handleGenerateCitations}
          className="bg-blue-500 text-white"
        >
          Generate Citations
        </Button>
      </div>
      {generatedCitations.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your citations</h2>
            <Button
              onClick={handleCopyCitations}
              variant="outline"
              className="text-sm"
            >
              Copy All
            </Button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            {generatedCitations.map((citation, index) => (
              <p key={`citation-${index}`} className="mb-4 last:mb-0">
                {citation}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}