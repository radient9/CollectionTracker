import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Navbar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [exportOpen, setExportOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExport = async (type) => {
    setExportLoading(type);
    setExportOpen(false);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/export/${type}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      const ext = type === 'excel' ? 'xlsx' : 'pdf';
      const date = new Date().toISOString().split('T')[0];
      a.download = `sangha-tracker-${date}.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    }
    setExportLoading(null);
  };

  const navLinkClass = ({ isActive }) =>
    `px-1 py-1 font-medium transition-colors duration-200 ${
      isActive
        ? 'text-orange-400 border-b-2 border-orange-400'
        : 'text-white hover:text-orange-300'
    }`;

  return (
    <nav className="bg-[#1e3a5f] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-white text-xl font-bold tracking-wide">
              Sangha Tracker
            </Link>
          </div>

          {/* Center nav links */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLink to="/" end className={navLinkClass}>Dashboard</NavLink>
            <NavLink to="/members" className={navLinkClass}>Members</NavLink>
            <NavLink to="/collections" className={navLinkClass}>Collections</NavLink>
            <NavLink to="/expenses" className={navLinkClass}>Expenses</NavLink>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {admin ? (
              <>
                {/* Export dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setExportOpen(!exportOpen)}
                    className="bg-[#f97316] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-1"
                  >
                    {exportLoading ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : null}
                    Export ▾
                  </button>
                  {exportOpen && (
                    <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border z-50">
                      <button
                        onClick={() => handleExport('excel')}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-t-lg"
                      >
                        {exportLoading === 'excel' ? '⏳ Downloading...' : '📊 Download Excel'}
                      </button>
                      <button
                        onClick={() => handleExport('pdf')}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-b-lg"
                      >
                        {exportLoading === 'pdf' ? '⏳ Downloading...' : '📄 Download PDF'}
                      </button>
                    </div>
                  )}
                </div>

                <Link
                  to="/admin"
                  className="text-white text-sm font-medium hover:text-orange-300 transition-colors"
                >
                  Admin Panel
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-white/10 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-[#f97316] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex space-x-4 pb-3">
          <NavLink to="/" end className={navLinkClass}>Dashboard</NavLink>
          <NavLink to="/members" className={navLinkClass}>Members</NavLink>
          <NavLink to="/collections" className={navLinkClass}>Collections</NavLink>
          <NavLink to="/expenses" className={navLinkClass}>Expenses</NavLink>
        </div>
      </div>

      {exportOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
      )}
    </nav>
  );
}
