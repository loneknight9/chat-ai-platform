import type { Message, ApiKeyConfig } from "../types/chat";
import OpenAI from "openai";

// Generic interface for API response
interface ApiResponse {
  content: string;
  error?: string;
}

// Helper to construct chat API requests
const createRequest = async (
  messages: Message[],
  apiConfig: ApiKeyConfig,
  model: string
): Promise<any> => {
  const baseHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiConfig.key}`,
  };
  
  const openai = new OpenAI({
    apiKey: apiConfig.key,
    baseURL: getApiEndpoint(apiConfig, model),
    dangerouslyAllowBrowser: true,
  });

  return openai.chat.completions.create({
    model,
    messages,
    stream: false,
    temperature: 0.2,
  });
};

// Get API endpoint based on provider
const getApiEndpoint = (apiConfig: ApiKeyConfig, model: string): string => {
  if (apiConfig.endpoint) {
    return apiConfig.endpoint;
  }

  switch (apiConfig.provider) {
    case "openai":
      return "https://api.openai.com/v1";
    case "anthropic":
      return "https://api.anthropic.com/v1";
    case "grok":
      return "https://api.grok.ai/v1";
    default:
      throw new Error(`No default endpoint for provider: ${apiConfig.provider}`);
  }
};

// Parse API response based on provider
const parseResponse = async (
  response: Response,
  provider: string
): Promise<ApiResponse> => {
  if (!response.ok) {
    const errorText = await response.text();
    return {
      content: "",
      error: `API Error (${response.status}): ${errorText}`,
    };
  }

  const data = await response.json();
  console.log(data);

  switch (provider) {
    case "openai":
    case "anthropic":
    case "grok":
      return {
        content: data.choices[0]?.message || "No response",
      };
    case "custom":
      // For custom endpoints, attempt to parse in a flexible way
      return {
        content: 
          data.choices?.[0]?.message?.content || 
          data.content?.[0]?.text || 
          data.response || 
          data.content || 
          data.text || 
          data.message || 
          "",
      };
    default:
      return { content: "Received response from unsupported provider." };
  }
};

// Main API function to send messages to the AI service
export const sendMessage = async (
  messages: Message[],
  apiConfig: ApiKeyConfig,
  model: string
): Promise<ApiResponse> => {
  if (!apiConfig || !apiConfig.key) {
    return {
      content: "",
      error: "API key not configured. Please add your API key in settings.",
    };
  }

  try {
    const response = await createRequest(messages, apiConfig, model);
    return await parseResponse(response, apiConfig.provider);

  } catch (error) {
    console.error("API request failed:", error);
    return {
      content: "",
      error: `Failed to connect to the AI service: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

// Get available models based on provider
export const getAvailableModels = (provider: string): { id: string; name: string }[] => {
  switch (provider) {
    case "openai":
      return [
        { id: "gpt-4o", name: "GPT-4o" },
        { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
        { id: "gpt-4", name: "GPT-4" },
        { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
      ];
    case "anthropic":
      return [
        { id: "claude-3-opus", name: "Claude 3 Opus" },
        { id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
        { id: "claude-3-haiku", name: "Claude 3 Haiku" },
      ];
    case "grok":
      return [
        { id: "grok-2-latest", name: "Grok-2 Latest" },
      ];
    case "custom":
      return [
        { id: "custom-model", name: "Custom Model" },
      ];
    default:
      return [];
  }
};
