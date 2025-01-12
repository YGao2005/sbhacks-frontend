'use client';

import { useState, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { firebaseOperations, Collection } from '@/lib/firebase';
import Link from 'next/link';

export default function ChatPage() {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const fetchedCollections = await firebaseOperations.getCollections();
        setCollections(fetchedCollections);
      } catch (error) {
        console.error('Error fetching collections:', error);
      }
    };

    fetchCollections();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4">
          <Button 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => {/* Handle new chat */}}
          >
            + New Chat
          </Button>
        </div>
        
        {/* Collections Section */}
        <div className="px-4 py-2">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Collections</h3>
          <div className="space-y-2">
            {collections.map((collection) => (
              <Link 
                key={collection.id}
                href={`/chat/${collection.id}`}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-700">{collection.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Select a collection to start chatting</h2>
      </div>
    </div>
  );
}