'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { firebaseOperations, Paper, Message } from '@/lib/firebase';
import { Button } from "./../../../components/ui/button";
import { Textarea } from "./../../../components/ui/textarea";
import { Loader2 } from "lucide-react";

const PaperChatPage = () => {
  const params = useParams();
  const collectionId = params.id as string;
  const paperId = params.paperId as string;
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPaper, setCurrentPaper] = useState<Paper | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchPaperAndMessages = async () => {
      try {
        setIsLoading(true);
        const [paper, paperMessages] = await Promise.all([
          firebaseOperations.getPaperById(paperId),
          firebaseOperations.getMessages(collectionId, paperId)
        ]);
        
        setCurrentPaper(paper);
        setMessages(paperMessages.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (collectionId && paperId) {
      fetchPaperAndMessages();
    }
  }, [collectionId, paperId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const messageData: Omit<Message, 'id'> = {
        content: newMessage,
        timestamp: new Date().toISOString(),
        isUser: true,
        paperId: paperId
      };

      const savedMessage = await firebaseOperations.createMessage(collectionId, messageData);
      setMessages(prev => [...prev, savedMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }).toLowerCase();
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: Record<string, Message[]>, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <button 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={() => router.push(`/chat/${collectionId}`)}
          >
            <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="ml-4">
            <h2 className="text-lg font-medium text-gray-900">
              {currentPaper?.title || 'Loading...'}
            </h2>
            {currentPaper && (
              <p className="text-sm text-gray-500">
                {currentPaper.authors.map(author => author.name).join(', ')} • {currentPaper.year}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-gray-100 px-4 py-1 rounded-full">
                  <span className="text-xs text-gray-500">{formatDate(dateMessages[0].timestamp)}</span>
                </div>
              </div>
              {dateMessages.map((message, idx) => (
                <div 
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-2xl rounded-lg p-4 ${
                      message.isUser 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-2 max-w-4xl mx-auto">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write your message..."
            className="flex-1 min-h-[2.5rem] max-h-32 resize-none text-gray-900"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            onClick={handleSendMessage}
            disabled={isSending || !newMessage.trim()}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Send
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaperChatPage;