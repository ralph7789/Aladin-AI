import { useState, useEffect } from 'react';
import axios from 'axios';
import LicenseForm from './LicenseForm';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const res = await axios.get('/api/admin/licenses');
      setLicenses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedLicense(null);
    setIsFormOpen(true);
  };

  const handleEdit = (license: any) => {
    setSelectedLicense(license);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this license?')) return;
    try {
      await axios.delete(`/api/admin/licenses/${id}`);
      fetchLicenses();
    } catch (err) {
      alert('Error deleting license');
    }
  };

  if (loading) return <div>Loading licenses...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white">License Management</h2>
        <button 
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create License
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {licenses.map((license: any) => (
          <div key={license._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 relative">
            <button 
                onClick={() => handleDelete(license._id)}
                className="absolute top-4 right-4 text-red-500 hover:text-red-700"
            >
                ×
            </button>
            <h3 className="text-lg font-bold mb-2 dark:text-white">{license.name}</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p><strong>Models:</strong> {license.models?.join(', ') || 'All'}</p>
              <p><strong>Features:</strong> {license.features?.join(', ') || 'All'}</p>
              <p><strong>Max Chats:</strong> {license.maxChats === -1 ? 'Unlimited' : license.maxChats}</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
               <button 
                 onClick={() => handleEdit(license)}
                 className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
               >
                 Edit
               </button>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <LicenseForm 
          isOpen={isFormOpen} 
          license={selectedLicense} 
          onClose={() => setIsFormOpen(false)} 
          onSave={fetchLicenses} 
        />
      )}
    </div>
  );
}
