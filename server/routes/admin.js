const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateAdmin } = require('../middleware/auth');

// GET /api/admin/flagged-members
// Members where 2 or more of the last 3 calendar months have no collection record
router.get('/flagged-members', authenticateAdmin, (req, res) => {
  const members = db.prepare(
    "SELECT id, name FROM members WHERE is_active = 1"
  ).all();

  const now = new Date();
  const last3Months = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last3Months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const flagged = [];
  for (const member of members) {
    let missingCount = 0;
    for (const { year, month } of last3Months) {
      const record = db.prepare(
        "SELECT id FROM collections WHERE member_id = ? AND year = ? AND month = ?"
      ).get(member.id, year, month);
      if (!record) missingCount++;
    }
    if (missingCount >= 2) {
      flagged.push({ id: member.id, name: member.name, missing_months: missingCount });
    }
  }

  res.json(flagged);
});

module.exports = router;
