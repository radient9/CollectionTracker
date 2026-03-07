import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

function AddMemberModal({ isOpen, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', phone: '', joined_date: '', opening_balance: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/members', form);
      onSaved();
      onClose();
      setForm({ name: '', phone: '', joined_date: '', opening_balance: 0 });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Joined Date</label>
          <input
            type="date"
            value={form.joined_date}
            onChange={e => setForm({ ...form, joined_date: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prior Contributions ₹</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.opening_balance}
            onChange={e => setForm({ ...form, opening_balance: parseFloat(e.target.value) || 0 })}
            className="input-field"
          />
          <p className="text-xs text-gray-500 mt-1">
            Total amount contributed before app setup. Leave as 0 to start fresh.
          </p>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
            {loading ? 'Adding...' : 'Add Member'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Members() {
  const { admin } = useAuth();
  const [members, setMembers] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMembers = () => {
    axios.get('/api/members').then(res => {
      setMembers(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (admin) {
      axios.get('/api/admin/flagged-members').then(res => setFlagged(res.data)).catch(() => {});
    }
  }, [admin]);

  const filtered = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const flaggedIds = new Set(flagged.map(f => f.id));

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a5f]"></div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Members</h1>
        {admin && (
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            + Add Member
          </button>
        )}
      </div>

      <div className="card">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field max-w-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="table-header px-4 py-3 text-left">Name</th>
                <th className="table-header px-4 py-3 text-left">Phone</th>
                <th className="table-header px-4 py-3 text-left">Joined Date</th>
                <th className="table-header px-4 py-3 text-left">Role</th>
                <th className="table-header px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">No members found</td>
                </tr>
              ) : (
                filtered.map(m => (
                  <tr key={m.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {m.name}
                        {admin && flaggedIds.has(m.id) && (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            ⚠ Overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{m.joined_date || '-'}</td>
                    <td className="px-4 py-3">
                      {m.is_admin === 1 ? (
                        <span className="badge-admin">Admin</span>
                      ) : (
                        <span className="text-gray-500">Member</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/members/${m.id}`}
                        className="text-[#1e3a5f] hover:text-blue-700 font-medium underline underline-offset-2"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddMemberModal isOpen={addOpen} onClose={() => setAddOpen(false)} onSaved={fetchMembers} />
    </div>
  );
}
