import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Conversation, Message, ApiKeyConfig, ProviderType } from "../types/chat";
import { v4 as uuidv4 } from 'uuid';

interface ChatContextType {
  conversations: Conversation[];
  currentConversationId: string | null;
  apiKeys: Record<ProviderType, ApiKeyConfig | null>;
  selectedModel: string;
  loading: boolean;
  error: string | null;
  createNewConversation: () => string;
  setCurrentConversation: (id: string) => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  deleteConversation: (id: string) => void;
  setApiKey: (provider: ProviderType, config: ApiKeyConfig | null) => void;
  setSelectedModel: (modelId: string) => void;
  clearConversations: () => void;
  updateConversationTitle: (id: string, title: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<ProviderType, ApiKeyConfig | null>>({
    openai: null,
    anthropic: null,
    grok: null,
    custom: null,
  });
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from localStorage on initial render
  useEffect(() => {
    const storedConversations = localStorage.getItem("conversations");
    const storedApiKeys = localStorage.getItem("apiKeys");
    const storedModel = localStorage.getItem("selectedModel");

    if (storedConversations) {
      try {
        const parsedConversations = JSON.parse(storedConversations);
        setConversations(parsedConversations);
        
        // Set the most recent conversation as current if available
        if (parsedConversations.length > 0) {
          const sortedConversations = [...parsedConversations].sort(
            (a, b) => b.updatedAt - a.updatedAt
          );
          setCurrentConversationId(sortedConversations[0].id);
        }
      } catch (e) {
        console.error("Failed to parse stored conversations:", e);
      }
    }

    if (storedApiKeys) {
      try {
        setApiKeys(JSON.parse(storedApiKeys));
      } catch (e) {
        console.error("Failed to parse stored API keys:", e);
      }
    }

    if (storedModel) {
      setSelectedModel(storedModel);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("conversations", JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem("apiKeys", JSON.stringify(apiKeys));
  }, [apiKeys]);

  useEffect(() => {
    localStorage.setItem("selectedModel", selectedModel);
  }, [selectedModel]);


  // polyfill for crypto.randomUUID
  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    } else {
      return uuidv4();
    }
  }

  const createNewConversation = () => {
    const id = generateUUID();
    const newConversation: Conversation = {
      id,
      title: "New Conversation",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel,
    };

    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(id);
    return id;
  };

  const setCurrentConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const addMessage = (messageData: Omit<Message, "id" | "timestamp">) => {
    if (!currentConversationId) {
      const newId = createNewConversation();
      setCurrentConversationId(newId);
    }

    const message: Message = {
      ...messageData,
      id: generateUUID(),
      timestamp: Date.now(),
    };

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === currentConversationId) {
          // If this is the first message, update the title based on user message
          let title = conv.title;
          if (conv.messages.length === 0 && messageData.role === "user") {
            title = messageData.content.length > 30
              ? `${messageData.content.substring(0, 30)}...`
              : messageData.content;
          }

          return {
            ...conv,
            messages: [...conv.messages, message],
            updatedAt: Date.now(),
            title,
          };
        }
        return conv;
      })
    );
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
    
    // If the deleted conversation was the current one, select another one or set to null
    if (currentConversationId === id) {
      const remainingConversations = conversations.filter((conv) => conv.id !== id);
      if (remainingConversations.length > 0) {
        setCurrentConversationId(remainingConversations[0].id);
      } else {
        setCurrentConversationId(null);
      }
    }
  };

  const setApiKey = (provider: ProviderType, config: ApiKeyConfig | null) => {
    setApiKeys((prev) => ({
      ...prev,
      [provider]: config,
    }));
  };

  const clearConversations = () => {
    setConversations([]);
    setCurrentConversationId(null);
    localStorage.removeItem("conversations");
  };

  const updateConversationTitle = (id: string, title: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id ? { ...conv, title } : conv
      )
    );
  };

  const value = {
    conversations,
    currentConversationId,
    apiKeys,
    selectedModel,
    loading,
    error,
    createNewConversation,
    setCurrentConversation,
    addMessage,
    deleteConversation,
    setApiKey,
    setSelectedModel,
    clearConversations,
    updateConversationTitle,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
