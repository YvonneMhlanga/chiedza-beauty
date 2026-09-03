const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  let userId;
  try {
    userId = jwt.verify(token, process.env.JWT_SECRET).userId;
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
  db.get('SELECT isAdmin FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row || !row.isAdmin) return res.status(403).json({ error: 'Admins only' });
    req.userId = userId;
    next();
  });
}

// Headline numbers for the admin dashboard
router.get('/stats', requireAdmin, (req, res) => {
  const out = {};
  const q = (key, sql, cb) =>
    db.get(sql, [], (err, row) => {
      out[key] = row ? Number(row.n || 0) : 0;
      cb();
    });
  q('clients', "SELECT COUNT(*) AS n FROM users WHERE userType = 'client'", () =>
    q('braiders', "SELECT COUNT(*) AS n FROM users WHERE userType = 'braider'", () =>
      q('students', 'SELECT COUNT(*) AS n FROM users WHERE isStudent = 1', () =>
        q('bookings', 'SELECT COUNT(*) AS n FROM bookings', () =>
          q('pending', "SELECT COUNT(*) AS n FROM bookings WHERE status = 'pending'", () =>
            q('confirmed', "SELECT COUNT(*) AS n FROM bookings WHERE status = 'confirmed'", () =>
              res.json(out)
            )
          )
        )
      )
    )
  );
});

// All users (light columns)
router.get('/users', requireAdmin, (req, res) => {
  db.all(
    `SELECT id, name, username, email, userType, isStudent, isAdmin, phone, location,
            occupation, hairType, createdAt
     FROM users ORDER BY createdAt DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    }
  );
});

module.exports = router;
