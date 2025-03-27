import React, { useState, useEffect } from "react";
import type { Route } from "./+types/chat";
import { ChatProvider, useChatContext } from "../context/ChatContext";
import ChatArea from "../components/chat/ChatArea";
import Sidebar from "../components/sidebar/Sidebar";
import { sendMessage } from "../services/api";
import type { Message } from "../types/chat";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ChatAI Platform" },
    { name: "description", content: "Chat with AI using your API key" },
  ];
}

const ChatPage = () => {
  const {
    conversations,
    currentConversationId,
    createNewConversation,
    setCurrentConversation,
    addMessage,
    deleteConversation,
    apiKeys,
    selectedModel,
    loading: contextLoading,
  } = useChatContext();
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get the current conversation
  const currentConversation = conversations.find(
    (conv) => conv.id === currentConversationId
  );
  
  // Get messages for the current conversation
  const messages = currentConversation?.messages || [];

  const handleSendMessage = async (content: string) => {
    // Add user message
    addMessage({
      role: "user",
      content,
    });

    // Find the appropriate API key based on the selected model
    const modelProvider = selectedModel.includes("gpt") ? "openai" : 
                         selectedModel.includes("claude") ? "anthropic" :
                         selectedModel.includes("grok") ? "grok" : "custom";
    
    const apiKey = apiKeys[modelProvider];

    if (!apiKey) {
      addMessage({
        role: "assistant",
        content: `No API key configured for ${modelProvider}. Please add your API key in settings.`,
      });
      return;
    }

    setLoading(true);

    try {
      // Get all messages for the current conversation
      const conversationMessages = [
        ...messages,
        { id: "temp", role: "user" as const, content, timestamp: Date.now() },
      ];

      // Send request to the API
      const response = await sendMessage(conversationMessages, apiKey, selectedModel);

      // Add AI response
      addMessage({
        role: "assistant",
        content: response.error || response.content,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      addMessage({
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to communicate with AI service"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Mobile Sidebar Toggle */}
      {!isMobileSidebarOpen && (
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          aria-label="Open sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-transform transform ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={(id) => {
            setCurrentConversation(id);
            setIsMobileSidebarOpen(false);
          }}
          onDeleteConversation={deleteConversation}
          onNewConversation={() => {
            createNewConversation();
            setIsMobileSidebarOpen(false);
          }}
          onClose={() => setIsMobileSidebarOpen(false)}
          isMobile={true}
          className="w-80"
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 flex-shrink-0">
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={setCurrentConversation}
          onDeleteConversation={deleteConversation}
          onNewConversation={createNewConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 relative overflow-hidden">
          <ChatArea
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={loading}
          />
        </main>
      </div>
    </div>
  );
};

export default function ChatWithProvider() {
  return (
    <ChatProvider>
      <ChatPage />
    </ChatProvider>
  );
}
