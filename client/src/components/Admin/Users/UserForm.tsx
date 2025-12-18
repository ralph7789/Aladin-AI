import { useState, useEffect } from 'react';
import axios from 'axios';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export default function UserForm({ 
  user, 
  isOpen, 
  onClose, 
  onSave 
}: { 
  user: any | null, 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: () => void 
}) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'USER',
    license: ''
  });
  const [licenses, setLicenses] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Load licenses
      axios.get('/api/admin/licenses').then(res => setLicenses(res.data)).catch(console.error);
      // Load roles
      axios.get('/api/admin/roles').then(res => setRoles(res.data)).catch(console.error);
      
      if (user) {
        setFormData({
          username: user.username,
          email: user.email,
          password: '', // Don't show existing password
          role: user.role,
          license: user.license || ''
        });
      } else {
        setFormData({
          username: '',
          email: '',
          password: '',
          role: 'USER',
          license: ''
        });
      }
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (user) {
        await axios.put(`/api/admin/users/${user._id}`, formData);
      } else {
        await axios.post('/api/admin/users', formData);
      }
      onSave();
      onClose();
    } catch (error) {
      alert('Error saving user: ' + (error as any).response?.data?.message || (error as any).message);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none z-50 dark:bg-gray-800 dark:text-white">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-bold">
              {user ? 'Edit User' : 'Create New User'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X size={24} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Password {user && '(Leave blank to keep unchanged)'}
              </label>
              <input
                type="password"
                required={!user}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                {roles.length > 0 ? (
                    roles.map(r => (
                        <option key={r._id} value={r.name}>{r.name}</option>
                    ))
                ) : (
                    <>
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                    </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">License</label>
              <select
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                value={formData.license}
                onChange={e => setFormData({...formData, license: e.target.value})}
              >
                <option value="">-- Select License --</option>
                {licenses.map(l => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
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
                {user ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
