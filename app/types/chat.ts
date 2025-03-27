export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model?: string;
}

export interface ApiKeyConfig {
  provider: 'openai' | 'anthropic' | 'grok' | 'custom';
  key: string;
  endpoint?: string; // For custom API endpoints
}

export type AIModel = {
  id: string;
  name: string;
  provider: string;
  description?: string;
  maxTokens?: number;
  available: boolean;
};

export type ProviderType = 'openai' | 'anthropic' | 'grok' | 'custom';
