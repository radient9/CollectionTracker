import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, admin } = useAuth();
  const navigate = useNavigate();
  const [adminMembers, setAdminMembers] = useState([]);
  const [selectedName, setSelectedName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (admin) navigate('/');
  }, [admin, navigate]);

  useEffect(() => {
    axios.get('/api/members').then(res => {
      setAdminMembers(res.data.filter(m => m.is_admin === 1));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedName) { setError('Please select your name'); return; }
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { name: selectedName, password });
      login(res.data.token, res.data.member);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="card w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Sangha Tracker</h1>
          <p className="text-gray-500 mt-1 text-sm">Admin Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Your Name</label>
            <select
              value={selectedName}
              onChange={e => setSelectedName(e.target.value)}
              className="input-field"
            >
              <option value="">-- Select your name --</option>
              {adminMembers.map(m => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
