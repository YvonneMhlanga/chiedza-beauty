const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// Get all salons
router.get('/', (req, res) => {
  db.all('SELECT * FROM salons', (err, salons) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(salons.map(salon => ({
      ...salon,
      services: salon.services ? JSON.parse(salon.services) : []
    })));
  });
});

// Get salon by ID
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM salons WHERE id = ?', [req.params.id], (err, salon) => {
    if (err || !salon) {
      return res.status(404).json({ error: 'Salon not found' });
    }
    res.json({
      ...salon,
      services: salon.services ? JSON.parse(salon.services) : []
    });
  });
});

// Create salon (for professionals)
router.post('/', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { name, location, phone, services, priceRange } = req.body;
    const salonId = uuidv4();

    db.run(
      'INSERT INTO salons (id, userId, name, location, phone, services, priceRange) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [salonId, decoded.userId, name, location, phone, JSON.stringify(services), priceRange],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Create failed' });
        }
        res.status(201).json({
          message: 'Salon created successfully',
          salonId
        });
      }
    );
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;