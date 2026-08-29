const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Number of unread messages for the badge in the navbar
router.get('/unread/count', requireAuth, (req, res) => {
  db.get(
    'SELECT COUNT(*) AS count FROM messages WHERE toUserId = ? AND readAt IS NULL',
    [req.userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ count: row.count });
    }
  );
});

// All my conversations, newest first, with the other person and an unread count
router.get('/', requireAuth, (req, res) => {
  const me = req.userId;
  db.all(
    'SELECT * FROM messages WHERE fromUserId = ? OR toUserId = ? ORDER BY createdAt DESC',
    [me, me],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      const byOther = new Map();
      for (const m of rows) {
        const other = m.fromUserId === me ? m.toUserId : m.fromUserId;
        if (!byOther.has(other)) {
          byOther.set(other, {
            otherId: other,
            lastMessage: m.body,
            lastAt: m.createdAt,
            unread: 0,
          });
        }
        if (m.toUserId === me && !m.readAt) byOther.get(other).unread += 1;
      }

      const others = [...byOther.keys()];
      if (!others.length) return res.json([]);

      const placeholders = others.map(() => '?').join(',');
      db.all(
        `SELECT id, name, profileImage, userType FROM users WHERE id IN (${placeholders})`,
        others,
        (e2, users) => {
          if (e2) return res.status(500).json({ error: 'Database error' });
          const umap = {};
          users.forEach((u) => (umap[u.id] = u));
          res.json(
            [...byOther.values()].map((c) => ({
              ...c,
              user: umap[c.otherId] || { id: c.otherId, name: 'User' },
            }))
          );
        }
      );
    }
  );
});

// The full thread with one person (and mark their messages to me as read)
router.get('/:userId', requireAuth, (req, res) => {
  const me = req.userId;
  const other = req.params.userId;
  db.all(
    `SELECT * FROM messages
     WHERE (fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?)
     ORDER BY createdAt ASC`,
    [me, other, other, me],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      db.run(
        'UPDATE messages SET readAt = CURRENT_TIMESTAMP WHERE toUserId = ? AND fromUserId = ? AND readAt IS NULL',
        [me, other]
      );
      db.get(
        'SELECT id, name, profileImage, userType FROM users WHERE id = ?',
        [other],
        (e2, user) => {
          if (e2) return res.status(500).json({ error: 'Database error' });
          if (!user) return res.status(404).json({ error: 'User not found' });
          res.json({ user, messages: rows });
        }
      );
    }
  );
});

// Send a message
router.post('/', requireAuth, (req, res) => {
  const me = req.userId;
  const { toUserId } = req.body;
  const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';

  if (!toUserId || !body) {
    return res.status(400).json({ error: 'Message and recipient are required' });
  }
  if (toUserId === me) {
    return res.status(400).json({ error: 'You cannot message yourself' });
  }

  db.get('SELECT id FROM users WHERE id = ?', [toUserId], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'Recipient not found' });

    const id = uuidv4();
    db.run(
      'INSERT INTO messages (id, fromUserId, toUserId, body) VALUES (?, ?, ?, ?)',
      [id, me, toUserId, body],
      (e2) => {
        if (e2) return res.status(500).json({ error: 'Could not send message' });
        res.status(201).json({
          id,
          fromUserId: me,
          toUserId,
          body,
          readAt: null,
          createdAt: new Date().toISOString(),
        });
      }
    );
  });
});

module.exports = router;
