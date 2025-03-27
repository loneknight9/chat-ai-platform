import React, { useState } from "react";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import TextInput from "../shared/TextInput";
import { useChatContext } from "../../context/ChatContext";
import type { ProviderType } from "../../types/chat";
import { getAvailableModels } from "../../services/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { apiKeys, setApiKey, selectedModel, setSelectedModel } = useChatContext();
  const [activeTab, setActiveTab] = useState<ProviderType>("openai");
  const [apiKey, setApiKeyState] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [showEndpoint, setShowEndpoint] = useState(false);

  // Initialize forms when tab changes
  React.useEffect(() => {
    const currentConfig = apiKeys[activeTab];
    setApiKeyState(currentConfig?.key || "");
    setEndpoint(currentConfig?.endpoint || "");
    setShowEndpoint(activeTab === "custom");
  }, [activeTab, apiKeys]);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      setApiKey(activeTab, {
        provider: activeTab,
        key: apiKey.trim(),
        endpoint: showEndpoint ? endpoint.trim() : undefined,
      });
    } else {
      setApiKey(activeTab, null);
    }
  };

  const handleTabChange = (provider: ProviderType) => {
    setActiveTab(provider);
  };

  const availableModels = getAvailableModels(activeTab);

  const apiKeyExists = !!apiKeys[activeTab]?.key;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveApiKey}>
            {apiKeyExists ? "Update API Key" : "Save API Key"}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
            API Configuration
          </h3>
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-4">
              {(["openai", "anthropic", "grok", "custom"] as ProviderType[]).map((provider) => (
                <button
                  key={provider}
                  onClick={() => handleTabChange(provider)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === provider
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                >
                  {provider === "openai"
                    ? "OpenAI"
                    : provider === "anthropic"
                    ? "Anthropic"
                    : provider === "grok"
                    ? "Grok"
                    : "Custom"}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="space-y-4">
          <TextInput
            label={`${activeTab === "openai" ? "OpenAI" : activeTab === "anthropic" ? "Anthropic" : activeTab === "grok" ? "Grok" : "Custom"} API Key`}
            type="password"
            value={apiKey}
            onChange={(e) => setApiKeyState(e.target.value)}
            placeholder={`Enter your ${activeTab} API key`}
            fullWidth
          />

          {showEndpoint && (
            <TextInput
              label="Custom Endpoint URL"
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api.example.com/v1/chat/completions"
              fullWidth
            />
          )}

          {apiKeyExists && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Available Models
              </h4>
              <div className="space-y-2">
                {availableModels.length > 0 ? (
                  availableModels.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center"
                    >
                      <input
                        type="radio"
                        id={model.id}
                        name="model"
                        value={model.id}
                        checked={selectedModel === model.id}
                        onChange={() => setSelectedModel(model.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                      />
                      <label
                        htmlFor={model.id}
                        className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
                      >
                        {model.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No models available for this provider.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 text-xs text-gray-500 dark:text-gray-400">
            {apiKeyExists ? (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 mr-1"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                    clipRule="evenodd"
                  />
                </svg>
                API key configured
              </div>
            ) : (
              <>
                Your API key is stored locally and never sent to our servers.
                <br />
                You'll need to provide an API key to use this service.
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
