const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userType = decoded.userType;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Public: open (unbooked, future) slots for a braider
router.get('/:braiderId', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  db.all(
    `SELECT id, braiderId, date, startTime, endTime, booked
     FROM availability
     WHERE braiderId = ? AND booked = 0 AND date >= ?
     ORDER BY date ASC, startTime ASC`,
    [req.params.braiderId, today],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    }
  );
});

// A braider's own slots (including booked ones)
router.get('/', requireAuth, (req, res) => {
  db.all(
    `SELECT id, braiderId, date, startTime, endTime, booked, bookingId
     FROM availability WHERE braiderId = ?
     ORDER BY date ASC, startTime ASC`,
    [req.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    }
  );
});

// Add a slot
router.post('/', requireAuth, (req, res) => {
  if (req.userType !== 'braider') {
    return res.status(403).json({ error: 'Only braiders set availability' });
  }
  const { date, startTime, endTime } = req.body;
  if (!date || !startTime) {
    return res.status(400).json({ error: 'Date and start time are required' });
  }
  // Avoid exact duplicates
  db.get(
    'SELECT id FROM availability WHERE braiderId = ? AND date = ? AND startTime = ?',
    [req.userId, date, startTime],
    (err, existing) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (existing) return res.status(409).json({ error: 'That slot already exists' });
      const id = uuidv4();
      db.run(
        'INSERT INTO availability (id, braiderId, date, startTime, endTime) VALUES (?, ?, ?, ?, ?)',
        [id, req.userId, date, startTime, endTime || null],
        (e2) => {
          if (e2) return res.status(500).json({ error: 'Could not add slot' });
          res.status(201).json({ id, braiderId: req.userId, date, startTime, endTime: endTime || null, booked: 0 });
        }
      );
    }
  );
});

// Remove a slot (only if not booked)
router.delete('/:id', requireAuth, (req, res) => {
  db.get('SELECT braiderId, booked FROM availability WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Slot not found' });
    if (row.braiderId !== req.userId) return res.status(403).json({ error: 'Not your slot' });
    if (row.booked) return res.status(400).json({ error: 'That slot is already booked' });
    db.run('DELETE FROM availability WHERE id = ?', [req.params.id], (e2) => {
      if (e2) return res.status(500).json({ error: 'Could not delete slot' });
      res.json({ message: 'Deleted' });
    });
  });
});

module.exports = router;
