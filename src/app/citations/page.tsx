'use client';

import { useState } from 'react';
import { Button } from "./../components/ui/button";

interface Citation {
  id: string;
  author: string;
  type: 'Paper' | 'Article';
  title: string;
  year: number;
  selected?: boolean;
}

export default function CitationsPage() {
  const [citations, setCitations] = useState<Citation[]>([
    {
      id: '1',
      author: 'Jullu Jalat',
      type: 'Paper',
      title: 'The health consequences of smoking: a report of Surgeon General',
      year: 2019,
      selected: true,
    },
    {
      id: '2',
      author: 'Minerva Barnett',
      type: 'Article',
      title: 'Systemic effects of smoking',
      year: 2007,
      selected: true,
    },
    {
      id: '3',
      author: 'Peter Lewis',
      type: 'Paper',
      title: 'Smoking and gender',
      year: 2012,
      selected: false,
    },
    {
      id: '4',
      author: 'Anthony Briggs',
      type: 'Article',
      title: 'Uncovering the effects of smoking: historical perspective',
      year: 2019,
      selected: true,
    },
    {
      id: '5',
      author: 'Clifford Morgan',
      type: 'Article',
      title: 'Smoking and passive smoking in Chinese, 2002',
      year: 2011,
      selected: false,
    },
    {
      id: '6',
      author: 'Cecilia Webster',
      type: 'Paper',
      title: 'Mortality from smoking worldwide',
      year: 2010,
      selected: false,
    },
    {
      id: '7',
      author: 'Harvey Manning',
      type: 'Paper',
      title: 'The economics of smoking',
      year: 2024,
      selected: false,
    },
    {
      id: '8',
      author: 'Willie Blake',
      type: 'Article',
      title: 'Smoking, smoking cessation, and major depression',
      year: 2022,
      selected: false,
    },
    {
      id: '9',
      author: 'Minerva Barnett',
      type: 'Paper',
      title: 'Smoking and reproduction',
      year: 2023,
      selected: true,
    },
  ]);

  const handleToggleSelection = (id: string) => {
    setCitations(prevCitations => 
      prevCitations.map(citation => 
        citation.id === id ? { ...citation, selected: !citation.selected } : citation
      )
    );
  };

  const handleGenerateSelectedCitations = () => {
    // Logic to generate selected citations
    console.log('Generating selected citations...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-8 py-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Citations for "Smoking" Collection</h1>

        <div className="space-y-4">
          {citations.map(citation => (
            <div
              key={citation.id}
              className="flex items-center bg-white p-4 rounded-md shadow-sm"
            >
              <input
                type="checkbox"
                checked={citation.selected}
                onChange={() => handleToggleSelection(citation.id)}
                className="mr-4"
              />
              <div>
                <p className="font-medium">{citation.author}</p>
                <p className="text-sm text-gray-500">{citation.title}</p>
                <p className="text-sm text-gray-500">{citation.type} - {citation.year}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Button onClick={handleGenerateSelectedCitations}>Generate Selected Citations</Button>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Your citations</h2>
          {/* Placeholder for generated citations */}
        </div>
      </main>
    </div>
  );
}