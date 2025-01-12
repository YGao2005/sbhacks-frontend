// lib/api.ts
const API_BASE_URL = 'http://127.0.0.1:5000';

export const chatApi = {
  clearHistory: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clear_history`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  },

  sendMessage: async (prompt: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
};