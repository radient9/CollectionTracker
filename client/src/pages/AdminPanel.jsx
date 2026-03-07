import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

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

export default function AdminPanel() {
  const { admin } = useAuth();
  const [members, setMembers] = useState([]);
  const [promoteTarget, setPromoteTarget] = useState(null);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const fetchMembers = () => {
    axios.get('/api/members').then(res => setMembers(res.data));
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleDemote = async (member) => {
    if (!window.confirm(`Demote ${member.name} from admin? They will lose admin access.`)) return;
    try {
      await axios.post(`/api/members/${member.id}/demote`);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to demote');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match'); return;
    }
    if (pwForm.newPassword.length < 4) {
      setPwError('New password must be at least 4 characters'); return;
    }
    setPwLoading(true);
    try {
      await axios.put('/api/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to change password');
    }
    setPwLoading(false);
  };

  const admins = members.filter(m => m.is_admin === 1);
  const nonAdmins = members.filter(m => m.is_admin === 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1e3a5f] mb-6">Admin Panel</h1>

      {/* Section 1: Manage Admins */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">Manage Admins</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="table-header px-4 py-3 text-left">Name</th>
                <th className="table-header px-4 py-3 text-left">Role</th>
                <th className="table-header px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Current admins */}
              {admins.map(m => (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3">
                    <span className="badge-admin">Admin</span>
                  </td>
                  <td className="px-4 py-3">
                    {admin && m.id !== admin.id ? (
                      <button
                        onClick={() => handleDemote(m)}
                        className="btn-danger text-xs py-1 px-3"
                      >
                        Demote
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">(You)</span>
                    )}
                  </td>
                </tr>
              ))}
              {/* Non-admins */}
              {nonAdmins.map(m => (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-gray-500">Member</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setPromoteTarget(m); setPromoteOpen(true); }}
                      className="btn-primary text-xs py-1 px-3"
                    >
                      Promote to Admin
                    </button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-400">No members found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Change Password */}
      <div className="card max-w-md">
        <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">Change My Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              className="input-field"
              required
            />
          </div>
          {pwError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {pwSuccess}
            </div>
          )}
          <button type="submit" disabled={pwLoading} className="btn-primary w-full disabled:opacity-50">
            {pwLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {promoteTarget && (
        <PromoteModal
          isOpen={promoteOpen}
          onClose={() => setPromoteOpen(false)}
          onSaved={fetchMembers}
          member={promoteTarget}
        />
      )}
    </div>
  );
}
