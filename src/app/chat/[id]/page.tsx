'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { firebaseOperations, Collection, Paper } from '@/lib/firebase';
import { Button } from "./../../components/ui/button";
import { Textarea } from "./../../components/ui/textarea";
import { motion, AnimatePresence } from 'framer-motion'; // Add this import

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isUser: boolean;
}

interface Chart {
  id: string;
  title: string;
}

const ChatPage = () => {
  const params = useParams();
  const collectionId = params.id as string;
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [charts] = useState<Chart[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [collection, setCollection] = useState<Collection | null>(null);

  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        if (collectionId) {
          const [fetchedCollection, fetchedPapers] = await Promise.all([
            firebaseOperations.getCollection(collectionId),
            firebaseOperations.getPapersForCollection(collectionId)
          ]);
          
          setCollection(fetchedCollection);
          setPapers(fetchedPapers);
        }
      } catch (error) {
        console.error('Error fetching collection data:', error);
      }
    };

    fetchCollectionData();
  }, [collectionId]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase(),
      isUser: true
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handlePaperClick = (paperId: string) => {
    router.push(`/chat/${collectionId}/${paperId}`);
  };

  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Compact Sidebar */}
      <motion.aside 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-72 bg-white rounded-xl border border-gray-200 h-5/6 flex flex-col shadow-lg overflow-hidden"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-md font-semibold text-gray-900">Resources</h3>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Papers Section */}
          <div className="p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2 px-2">Papers</h4>
            <div className="space-y-1">
              {papers.map((paper) => (
                <motion.div 
                  key={paper.paperId}
                  {...fadeIn}
                  transition={{ duration: 0.2 }}
                  className="flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors duration-200"
                  onClick={() => handlePaperClick(paper.paperId)}
                >
                  <svg 
                    className="w-4 h-4 text-gray-500 mr-2"
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
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 truncate">{paper.title}</h5>
                    <p className="text-xs text-gray-500">{paper.year}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Charts Section */}
          <div className="p-3 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2 px-2">Charts</h4>
            <div className="space-y-1">
              {charts.map((chart) => (
                <div 
                  key={chart.id}
                  className="flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors duration-200"
                >
                  <svg 
                    className="w-4 h-4 text-gray-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                  <span className="text-sm text-gray-900 truncate">{chart.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Chat Area */}
      <main className="h-5/6 flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">

        {/* Compact Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center shadow-sm">
          <button 
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
            onClick={() => router.push('/chat')}
          >
            <svg 
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="ml-3 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {collection?.name || 'Loading...'}
            </h2>
            {collection?.thesis && (
              <p className="text-sm text-gray-500 truncate">{collection.thesis}</p>
            )}
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div 
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-2xl rounded-lg p-3 ${
                  message.isUser 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                } shadow-sm`}
                >
                  <p className="text-sm">{message.content}</p>
                  <time className={`text-xs mt-1 block ${
                    message.isUser ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp}
                  </time>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Compact Input Area */}
        <footer className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-end space-x-3 max-w-4xl mx-auto">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 min-h-[2.5rem] max-h-28 resize-none rounded-md focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors duration-200 flex items-center"
              onClick={handleSendMessage}
            >
              Send
              <svg 
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Button>
          </div>
        </footer>
      </main>
    </div>
  );
};


export default ChatPage;