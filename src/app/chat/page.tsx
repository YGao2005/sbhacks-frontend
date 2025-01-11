'use client';

import { useState } from 'react';
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isUser: boolean;
}

interface Paper {
  id: string;
  title: string;
  year: number;
  type: 'paper' | 'chart';
}

interface Chart {
  id: string;
  title: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters.',
      timestamp: '6:30 pm',
      isUser: false
    },
    {
      id: '2',
      content: 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour,',
      timestamp: '6:34 pm',
      isUser: true
    },
    {
      id: '3',
      content: 'The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using \'Content here, content here\', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default.Contrary to popular belief, Lorem Ipsum is not simply random text is the model text for your company.',
      timestamp: '6:38 pm',
      isUser: false
    }
  ]);

  const [papers] = useState<Paper[]>([
    { id: '1', title: 'Cancer and leth...', year: 2019, type: 'paper' },
    { id: '2', title: 'Newborn birth d...', year: 2020, type: 'paper' },
    { id: '3', title: 'Meta study on ca...', year: 2007, type: 'paper' },
    { id: '4', title: 'Brain cell death...', year: 2018, type: 'paper' },
    { id: '5', title: 'Leading neurosci...', year: 2001, type: 'paper' },
    { id: '6', title: 'Something crazy...', year: 1992, type: 'paper' },
    { id: '7', title: 'placeholder name...', year: 2004, type: 'paper' }
  ]);

  const [charts] = useState<Chart[]>([
    { id: '1', title: 'Pi smoking percentages' },
    { id: '2', title: 'Histogram on 2020 deat...' },
    { id: '3', title: 'Some chart' },
    { id: '4', title: 'Some other chart' }
  ]);

  const [newMessage, setNewMessage] = useState('');

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
        
        {/* Papers Section */}
        <div className="px-4 py-2">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Papers</h3>
          <div className="space-y-2">
            {papers.map((paper) => (
              <div 
                key={paper.id}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-700">{paper.title}</span>
                <span className="text-xs text-gray-500">{paper.year}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="px-4 py-2">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Charts and Graphs</h3>
          <div className="space-y-2">
            {charts.map((chart) => (
              <div 
                key={chart.id}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <span className="text-sm text-gray-700">{chart.title}</span>
              </div>
            ))}
          </div>
          
          <button className="flex items-center space-x-2 p-2 text-gray-500 hover:text-gray-700 text-sm mt-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create New Chart</span>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="ml-2 text-lg font-medium text-gray-900">Addressing the issue of Lorem Ipsum</h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-2xl rounded-lg p-4 ${
                  message.isUser 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p>{message.content}</p>
                <div className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-end space-x-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write message"
              className="flex-1 min-h-[2.5rem] max-h-32 resize-none text-gray-900"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleSendMessage}
              >
                Send
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}