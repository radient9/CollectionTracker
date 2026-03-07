CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  joined_date TEXT,
  is_active INTEGER DEFAULT 1,
  is_admin INTEGER DEFAULT 0,
  password_hash TEXT,
  opening_balance REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER REFERENCES members(id),
  year INTEGER,
  month INTEGER,
  amount_paid REAL,
  note TEXT,
  recorded_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(member_id, year, month)
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  amount REAL,
  description TEXT NOT NULL,
  spent_by TEXT,
  recorded_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
