'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { firebaseOperations, Collection } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MessageSquare } from 'lucide-react';

export default function SummaryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        if (typeof id === 'string') {
          const collectionData = await firebaseOperations.getCollection(id);
          if (collectionData) {
            setCollection(collectionData);
          } else {
            console.log("No such collection!");
            router.push('/dashboard');
          }
        } else {
          console.error("Invalid collection ID");
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching collection:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">Loading collection summary...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-gray-600 mb-4 hover:text-gray-900"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </button>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{collection.name}</h1>
            <p className="text-sm text-gray-500">Last updated {new Date(collection.lastUpdated).toLocaleDateString()}</p>
          </div>
          <div className="space-x-4">
            <Button onClick={() => router.push(`/chat/${id}`)}>
              <MessageSquare className="w-5 h-5 mr-2" />
              Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Key Findings Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Speaking Performance</h3>
            <ul className="space-y-2 text-gray-600">
              <li>Positive correlation with preparation time (r=0.25-0.32)</li>
              <li>Negative correlation with anxiety (r=-0.15 to -0.2)</li>
              <li>Strong relationship with practice sessions</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Speaking Performance</h3>
            <ul className="space-y-2 text-gray-600">
              <li>Positive correlation with preparation time (r=0.25-0.32)</li>
              <li>Negative correlation with anxiety (r=-0.15 to -0.2)</li>
              <li>Strong relationship with practice sessions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Cross-Paper Analysis */}
      <div className="mt-8 bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Cross-Paper Analysis</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={[
            { name: 'Preparation Time', value: 0.3 },
            { name: 'Practice Sessions', value: 0.4 },
            { name: 'Anxiety Levels', value: -0.2 },
          ]}>
            <XAxis dataKey="name" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={() => router.push(`/chat/${id}`)}>
          <MessageSquare className="w-5 h-5 mr-2" />
          Chat
        </Button>
      </div>
    </div>
  );
}