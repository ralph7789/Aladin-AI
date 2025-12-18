import { useState, useEffect } from 'react';
import axios from 'axios';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

// Simplified permissions structure for UI prototype
// In production, fetch this from an API endpoint listing available permissions
const AVAILABLE_PERMISSIONS = [
  'USE',
  'CREATE',
  'UPDATE',
  'DELETE',
  'READ',
  'SHARED_READ',
  'SHARED_WRITE'
];

// Available resource types
const RESOURCE_TYPES = [
  'PROMPTS',
  'AGENTS',
  'BOOKMARKS',
  'MULTI_USER', // For managing other users
  'ROLES'
];

export default function RoleForm({ 
  role, 
  isOpen, 
  onClose, 
  onSave 
}: { 
  role: any | null, 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: () => void 
}) {
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isOpen) {
      if (role) {
        setName(role.name);
        // Flatten nested permissions if necessary, or use as is
        // Assuming role.permissions is like { PROMPTS: { USE: true, CREATE: true } }
        // We need to convert it to a simpler map for this UI or robustly handle the schema.
        // For prototype, we'll try to map the boolean structure back to arrays of strings per resource
        const mappedPerms: Record<string, string[]> = {};
        
        if (role.permissions) {
            Object.entries(role.permissions).forEach(([resource, actions]) => {
                if (typeof actions === 'object' && actions !== null) {
                    mappedPerms[resource] = Object.keys(actions).filter(k => (actions as any)[k]);
                }
            });
        }
        setPermissions(mappedPerms);
      } else {
        setName('');
        setPermissions({});
      }
    }
  }, [isOpen, role]);

  const handlePermissionChange = (resource: string, action: string, checked: boolean) => {
    setPermissions(prev => {
      const resourcePerms = prev[resource] || [];
      if (checked) {
        return { ...prev, [resource]: [...resourcePerms, action] };
      } else {
        return { ...prev, [resource]: resourcePerms.filter(p => p !== action) };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Reconstruct the permissions object to match DB Schema: { RESOURCE: { ACTION: true } }
      const payloadPermissions: Record<string, Record<string, boolean>> = {};
      Object.entries(permissions).forEach(([resource, actions]) => {
          payloadPermissions[resource] = {};
          actions.forEach(action => {
              payloadPermissions[resource][action] = true;
          });
      });

      const payload = {
        name,
        permissions: payloadPermissions
      };

      if (role) {
        await axios.put(`/api/admin/roles/${role._id}`, payload);
      } else {
        await axios.post('/api/admin/roles', payload);
      }
      onSave();
      onClose();
    } catch (error) {
      alert('Error saving role: ' + (error as any).response?.data?.message || (error as any).message);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[800px] overflow-y-auto translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none z-50 dark:bg-gray-800 dark:text-white">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-bold">
              {role ? 'Edit Role' : 'Create New Role'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X size={24} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Role Name</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. MANAGER"
              />
            </div>

            <div className="border-t pt-4 dark:border-gray-700">
              <h3 className="font-semibold mb-3">Permissions Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr>
                      <th className="p-2">Resource</th>
                      {AVAILABLE_PERMISSIONS.map(p => (
                        <th key={p} className="p-2 text-center">{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RESOURCE_TYPES.map(resource => (
                      <tr key={resource} className="border-b dark:border-gray-700">
                        <td className="p-2 font-medium">{resource}</td>
                        {AVAILABLE_PERMISSIONS.map(action => (
                          <td key={action} className="p-2 text-center">
                            <input
                              type="checkbox"
                              className="rounded dark:bg-gray-700 border-gray-300"
                              checked={(permissions[resource] || []).includes(action)}
                              onChange={e => handlePermissionChange(resource, action, e.target.checked)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                {role ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
