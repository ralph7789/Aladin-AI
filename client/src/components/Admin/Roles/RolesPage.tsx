import { useState, useEffect } from 'react';
import axios from 'axios';
import RoleForm from './RoleForm';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await axios.get('/api/admin/roles');
      setRoles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleEdit = (role: any) => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      await axios.delete(`/api/admin/roles/${id}`);
      fetchRoles();
    } catch (err) {
      alert('Error deleting role');
    }
  };

  if (loading) return <div>Loading roles...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white">Role Management</h2>
        <button 
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Role
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role Name</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Permissions Summary</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {roles.map((role: any) => (
              <tr key={role._id}>
                <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200 font-medium">{role.name}</td>
                <td className="px-6 py-4 dark:text-gray-200 text-sm">
                  {role.permissions ? Object.keys(role.permissions).length + ' Resources Configured' : 'No Permissions'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {role.name !== 'ADMIN' && role.name !== 'USER' && (
                    <>
                      <button 
                        onClick={() => handleEdit(role)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 mr-4"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(role._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {(role.name === 'ADMIN' || role.name === 'USER') && (
                    <span className="text-gray-400 italic">System Role</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <RoleForm 
          isOpen={isFormOpen} 
          role={selectedRole} 
          onClose={() => setIsFormOpen(false)} 
          onSave={fetchRoles} 
        />
      )}
    </div>
  );
}