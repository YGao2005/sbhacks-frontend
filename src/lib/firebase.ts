// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Define the Collection type
export interface Collection {
  id: string;
  name: string;
  thesis?: string;
  papersCount: number;
  lastUpdated: string;
}

// Define the type for collection data without ID (used when creating)
export type CollectionData = Omit<Collection, 'id'>;

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Firebase operations
export const firebaseOperations = {
  // Get all collections
  getCollections: async (): Promise<Collection[]> => {
    try {
      const collectionsRef = collection(db, 'collections');
      const snapshot = await getDocs(collectionsRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Collection[];
    } catch (error) {
      console.error('Error getting collections:', error);
      return [];
    }
  },

  // Create a new collection
  createCollection: async (collectionData: CollectionData): Promise<Collection> => {
    try {
      const docRef = await addDoc(collection(db, 'collections'), collectionData);
      return { id: docRef.id, ...collectionData };
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  },

  // Delete a collection
  deleteCollection: async (collectionId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'collections', collectionId));
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }
};