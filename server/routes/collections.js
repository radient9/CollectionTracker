const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateAdmin } = require('../middleware/auth');

// GET /api/collections?year=&month=
router.get('/', (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) {
    return res.status(400).json({ error: 'year and month query params are required' });
  }

  const members = db.prepare(
    "SELECT id, name FROM members WHERE is_active = 1 ORDER BY name ASC"
  ).all();

  const result = members.map(member => {
    const collection = db.prepare(
      "SELECT * FROM collections WHERE member_id = ? AND year = ? AND month = ?"
    ).get(member.id, parseInt(year), parseInt(month));

    return {
      member_id: member.id,
      member_name: member.name,
      collection_id: collection ? collection.id : null,
      amount_paid: collection ? collection.amount_paid : null,
      note: collection ? collection.note : null,
      recorded_by: collection ? collection.recorded_by : null,
      created_at: collection ? collection.created_at : null,
    };
  });

  res.json(result);
});

// POST /api/collections — admin
router.post('/', authenticateAdmin, (req, res) => {
  const { member_id, year, month, amount_paid, note } = req.body;
  if (!member_id || !year || !month || amount_paid === undefined) {
    return res.status(400).json({ error: 'member_id, year, month, and amount_paid are required' });
  }

  try {
    const result = db.prepare(
      "INSERT INTO collections (member_id, year, month, amount_paid, note, recorded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))"
    ).run(member_id, year, month, amount_paid, note || null, req.admin.name);

    const collection = db.prepare("SELECT * FROM collections WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(collection);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Payment record already exists for this member and month' });
    }
    throw err;
  }
});

// PUT /api/collections/:id — admin
router.put('/:id', authenticateAdmin, (req, res) => {
  const { amount_paid, note } = req.body;
  const collection = db.prepare("SELECT * FROM collections WHERE id = ?").get(req.params.id);
  if (!collection) return res.status(404).json({ error: 'Collection not found' });

  db.prepare(
    "UPDATE collections SET amount_paid = ?, note = ? WHERE id = ?"
  ).run(amount_paid, note || null, req.params.id);

  const updated = db.prepare("SELECT * FROM collections WHERE id = ?").get(req.params.id);
  res.json(updated);
});

// DELETE /api/collections/:id — admin
router.delete('/:id', authenticateAdmin, (req, res) => {
  const collection = db.prepare("SELECT * FROM collections WHERE id = ?").get(req.params.id);
  if (!collection) return res.status(404).json({ error: 'Collection not found' });

  db.prepare("DELETE FROM collections WHERE id = ?").run(req.params.id);
  res.json({ message: 'Collection deleted' });
});

module.exports = router;
