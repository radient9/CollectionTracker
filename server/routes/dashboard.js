const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/dashboard
router.get('/', (req, res) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const openingBalance = db.prepare(
    "SELECT COALESCE(SUM(opening_balance), 0) as total FROM members WHERE is_active = 1"
  ).get().total;

  const totalCollections = db.prepare(
    "SELECT COALESCE(SUM(amount_paid), 0) as total FROM collections"
  ).get().total;

  const totalExpenses = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM expenses"
  ).get().total;

  const total_balance = openingBalance + totalCollections - totalExpenses;

  const current_month_collections = db.prepare(
    "SELECT COALESCE(SUM(amount_paid), 0) as total FROM collections WHERE year = ? AND month = ?"
  ).get(currentYear, currentMonth).total;

  const current_month_expenses = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?"
  ).get(String(currentYear), String(currentMonth).padStart(2, '0')).total;

  // Recent activity: last 5 payments + last 5 expenses, sorted by created_at DESC
  const recentPayments = db.prepare(`
    SELECT c.id, 'payment' as type, m.name as member_name, c.amount_paid as amount, c.created_at
    FROM collections c
    JOIN members m ON c.member_id = m.id
    ORDER BY c.created_at DESC
    LIMIT 5
  `).all();

  const recentExpenses = db.prepare(`
    SELECT id, 'expense' as type, description as member_name, amount, created_at
    FROM expenses
    ORDER BY created_at DESC
    LIMIT 5
  `).all();

  const recentActivity = [...recentPayments, ...recentExpenses]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  res.json({
    total_balance,
    current_month_collections,
    current_month_expenses,
    current_month: { year: currentYear, month: currentMonth },
    recent_activity: recentActivity,
  });
});

module.exports = router;
