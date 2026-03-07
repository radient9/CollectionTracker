const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { authenticateAdmin } = require('../middleware/auth');

// GET /api/members — public
router.get('/', (req, res) => {
  const members = db.prepare(
    "SELECT id, name, phone, joined_date, is_active, is_admin, opening_balance, created_at FROM members WHERE is_active = 1 ORDER BY name ASC"
  ).all();
  res.json(members);
});

// GET /api/members/:id — public
router.get('/:id', (req, res) => {
  const member = db.prepare(
    "SELECT id, name, phone, joined_date, is_active, is_admin, opening_balance, created_at FROM members WHERE id = ?"
  ).get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  const collections = db.prepare(
    "SELECT * FROM collections WHERE member_id = ? ORDER BY year DESC, month DESC"
  ).all(req.params.id);

  res.json({ ...member, collections });
});

// POST /api/members — admin
router.post('/', authenticateAdmin, (req, res) => {
  const { name, phone, joined_date, opening_balance } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const result = db.prepare(
    "INSERT INTO members (name, phone, joined_date, opening_balance, is_active, is_admin, created_at) VALUES (?, ?, ?, ?, 1, 0, datetime('now'))"
  ).run(name, phone || null, joined_date || null, opening_balance || 0);

  const member = db.prepare("SELECT * FROM members WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(member);
});

// PUT /api/members/:id — admin
router.put('/:id', authenticateAdmin, (req, res) => {
  const { name, phone, joined_date, opening_balance } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const member = db.prepare("SELECT * FROM members WHERE id = ? AND is_active = 1").get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  db.prepare(
    "UPDATE members SET name = ?, phone = ?, joined_date = ?, opening_balance = ? WHERE id = ?"
  ).run(name, phone || null, joined_date || null, opening_balance || 0, req.params.id);

  const updated = db.prepare("SELECT * FROM members WHERE id = ?").get(req.params.id);
  res.json(updated);
});

// DELETE /api/members/:id — admin (soft delete)
router.delete('/:id', authenticateAdmin, (req, res) => {
  const member = db.prepare("SELECT * FROM members WHERE id = ?").get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  db.prepare("UPDATE members SET is_active = 0 WHERE id = ?").run(req.params.id);
  res.json({ message: 'Member deactivated' });
});

// POST /api/members/:id/promote — admin
router.post('/:id/promote', authenticateAdmin, (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required' });

  const member = db.prepare("SELECT * FROM members WHERE id = ? AND is_active = 1").get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  if (member.is_admin) return res.status(400).json({ error: 'Member is already an admin' });

  const hash = bcrypt.hashSync(password, 10);
  db.prepare("UPDATE members SET is_admin = 1, password_hash = ? WHERE id = ?").run(hash, req.params.id);

  const updated = db.prepare("SELECT id, name, is_admin FROM members WHERE id = ?").get(req.params.id);
  res.json(updated);
});

// POST /api/members/:id/demote — admin
router.post('/:id/demote', authenticateAdmin, (req, res) => {
  if (parseInt(req.params.id) === req.admin.member_id) {
    return res.status(403).json({ error: 'Cannot demote yourself' });
  }

  const member = db.prepare("SELECT * FROM members WHERE id = ? AND is_active = 1").get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  db.prepare("UPDATE members SET is_admin = 0, password_hash = NULL WHERE id = ?").run(req.params.id);
  const updated = db.prepare("SELECT id, name, is_admin FROM members WHERE id = ?").get(req.params.id);
  res.json(updated);
});

module.exports = router;
