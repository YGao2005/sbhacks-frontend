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

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  isUser: boolean;
  paperId?: string;
}

// Define the type for collection data without ID
export type CollectionData = Omit<Collection, 'id'>;

const firebaseConfig = {
  apiKey: "AIzaSyDem-xAuzORzlBxfCAUte1enF0EasRBMqE",
  authDomain: "sbhacks-2e247.firebaseapp.com",
  projectId: "sbhacks-2e247",
  storageBucket: "sbhacks-2e247.firebasestorage.app",
  messagingSenderId: "19060159090",
  appId: "1:19060159090:web:8c399f8d2b343766c348eb",
  measurementId: "G-84ZT1Y69CT"
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

  // lib/firebase.ts
updateMessages: async (collectionId: string, newMessages: Message[]) => {
  const collectionRef = doc(db, 'collections', collectionId);
  try {
    // Filter out any undefined or invalid messages
    const validMessages = newMessages.filter(msg => 
      msg && msg.content && msg.timestamp && typeof msg.isUser === 'boolean'
    );

    // Convert messages to plain objects
    const messageObjects = validMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      timestamp: msg.timestamp,
      isUser: msg.isUser,
      paperId: msg.paperId || ''
    }));

    await updateDoc(collectionRef, {
      messages: arrayUnion(...messageObjects)
    });
  } catch (error) {
    console.error('Error updating messages:', error);
    throw error;
  }
},

  getMessagesForPaper: async (collectionId: string, paperId: string): Promise<Message[]> => {
    try {
      const messagesRef = collection(db, 'collections', collectionId, 'messages');
      const snapshot = await getDocs(messagesRef);
      const allMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      // Filter messages for specific paper
      return allMessages.filter(message => message.paperId === paperId);
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  },

  async getMessages(collectionId: string): Promise<Message[]> {
    try {
      const collectionRef = doc(db, "collections", collectionId);
      const collectionDoc = await getDoc(collectionRef);
      
      if (collectionDoc.exists()) {
        const data = collectionDoc.data();
        return data.messages || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  },

  // Create a new message
  createMessage: async (collectionId: string, message: Omit<Message, 'id'>): Promise<Message> => {
    try {
      const messagesRef = collection(db, 'collections', collectionId, 'messages');
      const docRef = await addDoc(messagesRef, {
        ...message,
        timestamp: new Date().toISOString()
      });
      
      return {
        id: docRef.id,
        ...message
      };
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
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

  getPapersForCollection: async (collectionId: string): Promise<Paper[]> => {
    try {
      const collectionRef = doc(db, 'collections', collectionId);
      const collectionDoc = await getDoc(collectionRef);
  
      if (!collectionDoc.exists()) {
        throw new Error('Collection not found');
      }
  
      const collectionData = collectionDoc.data() as Collection;
      return collectionData.papers || [];
    } catch (error) {
      console.error('Error getting papers for collection:', error);
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
      
      // Ensure each paper has a paperId
      const papersWithIds = papers.map(paper => ({
        ...paper,
        paperId: paper.paperId || crypto.randomUUID() // or any other unique ID generation method
      }));
  
      await updateDoc(collectionRef, {
        papers: arrayUnion(...papersWithIds),
        papersCount: (collectionData.papers?.length || 0) + papers.length,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Error adding papers to collection:', error);
      throw error;
    }
  },
  
  deletePaperFromCollection: async (collectionId: string, paperId: string): Promise<void> => {
    try {
      const collectionRef = doc(db, 'collections', collectionId);
      const collectionDoc = await getDoc(collectionRef);

      if (!collectionDoc.exists()) {
        throw new Error('Collection not found');
      }

      const collectionData = collectionDoc.data() as Collection;
      
      // Filter out the paper with the given paperId
      const updatedPapers = collectionData.papers.filter(paper => paper.paperId !== paperId);

      // Update the collection with the filtered papers
      await updateDoc(collectionRef, {
        papers: updatedPapers,
        papersCount: updatedPapers.length,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Error deleting paper from collection:', error);
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
  },
  getPaperById: async (paperId: string): Promise<Paper | null> => {
    try {
      const collectionRef = collection(db, 'papers');
      const paperDoc = await getDoc(doc(collectionRef, paperId));
      
      if (paperDoc.exists()) {
        return {
          paperId: paperDoc.id,
          ...paperDoc.data()
        } as Paper;
      }
      return null;
    } catch (error) {
      console.error('Error getting paper:', error);
      throw error;
    }
  }

  
};

export { db };