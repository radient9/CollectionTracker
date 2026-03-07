import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { formatINR, MONTH_NAMES } from '../utils/format';

function PaymentModal({ isOpen, onClose, onSaved, members, prefillMember, editItem }) {
  const now = new Date();
  const [form, setForm] = useState({
    member_id: prefillMember?.member_id || '',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    amount_paid: '',
    note: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editItem) {
      setForm(f => ({
        ...f,
        member_id: editItem.member_id,
        amount_paid: editItem.amount_paid,
        note: editItem.note || '',
      }));
    } else {
      setForm(f => ({
        ...f,
        member_id: prefillMember?.member_id || '',
        amount_paid: '',
        note: '',
      }));
    }
  }, [editItem, prefillMember, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editItem) {
        await axios.put(`/api/collections/${editItem.collection_id}`, {
          amount_paid: parseFloat(form.amount_paid),
          note: form.note,
        });
      } else {
        await axios.post('/api/collections', {
          member_id: parseInt(form.member_id),
          year: parseInt(form.year),
          month: parseInt(form.month),
          amount_paid: parseFloat(form.amount_paid),
          note: form.note,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save payment');
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editItem ? 'Edit Payment' : 'Record Payment'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
          <select
            value={form.member_id}
            onChange={e => setForm({ ...form, member_id: e.target.value })}
            className="input-field"
            disabled={!!editItem || !!prefillMember}
            required
          >
            <option value="">-- Select member --</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input
              type="number"
              value={form.year}
              onChange={e => setForm({ ...form, year: e.target.value })}
              className="input-field"
              disabled={!!editItem}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={form.month}
              onChange={e => setForm({ ...form, month: e.target.value })}
              className="input-field"
              disabled={!!editItem}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount ₹</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount_paid}
            onChange={e => setForm({ ...form, amount_paid: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
          <input
            type="text"
            value={form.note}
            onChange={e => setForm({ ...form, note: e.target.value })}
            className="input-field"
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
            {loading ? 'Saving...' : editItem ? 'Update Payment' : 'Record Payment'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Collections() {
  const { admin } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [collections, setCollections] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [prefillMember, setPrefillMember] = useState(null);
  const [editItem, setEditItem] = useState(null);

  const fetchCollections = () => {
    setLoading(true);
    axios.get(`/api/collections?year=${year}&month=${month}`).then(res => {
      setCollections(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    axios.get('/api/members').then(res => setMembers(res.data));
  }, []);

  useEffect(() => { fetchCollections(); }, [year, month]);

  const navigate = (dir) => {
    let m = month + dir, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment record?')) return;
    await axios.delete(`/api/collections/${id}`);
    fetchCollections();
  };

  const paidCount = collections.filter(c => c.amount_paid !== null).length;
  const totalPaid = collections.reduce((s, c) => s + (c.amount_paid || 0), 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Collections</h1>
      </div>

      {/* Month navigator */}
      <div className="card mb-6">
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 text-xl">
            ‹
          </button>
          <span className="text-lg font-semibold text-[#1e3a5f] min-w-[160px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={() => navigate(1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 text-xl">
            ›
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="table-header px-4 py-3 text-left">Member Name</th>
                    <th className="table-header px-4 py-3 text-left">Amount Paid</th>
                    <th className="table-header px-4 py-3 text-left">Note</th>
                    <th className="table-header px-4 py-3 text-left">Status</th>
                    {admin && <th className="table-header px-4 py-3 text-left">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {collections.map(row => (
                    <tr key={row.member_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{row.member_name}</td>
                      <td className="px-4 py-3">
                        {row.amount_paid !== null ? formatINR(row.amount_paid) : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{row.note || '-'}</td>
                      <td className="px-4 py-3">
                        {row.amount_paid !== null ? (
                          <span className="badge-paid">Paid</span>
                        ) : (
                          <span className="badge-unpaid">Unpaid</span>
                        )}
                      </td>
                      {admin && (
                        <td className="px-4 py-3">
                          {row.amount_paid === null ? (
                            <button
                              onClick={() => {
                                setPrefillMember(row);
                                setEditItem(null);
                                setPaymentOpen(true);
                              }}
                              className="text-xs btn-primary py-1 px-2"
                            >
                              Record Payment
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditItem(row);
                                  setPrefillMember(null);
                                  setPaymentOpen(true);
                                }}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(row.collection_id)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <span className="text-gray-600">
                {paidCount} of {collections.length} members paid
              </span>
              <span className="font-semibold text-[#1e3a5f]">
                Total: {formatINR(totalPaid)}
              </span>
            </div>
          </>
        )}
      </div>

      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => { setPaymentOpen(false); setEditItem(null); setPrefillMember(null); }}
        onSaved={fetchCollections}
        members={members}
        prefillMember={prefillMember}
        editItem={editItem}
      />
    </div>
  );
}
