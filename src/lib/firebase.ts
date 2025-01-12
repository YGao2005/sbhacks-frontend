// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc,
  getDoc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';

// Define the Paper interface
export interface Paper {
  paperId: string;  // Changed from id: number
  title: string;
  url: string;
  pdfUrl: string;
  type: string;
  year: number;
  authors: {
    id: string;
    name: string;
  }[];
  selected?: boolean;
}

// Define the Collection type
export interface Collection {
  id: string;
  name: string;
  thesis?: string;
  papersCount: number;
  lastUpdated: number;
  papers: Paper[];
}

// Define the type for collection data without ID
export type CollectionData = Omit<Collection, 'id'>;

const firebaseConfig = {
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

  // Get a single collection by ID
  getCollection: async (collectionId: string): Promise<Collection | null> => {
    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Collection;
      }
      return null;
    } catch (error) {
      console.error('Error getting collection:', error);
      throw error;
    }
  },

  // Create a new collection
  createCollection: async (collectionData: Omit<CollectionData, 'papers' | 'lastUpdated'>): Promise<Collection> => {
    try {
      const collectionWithDefaults = {
        ...collectionData,
        papers: [],
        lastUpdated: Date.now()
      };

      const docRef = await addDoc(collection(db, 'collections'), collectionWithDefaults);
      return { 
        id: docRef.id, 
        ...collectionWithDefaults 
      };
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  },

  // Add papers to a collection
  addPapersToCollection: async (collectionId: string, papers: Paper[]): Promise<void> => {
    try {
      const collectionRef = doc(db, 'collections', collectionId);
      const collectionDoc = await getDoc(collectionRef);

      if (!collectionDoc.exists()) {
        throw new Error('Collection not found');
      }

      const collectionData = collectionDoc.data();
      
      await updateDoc(collectionRef, {
        papers: arrayUnion(...papers),
        papersCount: (collectionData.papers?.length || 0) + papers.length,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Error adding papers to collection:', error);
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