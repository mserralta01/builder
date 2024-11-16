import { useState } from 'react';
import { APIKeyManager } from '../chat/APIKeyManager';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { DEFAULT_PROVIDER, MODEL_LIST } from '~/utils/constants';

interface SettingsProps {
  provider: string;
  apiKey: string;
  model: string;
  updateApiKey: (provider: string, key: string) => void;
  setModel: (model: string) => void;
  setProvider: (provider: string) => void;
}

export function Settings({ provider, apiKey, model, updateApiKey, setModel, setProvider }: SettingsProps) {
  const [showConfig, setShowConfig] = useState(false);
  const providerList = [...new Set(MODEL_LIST.map((model) => model.provider))];

  return (
    <div className="p-4 border-t border-bolt-elements-borderColor">
      <button
        onClick={() => setShowConfig(true)}
        className="w-full flex items-center justify-between p-2 rounded-lg border border-bolt-elements-borderColor hover:bg-bolt-elements-sidebar-buttonBackgroundHover transition-colors"
      >
        <span>AI Configuration</span>
        <div className="i-ph:gear" />
      </button>

      <DialogRoot open={showConfig}>
        <Dialog onClose={() => setShowConfig(false)} onBackdrop={() => setShowConfig(false)}>
          <DialogTitle>AI Configuration</DialogTitle>
          <DialogDescription>
            <div className="p-4 space-y-6">
              <div>
                <div className="text-bolt-elements-textPrimary font-medium mb-2">Model Selection</div>
                <select 
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value);
                    const firstModel = MODEL_LIST.find(m => m.provider === e.target.value);
                    setModel(firstModel ? firstModel.name : '');
                  }}
                  className="w-full p-2 mb-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all"
                >
                  {providerList.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="Ollama">Ollama</option>
                  <option value="OpenAILike">OpenAILike</option>
                  <option value="LMStudio">LMStudio</option>
                </select>
                
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full p-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all"
                >
                  {MODEL_LIST.filter(e => e.provider === provider && e.name).map((modelOption) => (
                    <option key={modelOption.name} value={modelOption.name}>
                      {modelOption.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-bolt-elements-textPrimary font-medium mb-2">API Configuration</div>
                <APIKeyManager
                  provider={provider}
                  apiKey={apiKey}
                  setApiKey={(key) => updateApiKey(provider, key)}
                />
              </div>
            </div>
          </DialogDescription>
          <div className="px-5 pb-4 bg-bolt-elements-background-depth-2 flex justify-end">
            <DialogButton type="secondary" onClick={() => setShowConfig(false)}>
              Close
            </DialogButton>
          </div>
        </Dialog>
      </DialogRoot>
    </div>
  );
} 