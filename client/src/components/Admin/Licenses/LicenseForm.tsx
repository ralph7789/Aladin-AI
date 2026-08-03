import { useState, useEffect } from 'react';
import axios from 'axios';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

const COMMON_MODELS = ['*', 'gpt-4', 'gpt-4o', 'claude-3-opus', 'gemini-pro', 'openrouter/free', 'moonshotai/kimi-k2:free'];
const COMMON_FEATURES = ['*', 'file_search', 'web_search', 'image_vision', 'execute_code', 'actions'];

export default function LicenseForm({ 
  license, 
  isOpen, 
  onClose, 
  onSave 
}: { 
  license: any | null, 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: () => void 
}) {
  const [formData, setFormData] = useState({
    name: '',
    maxChats: -1,
    models: '',
    features: ''
  });
  
  const [availableModels, setAvailableModels] = useState<string[]>(['*']);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await axios.get('/api/admin/model-management/providers');
        const models = new Set<string>();
        models.add('*');
        res.data.forEach((provider: any) => {
          provider.keys.forEach((key: any) => {
            key.supportedModels.forEach((m: string) => models.add(m));
          });
        });
        setAvailableModels(Array.from(models));
      } catch (err) {
        console.error('Error fetching models for license form', err);
      }
    };
    if (isOpen) {
      fetchModels();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (license) {
        setFormData({
          name: license.name,
          maxChats: license.maxChats,
          models: license.models?.join(', ') || '',
          features: license.features?.join(', ') || ''
        });
      } else {
        setFormData({
          name: '',
          maxChats: -1,
          models: '*',
          features: '*'
        });
      }
    }
  }, [isOpen, license]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Process arrays
      const payload = {
        ...formData,
        models: formData.models.split(',').map(s => s.trim()).filter(Boolean),
        features: formData.features.split(',').map(s => s.trim()).filter(Boolean),
        maxChats: Number(formData.maxChats)
      };

      if (license) {
        await axios.put(`/api/admin/licenses/${license._id}`, payload);
      } else {
        await axios.post('/api/admin/licenses', payload);
      }
      onSave();
      onClose();
    } catch (error) {
      alert('Error saving license: ' + (error as any).response?.data?.message || (error as any).message);
    }
  };

  const handleCheckboxToggle = (field: 'models' | 'features', value: string) => {
    const currentArray = formData[field].split(',').map(s => s.trim()).filter(Boolean);
    if (value === '*') {
      setFormData({ ...formData, [field]: '*' });
      return;
    }
    
    // Remove '*' if we are selecting specific items
    let newArray = currentArray.filter(v => v !== '*');
    
    if (newArray.includes(value)) {
      newArray = newArray.filter(v => v !== value);
    } else {
      newArray.push(value);
    }
    
    setFormData({ ...formData, [field]: newArray.join(', ') });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[600px] overflow-y-auto translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none z-50 dark:bg-gray-800 dark:text-white">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-bold">
              {license ? 'Edit License' : 'Create New License'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X size={24} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">License Name</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Max Chats (-1 for unlimited)</label>
              <input
                type="number"
                required
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                value={formData.maxChats}
                onChange={e => setFormData({...formData, maxChats: Number(e.target.value)})}
              />
            </div>

            <div className="p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <label className="block text-sm font-medium mb-2">Models</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {availableModels.map(model => (
                  <label key={model} className="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors">
                    <input
                      type="checkbox"
                      className="rounded text-blue-600 w-4 h-4"
                      checked={formData.models.split(',').map(s => s.trim()).includes(model) || (model !== '*' && formData.models.split(',').map(s => s.trim()).includes('*'))}
                      onChange={() => handleCheckboxToggle('models', model)}
                      disabled={model !== '*' && formData.models.split(',').map(s => s.trim()).includes('*')}
                    />
                    {model === '*' ? 'All Models (*)' : model}
                  </label>
                ))}
              </div>
              <input
                type="text"
                className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                value={formData.models}
                onChange={e => setFormData({...formData, models: e.target.value})}
                placeholder="Or type custom models manually (comma separated)"
              />
            </div>

            <div className="p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <label className="block text-sm font-medium mb-2">Features</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_FEATURES.map(feature => (
                  <label key={feature} className="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors">
                    <input
                      type="checkbox"
                      className="rounded text-blue-600 w-4 h-4"
                      checked={formData.features.split(',').map(s => s.trim()).includes(feature) || (feature !== '*' && formData.features.split(',').map(s => s.trim()).includes('*'))}
                      onChange={() => handleCheckboxToggle('features', feature)}
                      disabled={feature !== '*' && formData.features.split(',').map(s => s.trim()).includes('*')}
                    />
                    {feature === '*' ? 'All Features (*)' : feature}
                  </label>
                ))}
              </div>
              <input
                type="text"
                className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                value={formData.features}
                onChange={e => setFormData({...formData, features: e.target.value})}
                placeholder="Or type custom features manually (comma separated)"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                {license ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
