import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { formatINR, MONTH_NAMES } from '../utils/format';

function EditMemberModal({ member, isOpen, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: member?.name || '',
    phone: member?.phone || '',
    joined_date: member?.joined_date || '',
    opening_balance: member?.opening_balance || 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (member) {
      setForm({
        name: member.name || '',
        phone: member.phone || '',
        joined_date: member.joined_date || '',
        opening_balance: member.opening_balance || 0,
      });
    }
  }, [member]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.put(`/api/members/${member.id}`, form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update member');
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Member">
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
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

function PaymentModal({ isOpen, onClose, onSaved, member, prefillYear, prefillMonth, editCollection }) {
  const now = new Date();
  const [form, setForm] = useState({
    member_id: member?.id || '',
    year: prefillYear || now.getFullYear(),
    month: prefillMonth || now.getMonth() + 1,
    amount_paid: '',
    note: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editCollection) {
      setForm(f => ({ ...f, amount_paid: editCollection.amount_paid, note: editCollection.note || '' }));
    } else {
      setForm(f => ({
        ...f,
        member_id: member?.id || '',
        year: prefillYear || now.getFullYear(),
        month: prefillMonth || now.getMonth() + 1,
        amount_paid: '',
        note: '',
      }));
    }
  }, [editCollection, member, prefillYear, prefillMonth, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editCollection) {
        await axios.put(`/api/collections/${editCollection.id}`, {
          amount_paid: parseFloat(form.amount_paid),
          note: form.note,
        });
      } else {
        await axios.post('/api/collections', {
          member_id: form.member_id,
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
    <Modal isOpen={isOpen} onClose={onClose} title={editCollection ? 'Edit Payment' : 'Record Payment'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
          <input type="text" value={member?.name || ''} className="input-field bg-gray-50" readOnly />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input
              type="number"
              value={form.year}
              onChange={e => setForm({ ...form, year: e.target.value })}
              className="input-field"
              disabled={!!editCollection}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={form.month}
              onChange={e => setForm({ ...form, month: e.target.value })}
              className="input-field"
              disabled={!!editCollection}
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
            {loading ? 'Saving...' : editCollection ? 'Update Payment' : 'Record Payment'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

function PromoteModal({ isOpen, onClose, onSaved, member }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 4) { setError('Password must be at least 4 characters'); return; }
    setLoading(true);
    try {
      await axios.post(`/api/members/${member.id}/promote`, { password });
      onSaved();
      onClose();
      setPassword(''); setConfirm('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to promote member');
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Promote to Admin">
      <p className="text-sm text-gray-600 mb-4">
        Granting admin access to <strong>{member?.name}</strong>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="input-field"
            required
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
            {loading ? 'Promoting...' : 'Promote to Admin'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export default function MemberProfile() {
  const { id } = useParams();
  const { admin } = useAuth();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [paymentPrefill, setPaymentPrefill] = useState({ year: null, month: null });
  const [editCollection, setEditCollection] = useState(null);

  const fetchMember = () => {
    axios.get(`/api/members/${id}`).then(res => {
      setMember(res.data);
      if (!selectedYear && res.data.collections.length > 0) {
        setSelectedYear(res.data.collections[0].year);
      } else if (!selectedYear) {
        setSelectedYear(new Date().getFullYear());
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchMember(); }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a5f]"></div>
    </div>
  );

  if (!member) return <div className="text-center text-gray-500 mt-10">Member not found</div>;

  const years = [...new Set(member.collections.map(c => c.year))].sort((a, b) => b - a);
  if (years.length === 0) years.push(new Date().getFullYear());

  const currentYearCollections = member.collections.filter(c => c.year === selectedYear);
  const collectionByMonth = {};
  currentYearCollections.forEach(c => { collectionByMonth[c.month] = c; });

  const totalContributed = (member.opening_balance || 0) +
    member.collections.reduce((s, c) => s + (c.amount_paid || 0), 0);

  const handleDeletePayment = async (cid) => {
    if (!window.confirm('Delete this payment record?')) return;
    await axios.delete(`/api/collections/${cid}`);
    fetchMember();
  };

  const handleDemote = async () => {
    if (!window.confirm(`Demote ${member.name} from admin? They will lose admin access.`)) return;
    try {
      await axios.post(`/api/members/${member.id}/demote`);
      fetchMember();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to demote');
    }
  };

  const isOwnProfile = admin && admin.id === member.id;

  return (
    <div>
      {/* Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[#1e3a5f]">{member.name}</h1>
              {member.is_admin === 1 && <span className="badge-admin">Admin</span>}
            </div>
            {member.phone && <p className="text-gray-600">📞 {member.phone}</p>}
            {member.joined_date && (
              <p className="text-gray-600">📅 Joined {new Date(member.joined_date).toLocaleDateString('en-IN')}</p>
            )}
          </div>

          {admin && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setEditOpen(true)} className="btn-secondary text-sm">
                Edit Member
              </button>
              {!isOwnProfile && (
                member.is_admin === 1 ? (
                  <button onClick={handleDemote} className="btn-danger text-sm">
                    Demote from Admin
                  </button>
                ) : (
                  <button onClick={() => setPromoteOpen(true)} className="btn-primary text-sm">
                    Promote to Admin
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Prior Contributions card */}
      {(member.opening_balance || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-amber-800">Prior Contributions (before app setup)</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">{formatINR(member.opening_balance)}</p>
        </div>
      )}

      {/* Total */}
      <div className="bg-[#1e3a5f] text-white rounded-xl p-4 mb-6">
        <p className="text-sm opacity-80">Total Contributed (All Time)</p>
        <p className="text-3xl font-bold mt-1">{formatINR(totalContributed)}</p>
      </div>

      {/* Year tabs */}
      <div className="card">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {years.map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedYear === y
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Monthly grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
            const col = collectionByMonth[month];
            const isPaid = !!col;
            return (
              <div
                key={month}
                className={`rounded-lg p-3 border-2 ${
                  isPaid ? 'border-green-200 bg-green-50' : 'border-red-100 bg-red-50'
                }`}
              >
                <p className="text-xs font-medium text-gray-500 mb-1">{MONTH_NAMES[month - 1]}</p>
                {isPaid ? (
                  <p className="text-sm font-bold text-green-700">{formatINR(col.amount_paid)}</p>
                ) : (
                  <span className="badge-unpaid text-xs">Unpaid</span>
                )}
                {admin && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {!isPaid ? (
                      <button
                        onClick={() => {
                          setPaymentPrefill({ year: selectedYear, month });
                          setEditCollection(null);
                          setPaymentOpen(true);
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Add
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setPaymentPrefill({ year: selectedYear, month });
                            setEditCollection(col);
                            setPaymentOpen(true);
                          }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDeletePayment(col.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Del
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {member && (
        <>
          <EditMemberModal
            member={member}
            isOpen={editOpen}
            onClose={() => setEditOpen(false)}
            onSaved={fetchMember}
          />
          <PaymentModal
            isOpen={paymentOpen}
            onClose={() => { setPaymentOpen(false); setEditCollection(null); }}
            onSaved={fetchMember}
            member={member}
            prefillYear={paymentPrefill.year}
            prefillMonth={paymentPrefill.month}
            editCollection={editCollection}
          />
          <PromoteModal
            isOpen={promoteOpen}
            onClose={() => setPromoteOpen(false)}
            onSaved={fetchMember}
            member={member}
          />
        </>
      )}
    </div>
  );
}
