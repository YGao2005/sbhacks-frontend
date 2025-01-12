// utils/api.ts
export const chatbotApi = {
    sendMessage: async (prompt: string) => {
      try {
        const response = await fetch('http://127.0.0.1:5000/chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        });
        return await response.json();
      } catch (error) {
        console.error('Error sending message to chatbot:', error);
        throw error;
      }
    },
  
    clearHistory: async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/clear_history', {
          method: 'POST',
        });
        return await response.json();
      } catch (error) {
        console.error('Error clearing chat history:', error);
        throw error;
      }
    },
  };