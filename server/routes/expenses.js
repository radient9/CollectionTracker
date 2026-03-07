const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateAdmin } = require('../middleware/auth');

// GET /api/expenses?year=&month=
router.get('/', (req, res) => {
  const { year, month } = req.query;

  let expenses;
  if (year && month) {
    expenses = db.prepare(
      "SELECT * FROM expenses WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ? ORDER BY date DESC"
    ).all(String(year), String(month).padStart(2, '0'));
  } else {
    expenses = db.prepare("SELECT * FROM expenses ORDER BY date DESC").all();
  }

  res.json(expenses);
});

// POST /api/expenses — admin
router.post('/', authenticateAdmin, (req, res) => {
  const { date, amount, description, spent_by } = req.body;
  if (!description || amount === undefined || !date) {
    return res.status(400).json({ error: 'date, amount, and description are required' });
  }

  const result = db.prepare(
    "INSERT INTO expenses (date, amount, description, spent_by, recorded_by, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
  ).run(date, amount, description, spent_by || null, req.admin.name);

  const expense = db.prepare("SELECT * FROM expenses WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(expense);
});

// PUT /api/expenses/:id — admin
router.put('/:id', authenticateAdmin, (req, res) => {
  const { date, amount, description, spent_by } = req.body;
  const expense = db.prepare("SELECT * FROM expenses WHERE id = ?").get(req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });

  db.prepare(
    "UPDATE expenses SET date = ?, amount = ?, description = ?, spent_by = ? WHERE id = ?"
  ).run(date, amount, description, spent_by || null, req.params.id);

  const updated = db.prepare("SELECT * FROM expenses WHERE id = ?").get(req.params.id);
  res.json(updated);
});

// DELETE /api/expenses/:id — admin
router.delete('/:id', authenticateAdmin, (req, res) => {
  const expense = db.prepare("SELECT * FROM expenses WHERE id = ?").get(req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });

  db.prepare("DELETE FROM expenses WHERE id = ?").run(req.params.id);
  res.json({ message: 'Expense deleted' });
});

module.exports = router;
