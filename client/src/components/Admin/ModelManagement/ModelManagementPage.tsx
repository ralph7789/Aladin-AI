import React, { useState, useEffect } from 'react';
import { Plus, Server, Key, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';

interface ApiKey {
  _id: string;
  key_name: string;
  key: string;
  status: 'active' | 'exhausted' | 'rate_limited';
  supportedModels: string[];
  tokenLimit: number;
  tokensUsed: number;
}

interface Provider {
  name: string;
  isActive: boolean;
  aggregateTokensLimit: number;
  aggregateTokensUsed: number;
  keys: ApiKey[];
}

export default function ModelManagementPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  // Form State
  const [newKeyProvider, setNewKeyProvider] = useState('Zai Org');
  const [newKey, setNewKey] = useState('');
  const [newKeyModels, setNewKeyModels] = useState('glm, llama-3');
  const [newKeyLimit, setNewKeyLimit] = useState(1000000);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      // Proxy to our backend which talks to LiteLLM
      const res = await axios.get('/api/admin/model-management/providers');
      setProviders(res.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
      // Fallback dummy data for visualization before backend is fully hooked up
      setProviders([
        {
          name: 'Zai Org',
          isActive: true,
          aggregateTokensLimit: 5000000,
          aggregateTokensUsed: 3500000,
          keys: [
            {
              _id: '1',
              key_name: 'Zai-Primary-1',
              key: 'sk-zai-...',
              status: 'active',
              supportedModels: ['glm', 'glm-4'],
              tokenLimit: 2500000,
              tokensUsed: 1000000,
            },
            {
              _id: '2',
              key_name: 'Zai-Fallback',
              key: 'sk-zai-...',
              status: 'exhausted',
              supportedModels: ['glm'],
              tokenLimit: 2500000,
              tokensUsed: 2500000,
            }
          ]
        },
        {
          name: 'Cerebras',
          isActive: true,
          aggregateTokensLimit: 10000000,
          aggregateTokensUsed: 1200000,
          keys: [
            {
              _id: '3',
              key_name: 'Cerebras-Main',
              key: 'sk-cer-...',
              status: 'active',
              supportedModels: ['glm', 'llama-3'],
              tokenLimit: 10000000,
              tokensUsed: 1200000,
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/model-management/keys', {
        provider: newKeyProvider,
        key: newKey,
        models: newKeyModels.split(',').map(s => s.trim()),
        limit: newKeyLimit
      });
      setShowAddModal(false);
      setNewKey('');
      fetchProviders();
    } catch (error) {
      console.error('Failed to add key', error);
      alert('Failed to add key. Ensure the backend is connected to LiteLLM.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="text-green-500" size={16} />;
      case 'exhausted': return <AlertCircle className="text-red-500" size={16} />;
      case 'rate_limited': return <Clock className="text-yellow-500" size={16} />;
      default: return <Server className="text-gray-500" size={16} />;
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading Model Management...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Server className="text-blue-600" />
            Model & API Key Management
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage provider API keys, configure auto-rotation, and monitor token usage. Powered by LiteLLM.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add API Key
        </button>
      </div>

      {/* Provider List */}
      <div className="space-y-6">
        {providers.map((provider) => {
          const percentUsed = Math.min(100, (provider.aggregateTokensUsed / provider.aggregateTokensLimit) * 100);
          const isExpanded = expandedProvider === provider.name;

          return (
            <div key={provider.name} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                onClick={() => setExpandedProvider(isExpanded ? null : provider.name)}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Server size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{provider.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{provider.keys.length} Active Keys</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {provider.aggregateTokensUsed.toLocaleString()} / {provider.aggregateTokensLimit.toLocaleString()} Tokens
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Aggregate Quota</p>
                  </div>
                </div>
                
                {/* Aggregate Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${percentUsed > 90 ? 'bg-red-500' : percentUsed > 75 ? 'bg-yellow-500' : 'bg-blue-600'}`} 
                    style={{ width: `${percentUsed}%` }}
                  ></div>
                </div>
              </div>

              {/* Expanded Key List */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wider">Associated API Keys</h4>
                  <div className="grid gap-4">
                    {provider.keys.map(key => {
                      const keyPercent = Math.min(100, (key.tokensUsed / key.tokenLimit) * 100);
                      return (
                        <div key={key._id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(key.status)}
                              <span className="font-medium text-gray-800 dark:text-white">{key.key_name}</span>
                              <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{key.key.substring(0, 8)}...</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              {key.supportedModels.map(model => (
                                <span key={model} className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-md font-medium">
                                  {model}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex-1 w-full md:max-w-xs">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600 dark:text-gray-400">Tokens Used</span>
                              <span className="font-medium text-gray-800 dark:text-white">{key.tokensUsed.toLocaleString()} / {key.tokenLimit.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${keyPercent > 90 ? 'bg-red-500' : keyPercent > 75 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                style={{ width: `${keyPercent}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div>
                            <button className="text-gray-400 hover:text-red-500 p-2 transition-colors">
                              Revoke
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Key Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Add New API Key</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
            </div>
            <form onSubmit={handleAddKey} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider Name</label>
                <input 
                  type="text" 
                  value={newKeyProvider}
                  onChange={(e) => setNewKeyProvider(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-800 dark:text-white"
                  placeholder="e.g. Zai Org"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                <input 
                  type="password" 
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-800 dark:text-white font-mono"
                  placeholder="sk-..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supported Models (comma separated)</label>
                <input 
                  type="text" 
                  value={newKeyModels}
                  onChange={(e) => setNewKeyModels(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-800 dark:text-white"
                  placeholder="glm, llama-3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Token Budget Limit</label>
                <input 
                  type="number" 
                  value={newKeyLimit}
                  onChange={(e) => setNewKeyLimit(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-800 dark:text-white"
                  required
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">Validate & Add Key</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
