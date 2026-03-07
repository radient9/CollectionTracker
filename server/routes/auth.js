const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { authenticateAdmin, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: 'Name and password are required' });
  }

  const member = db.prepare(
    "SELECT * FROM members WHERE name = ? AND is_admin = 1 AND is_active = 1"
  ).get(name);

  if (!member) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, member.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { member_id: member.id, name: member.name, is_admin: member.is_admin },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, member: { id: member.id, name: member.name, is_admin: member.is_admin } });
});

// GET /api/auth/me
router.get('/me', authenticateAdmin, (req, res) => {
  const member = db.prepare("SELECT * FROM members WHERE id = ?").get(req.admin.member_id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(member);
});

// PUT /api/auth/change-password
router.put('/change-password', authenticateAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required' });
  }

  const member = db.prepare("SELECT * FROM members WHERE id = ?").get(req.admin.member_id);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  const valid = bcrypt.compareSync(currentPassword, member.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE members SET password_hash = ? WHERE id = ?").run(newHash, member.id);

  res.json({ message: 'Password changed successfully' });
});

module.exports = router;
