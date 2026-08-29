const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all styles
router.get('/', (req, res) => {
  db.all('SELECT * FROM styles', (err, styles) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(styles);
  });
});

// Get style by ID
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM styles WHERE id = ?', [req.params.id], (err, style) => {
    if (err || !style) {
      return res.status(404).json({ error: 'Style not found' });
    }
    res.json(style);
  });
});

module.exports = router;
