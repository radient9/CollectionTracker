import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatINR, MONTH_NAMES } from '../utils/format';

function StatCard({ title, value, color }) {
  const colorMap = {
    blue: 'from-blue-600 to-[#1e3a5f]',
    green: 'from-green-500 to-green-700',
    red: 'from-red-500 to-red-700',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} rounded-xl p-6 text-white shadow-lg`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/dashboard')
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a5f]"></div>
    </div>
  );

  if (!data) return <div className="text-center text-gray-500 mt-10">Failed to load dashboard</div>;

  const monthName = data.current_month ? MONTH_NAMES[data.current_month.month - 1] : '';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Biruver Kanthavara Billava Sangha</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Balance" value={formatINR(data.total_balance)} color="blue" />
        <StatCard
          title={`${monthName} Collections`}
          value={formatINR(data.current_month_collections)}
          color="green"
        />
        <StatCard
          title={`${monthName} Expenses`}
          value={formatINR(data.current_month_expenses)}
          color="red"
        />
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">Recent Activity</h2>
        {data.recent_activity.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {data.recent_activity.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    item.type === 'payment'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {item.type === 'payment' ? '₹' : '↑'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.member_name}</p>
                    <p className="text-xs text-gray-400">
                      {item.type === 'payment' ? 'Payment received' : 'Expense recorded'} •{' '}
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : ''}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${item.type === 'payment' ? 'text-green-600' : 'text-red-600'}`}>
                  {item.type === 'payment' ? '+' : '-'}{formatINR(item.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
