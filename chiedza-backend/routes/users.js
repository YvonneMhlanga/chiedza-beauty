const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

// Get all users
router.get('/', (req, res) => {
  db.all('SELECT id, name, email, phone, location, bio FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Get user by ID
router.get('/:id', (req, res) => {
  db.get('SELECT id, name, email, phone, location, bio FROM users WHERE id = ?', [req.params.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Delete account
router.delete('/:id', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.userId !== req.params.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    db.run('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Delete failed' });
      }
      res.json({ message: 'Account deleted successfully' });
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;