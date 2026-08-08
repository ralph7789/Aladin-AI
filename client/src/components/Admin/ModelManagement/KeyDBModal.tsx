import React, { useState, useEffect } from 'react';
import { Database, Plus, CheckCircle, XCircle, X } from 'lucide-react';
import { request } from 'aladin-data-provider';

interface KeyDBModalProps {
  onClose: () => void;
  onKeyAddedOrInvoked: () => void;
  onOpenAddModal: () => void;
}

export default function KeyDBModal({ onClose, onKeyAddedOrInvoked, onOpenAddModal }: KeyDBModalProps) {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invokingId, setInvokingId] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res: any = await request.get('/api/admin/model-management/keys/db');
      setKeys(res.keys || []);
    } catch (error) {
      console.error('Failed to fetch KeyDB', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoke = async (keyId: string) => {
    try {
      setInvokingId(keyId);
      await request.post('/api/admin/model-management/keys/invoke', { keyId });
      onKeyAddedOrInvoked();
      fetchKeys();
    } catch (error) {
      console.error('Failed to invoke key', error);
      alert('Failed to invoke key');
    } finally {
      setInvokingId(null);
    }
  };

  const [editingKey, setEditingKey] = useState<any>(null);
  const [editForm, setEditForm] = useState({ baseURL: '', models: '', limit: 1000000 });

  const handleEditClick = (key: any) => {
    setEditingKey(key);
    setEditForm({
      baseURL: key.base_url || '',
      models: key.models?.join(', ') || '',
      limit: key.limit_budget || 1000000
    });
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const modelsArray = editForm.models.split(',').map(m => m.trim()).filter(Boolean);
      await request.put(`/api/admin/model-management/keys/db/${editingKey.id}`, {
        base_url: editForm.baseURL,
        models: modelsArray,
        limit_budget: editForm.limit
      });
      setEditingKey(null);
      fetchKeys();
    } catch (error) {
      console.error('Failed to update key', error);
      alert('Failed to update key');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Database className="text-purple-600" />
            KeyDB Portal
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                onClose();
                onOpenAddModal();
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-sm"
            >
              <Plus size={16} />
              Add Key Manually
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900/50">
          {loading ? (
            <div className="text-center p-8 text-gray-500">Loading keys...</div>
          ) : keys.length === 0 ? (
            <div className="text-center p-8 text-gray-500">No keys found in database.</div>
          ) : (
            <div className="grid gap-4">
              {keys.map((key) => (
                <div key={key.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800 dark:text-white text-lg">{key.provider}</span>
                      {key.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                          <XCircle size={12} /> Revoked
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate mb-1">
                      Base URL: <span className="font-mono text-xs text-gray-600 dark:text-gray-300">{key.base_url || 'N/A'}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Models: {key.models?.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {key.models.map((m: string, i: number) => (
                            <span key={i} className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs truncate max-w-[150px]">{m}</span>
                          ))}
                        </div>
                      ) : 'None'}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center justify-end gap-3">
                    {key.is_active ? (
                      <div className="group relative flex">
                        <button
                          disabled
                          className="bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors text-sm w-full md:w-auto"
                        >
                          Edit
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                          cannot amend live api please revoke and then amend
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditClick(key)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm w-full md:w-auto"
                      >
                        Edit
                      </button>
                    )}
                    
                    {!key.is_active && (
                      <button
                        onClick={() => handleInvoke(key.id)}
                        disabled={invokingId === key.id}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm w-full md:w-auto"
                      >
                        {invokingId === key.id ? 'Invoking...' : 'Invoke'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingKey && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Amend KeyDB Entry</h3>
              <button onClick={() => setEditingKey(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
            </div>
            <form onSubmit={submitEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base URL</label>
                <input 
                  type="url" 
                  value={editForm.baseURL}
                  onChange={(e) => setEditForm({...editForm, baseURL: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Models (comma separated)</label>
                <input 
                  type="text" 
                  value={editForm.models}
                  onChange={(e) => setEditForm({...editForm, models: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Token Limit Budget</label>
                <input 
                  type="number" 
                  value={editForm.limit}
                  onChange={(e) => setEditForm({...editForm, limit: Number(e.target.value)})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-800 dark:text-white"
                  required
                  min="0"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setEditingKey(null)} className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
