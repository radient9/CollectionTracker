import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { formatINR, MONTH_NAMES } from '../utils/format';

function ExpenseModal({ isOpen, onClose, onSaved, editExpense }) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [form, setForm] = useState({
    date: todayStr,
    amount: '',
    description: '',
    spent_by: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editExpense) {
      setForm({
        date: editExpense.date || todayStr,
        amount: editExpense.amount || '',
        description: editExpense.description || '',
        spent_by: editExpense.spent_by || '',
      });
    } else {
      setForm({ date: todayStr, amount: '', description: '', spent_by: '' });
    }
  }, [editExpense, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editExpense) {
        await axios.put(`/api/expenses/${editExpense.id}`, {
          ...form,
          amount: parseFloat(form.amount),
        });
      } else {
        await axios.post('/api/expenses', {
          ...form,
          amount: parseFloat(form.amount),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save expense');
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editExpense ? 'Edit Expense' : 'Add Expense'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount ₹</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <input
            type="text"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Spent By</label>
          <input
            type="text"
            value={form.spent_by}
            onChange={e => setForm({ ...form, spent_by: e.target.value })}
            className="input-field"
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
            {loading ? 'Saving...' : editExpense ? 'Update Expense' : 'Add Expense'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Expenses() {
  const { admin } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showAll, setShowAll] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);

  const fetchExpenses = () => {
    setLoading(true);
    const url = showAll
      ? '/api/expenses'
      : `/api/expenses?year=${year}&month=${month}`;
    axios.get(url).then(res => {
      setExpenses(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchExpenses(); }, [year, month, showAll]);

  const navigate = (dir) => {
    let m = month + dir, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await axios.delete(`/api/expenses/${id}`);
    fetchExpenses();
  };

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Expenses</h1>
        {admin && (
          <button onClick={() => { setEditExpense(null); setAddOpen(true); }} className="btn-primary">
            + Add Expense
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {!showAll && (
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 text-xl">
                ‹
              </button>
              <span className="text-base font-semibold text-[#1e3a5f] min-w-[140px] text-center">
                {MONTH_NAMES[month - 1]} {year}
              </span>
              <button onClick={() => navigate(1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 text-xl">
                ›
              </button>
            </div>
          )}
          <button
            onClick={() => setShowAll(!showAll)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showAll
                ? 'bg-[#f97316] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showAll ? 'Show Current Month' : 'Show All'}
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
                    <th className="table-header px-4 py-3 text-left">Date</th>
                    <th className="table-header px-4 py-3 text-left">Description</th>
                    <th className="table-header px-4 py-3 text-left">Spent By</th>
                    <th className="table-header px-4 py-3 text-right">Amount</th>
                    {admin && <th className="table-header px-4 py-3 text-left">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={admin ? 5 : 4} className="text-center py-8 text-gray-400">
                        No expenses found
                      </td>
                    </tr>
                  ) : (
                    expenses.map(e => (
                      <tr key={e.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{e.date}</td>
                        <td className="px-4 py-3 font-medium">{e.description}</td>
                        <td className="px-4 py-3 text-gray-600">{e.spent_by || '-'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">
                          {formatINR(e.amount)}
                        </td>
                        {admin && (
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setEditExpense(e); setAddOpen(true); }}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(e.id)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t text-right font-semibold text-[#1e3a5f]">
              Total: {formatINR(total)}
            </div>
          </>
        )}
      </div>

      <ExpenseModal
        isOpen={addOpen}
        onClose={() => { setAddOpen(false); setEditExpense(null); }}
        onSaved={fetchExpenses}
        editExpense={editExpense}
      />
    </div>
  );
}
