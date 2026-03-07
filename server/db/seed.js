const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const dbPath = path.join(__dirname, 'sangha.db');
const db = new Database(dbPath);

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

const existingAdmin = db.prepare("SELECT id FROM members WHERE name = 'Admin' AND is_admin = 1").get();

if (!existingAdmin) {
  const passwordHash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO members (name, is_admin, is_active, opening_balance, password_hash, created_at)
    VALUES (?, 1, 1, 0, ?, datetime('now'))
  `).run('Admin', passwordHash);
  console.log('Bootstrap admin created: name="Admin", password="admin123"');
} else {
  console.log('Bootstrap admin already exists, skipping.');
}

console.log('Database initialized successfully at:', dbPath);
db.close();
