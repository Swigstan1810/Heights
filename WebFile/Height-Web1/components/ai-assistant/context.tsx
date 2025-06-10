"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Types
export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
};

export type AssistantContextType = {
  messages: Message[];
  addMessage: (content: string, role: "user" | "assistant" | "system") => Promise<void>;
  clearMessages: () => void;
  isLoading: boolean;
  assistantName: string;
  error: string | null;
};

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 10);

// Create React Context for the Assistant
const AssistantContext = createContext<AssistantContextType>({
  messages: [],
  addMessage: async () => {},
  clearMessages: () => {},
  isLoading: false,
  assistantName: "Heights+ AI",
  error: null
});

// Initial system message
const initialSystemMessage = {
  id: generateId(),
  role: "system" as const,
  content: "🚀 Hello! I'm Heights+ AI, your advanced trading intelligence assistant. How can I help you elevate your trading today?",
  timestamp: new Date(),
};

// Provider Component
export function AssistantProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([initialSystemMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const assistantName = "Heights+ AI";

  // Add a new message to the conversation
  const addMessage = useCallback(async (content: string, role: "user" | "assistant" | "system") => {
    // Create and add the new message
    const newMessage = {
      id: generateId(),
      role,
      content,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, newMessage]);
    
    // If it's a user message, get AI response
    if (role === "user") {
      setIsLoading(true);
      setError(null);
      
      try {
        // Filter out system welcome message when sending history
        const messageHistory = messages.filter(m => 
          !(m.role === 'system' && m.content.includes("Hello! I'm Heights+ AI"))
        );
        
        // Call the AI chat API
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            history: messageHistory
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get response');
        }
        
        const data = await response.json();
        
        // Add assistant response
        const assistantMessage = {
          id: generateId(),
          role: "assistant" as const,
          content: data.message,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err: unknown) {
        let errorMsg = 'Failed to get response';
        if (err instanceof Error) {
          setError(err.message);
          errorMsg = err.message;
        } else {
          setError('Failed to get response');
        }
        // Add error message
        const errorMessage = {
          id: generateId(),
          role: "assistant" as const,
          content: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.\n\n" + errorMsg,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [messages]);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([initialSystemMessage]);
    setError(null);
  }, []);

  return (
    <AssistantContext.Provider
      value={{
        messages,
        addMessage,
        clearMessages,
        isLoading,
        assistantName,
        error
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

// Custom hook to use the Assistant context
export const useAssistant = () => useContext(AssistantContext);